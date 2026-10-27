import 'package:dio/dio.dart';

import 'auth_spike_config.dart';
import 'native_cookie_vault.dart';

enum CsrfProbe { valid, missing, mismatch }

final class SafeProbeResponse {
  const SafeProbeResponse({
    required this.statusCode,
    required this.apiCode,
    required this.result,
    required this.cookies,
  });

  final int statusCode;
  final int? apiCode;
  final Map<String, dynamic>? result;
  final CookieCapture cookies;

  bool get isSuccess =>
      statusCode >= 200 && statusCode < 300 && apiCode == 1000;
}

final class AuthGrant {
  const AuthGrant({required this.accessToken, required this.response});

  final String accessToken;
  final SafeProbeResponse response;
}

/// An error whose public representation never includes headers, cookies,
/// credentials, response bodies, or tokens.
final class AuthProbeFailure implements Exception {
  const AuthProbeFailure(this.reason, {this.statusCode, this.apiCode});

  final String reason;
  final int? statusCode;
  final int? apiCode;

  @override
  String toString() =>
      'AuthProbeFailure(reason: $reason, status: $statusCode, apiCode: $apiCode)';
}

final class NativeAuthProbe {
  NativeAuthProbe({
    required AuthSpikeConfig config,
    required this.cookies,
    Dio? dio,
  }) : _config = config,
       _dio =
           dio ??
           Dio(
             BaseOptions(
               connectTimeout: config.environment.connectTimeout,
               receiveTimeout: config.environment.receiveTimeout,
               sendTimeout: config.environment.sendTimeout,
               followRedirects: false,
               validateStatus: (_) => true,
               responseType: ResponseType.json,
               contentType: Headers.jsonContentType,
             ),
           );

  final AuthSpikeConfig _config;
  final NativeCookieVault cookies;
  final Dio _dio;

  Future<AuthGrant> login(String email, String password) async {
    final response = await loginAttempt(email, password);
    return _grantFrom(response, 'Login rejected');
  }

  Future<SafeProbeResponse> loginAttempt(String email, String password) =>
      _request(
        'POST',
        '/auth/token',
        data: <String, String>{'email': email, 'password': password},
      );

  String cookieHeaderForVersion(CookieVersion version, String endpoint) =>
      cookies.cookieHeaderForVersion(_uri(endpoint), version);

  Future<AuthGrant> refresh({
    CsrfProbe csrf = CsrfProbe.valid,
    Uri? origin,
    bool sendCookies = true,
    String? cookieHeaderOverride,
    String? csrfHeaderOverride,
  }) async {
    final headers = <String, dynamic>{
      'Origin': (origin ?? _config.environment.csrfOrigin).toString(),
    };
    if (sendCookies) {
      headers['Cookie'] =
          cookieHeaderOverride ?? cookies.cookieHeader(_uri('/auth/refresh'));
    }
    switch (csrf) {
      case CsrfProbe.valid:
        headers['X-CSRF-Token'] =
            csrfHeaderOverride ?? cookies.csrfHeaderValue();
      case CsrfProbe.missing:
        break;
      case CsrfProbe.mismatch:
        headers['X-CSRF-Token'] = 'deliberately-mismatched-csrf-value';
    }
    final response = await _request('POST', '/auth/refresh', headers: headers);
    if (!response.isSuccess) {
      return AuthGrant(accessToken: '', response: response);
    }
    return _grantFrom(response, 'Refresh response invalid');
  }

  Future<SafeProbeResponse> logout({required String accessToken}) => _request(
    'POST',
    '/auth/logout',
    headers: <String, dynamic>{
      'Authorization': 'Bearer $accessToken',
      'Origin': _config.environment.csrfOrigin.toString(),
      'Cookie': cookies.cookieHeader(_uri('/auth/logout')),
      'X-CSRF-Token': cookies.csrfHeaderValue(),
    },
  );

  Future<SafeProbeResponse> currentUser(String accessToken) => _request(
    'GET',
    '/users/me',
    headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'},
  );

  Future<SafeProbeResponse> adminUsers(String accessToken) => _request(
    'GET',
    '/users?page=0&size=1',
    headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'},
  );

  Future<SafeProbeResponse> _request(
    String method,
    String path, {
    Object? data,
    Map<String, dynamic>? headers,
  }) async {
    final uri = _uri(path);
    try {
      final response = await _dio.requestUri<Object?>(
        uri,
        data: data,
        options: Options(method: method, headers: headers),
      );
      final statusCode = response.statusCode ?? 0;
      if (statusCode >= 300 && statusCode < 400) {
        throw AuthProbeFailure('Redirect rejected', statusCode: statusCode);
      }
      final cookieCapture = cookies.capture(
        uri,
        response.headers['set-cookie'] ?? const <String>[],
      );
      final body = response.data;
      final json = body is Map<String, dynamic>
          ? body
          : body is Map
          ? Map<String, dynamic>.from(body)
          : null;
      final rawResult = json?['result'];
      final result = rawResult is Map<String, dynamic>
          ? rawResult
          : rawResult is Map
          ? Map<String, dynamic>.from(rawResult)
          : null;
      return SafeProbeResponse(
        statusCode: statusCode,
        apiCode: json?['code'] as int?,
        result: result,
        cookies: cookieCapture,
      );
    } on AuthProbeFailure {
      rethrow;
    } on DioException catch (error) {
      throw AuthProbeFailure('Transport ${error.type.name}');
    } on FormatException {
      throw const AuthProbeFailure('Response format invalid');
    }
  }

  AuthGrant _grantFrom(SafeProbeResponse response, String reason) {
    if (!response.isSuccess) {
      throw AuthProbeFailure(
        reason,
        statusCode: response.statusCode,
        apiCode: response.apiCode,
      );
    }
    final accessToken = response.result?['accessToken'];
    final tokenType = response.result?['tokenType'];
    final authenticated = response.result?['authenticated'];
    if (accessToken is! String ||
        accessToken.isEmpty ||
        tokenType != 'Bearer' ||
        authenticated != true) {
      throw const AuthProbeFailure('Authentication envelope invalid');
    }
    return AuthGrant(accessToken: accessToken, response: response);
  }

  Uri _uri(String relativePath) {
    final base = _config.environment.apiBaseUri;
    final basePath = base.path.endsWith('/')
        ? base.path.substring(0, base.path.length - 1)
        : base.path;
    return base.replace(
      path: '$basePath$relativePath',
      query: null,
      fragment: null,
    );
  }
}

bool responseHasRole(SafeProbeResponse response, String expectedRole) {
  final roles = response.result?['roles'];
  if (roles is! List) return false;
  return roles.any((role) => role is Map && role['name'] == expectedRole);
}

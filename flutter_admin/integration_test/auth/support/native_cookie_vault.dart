import 'dart:convert';
import 'dart:io';

import 'package:flutter_admin/core/security/secure_session_store.dart';

final class CookieObservation {
  const CookieObservation({
    required this.name,
    required this.httpOnly,
    required this.secure,
    required this.path,
    required this.sameSite,
    required this.removed,
  });

  final String name;
  final bool httpOnly;
  final bool secure;
  final String? path;
  final String? sameSite;
  final bool removed;
}

final class CookieCapture {
  const CookieCapture(this.observations);

  final List<CookieObservation> observations;

  CookieObservation? named(String name) {
    for (final observation in observations) {
      if (observation.name == name) return observation;
    }
    return null;
  }
}

final class CookieVersion {
  const CookieVersion._(this._refreshValue, this._csrfValue);

  final String? _refreshValue;
  final String? _csrfValue;
}

final class _StoredCookie {
  const _StoredCookie({
    required this.name,
    required this.value,
    required this.host,
    required this.path,
    required this.secure,
    required this.httpOnly,
    required this.sameSite,
    required this.expiresAt,
  });

  final String name;
  final String value;
  final String host;
  final String path;
  final bool secure;
  final bool httpOnly;
  final String? sameSite;
  final DateTime? expiresAt;

  bool get isExpired => expiresAt?.isBefore(DateTime.now().toUtc()) ?? false;

  Map<String, Object?> toJson() => <String, Object?>{
    'name': name,
    'value': value,
    'host': host,
    'path': path,
    'secure': secure,
    'httpOnly': httpOnly,
    'sameSite': sameSite,
    'expiresAt': expiresAt?.toIso8601String(),
  };

  static _StoredCookie fromJson(Map<String, dynamic> json) {
    final expiresAt = json['expiresAt'] as String?;
    return _StoredCookie(
      name: json['name']! as String,
      value: json['value']! as String,
      host: json['host']! as String,
      path: json['path']! as String,
      secure: json['secure']! as bool,
      httpOnly: json['httpOnly']! as bool,
      sameSite: json['sameSite'] as String?,
      expiresAt: expiresAt == null ? null : DateTime.parse(expiresAt).toUtc(),
    );
  }
}

/// A deliberately small cookie jar for the native authentication spike.
///
/// It accepts only the two configured authentication cookies, persists their
/// values only through [SecureSessionStore], and refuses to emit them to any
/// origin other than the configured API origin.
final class NativeCookieVault {
  NativeCookieVault({
    required Uri apiBaseUri,
    required this.refreshCookieName,
    required this.csrfCookieName,
    required SecureSessionStore secureStore,
    this.storageKey = 'auth_compatibility_spike.cookies.v1',
  }) : _apiOrigin = _origin(apiBaseUri),
       _secureStore = secureStore;

  final String refreshCookieName;
  final String csrfCookieName;
  final String storageKey;
  final String _apiOrigin;
  final SecureSessionStore _secureStore;
  final Map<String, _StoredCookie> _cookies = <String, _StoredCookie>{};

  bool get hasSession =>
      _liveCookie(refreshCookieName) != null &&
      _liveCookie(csrfCookieName) != null;

  CookieVersion version() => CookieVersion._(
    _liveCookie(refreshCookieName)?.value,
    _liveCookie(csrfCookieName)?.value,
  );

  bool rotatedSince(CookieVersion oldVersion) {
    final refresh = _liveCookie(refreshCookieName)?.value;
    final csrf = _liveCookie(csrfCookieName)?.value;
    return refresh != null &&
        csrf != null &&
        refresh != oldVersion._refreshValue &&
        csrf != oldVersion._csrfValue;
  }

  String cookieHeaderForVersion(Uri requestUri, CookieVersion version) {
    _requireApiOrigin(requestUri);
    final refresh = version._refreshValue;
    final csrf = version._csrfValue;
    if (refresh == null || csrf == null) {
      throw StateError('Cookie version is incomplete.');
    }
    return '$refreshCookieName=$refresh; $csrfCookieName=$csrf';
  }

  String csrfHeaderForVersion(CookieVersion version) {
    final csrf = version._csrfValue;
    if (csrf == null) throw StateError('Cookie version is incomplete.');
    return csrf;
  }

  CookieCapture capture(Uri responseUri, List<String> setCookieHeaders) {
    _requireApiOrigin(responseUri);
    final observations = <CookieObservation>[];
    for (final header in setCookieHeaders) {
      final parsed = Cookie.fromSetCookieValue(header);
      if (parsed.name != refreshCookieName && parsed.name != csrfCookieName) {
        continue;
      }
      final removed = parsed.value.isEmpty || parsed.maxAge == 0;
      final sameSite = _sameSiteName(parsed.sameSite);
      observations.add(
        CookieObservation(
          name: parsed.name,
          httpOnly: parsed.httpOnly,
          secure: parsed.secure,
          path: parsed.path,
          sameSite: sameSite,
          removed: removed,
        ),
      );
      if (removed) {
        _cookies.remove(parsed.name);
        continue;
      }
      final expiresAt = parsed.maxAge == null
          ? parsed.expires?.toUtc()
          : DateTime.now().toUtc().add(Duration(seconds: parsed.maxAge!));
      _cookies[parsed.name] = _StoredCookie(
        name: parsed.name,
        value: parsed.value,
        host: responseUri.host.toLowerCase(),
        path: parsed.path ?? '/',
        secure: parsed.secure,
        httpOnly: parsed.httpOnly,
        sameSite: sameSite,
        expiresAt: expiresAt,
      );
    }
    return CookieCapture(List.unmodifiable(observations));
  }

  String cookieHeader(Uri requestUri) {
    _requireApiOrigin(requestUri);
    final cookies = <_StoredCookie>[];
    final refresh = _liveCookie(refreshCookieName);
    final csrf = _liveCookie(csrfCookieName);
    if (refresh != null) {
      cookies.add(refresh);
    }
    if (csrf != null) {
      cookies.add(csrf);
    }
    for (final cookie in cookies) {
      if (cookie.host != requestUri.host.toLowerCase() ||
          !requestUri.path.startsWith(cookie.path) ||
          (cookie.secure && requestUri.scheme != 'https')) {
        throw StateError('Authentication cookie destination rejected.');
      }
    }
    return cookies.map((cookie) => '${cookie.name}=${cookie.value}').join('; ');
  }

  String csrfHeaderValue() {
    final cookie = _liveCookie(csrfCookieName);
    if (cookie == null) throw StateError('CSRF cookie is unavailable.');
    return cookie.value;
  }

  Future<void> persist() async {
    _removeExpired();
    final payload = jsonEncode(
      _cookies.values.map((cookie) => cookie.toJson()).toList(growable: false),
    );
    await _secureStore.write(storageKey, payload);
  }

  Future<bool> restore() async {
    _cookies.clear();
    final payload = await _secureStore.read(storageKey);
    if (payload == null || payload.isEmpty) return false;
    final decoded = jsonDecode(payload);
    if (decoded is! List<dynamic>) {
      throw const FormatException('Stored authentication cookies are invalid.');
    }
    for (final item in decoded) {
      if (item is! Map<String, dynamic>) {
        throw const FormatException(
          'Stored authentication cookies are invalid.',
        );
      }
      final cookie = _StoredCookie.fromJson(item);
      if (cookie.name != refreshCookieName && cookie.name != csrfCookieName) {
        continue;
      }
      if (cookie.host != Uri.parse(_apiOrigin).host.toLowerCase()) {
        throw StateError('Stored authentication cookie host rejected.');
      }
      if (!cookie.isExpired) _cookies[cookie.name] = cookie;
    }
    return hasSession;
  }

  Future<void> clear() async {
    _cookies.clear();
    await _secureStore.delete(storageKey);
  }

  _StoredCookie? _liveCookie(String name) {
    final cookie = _cookies[name];
    if (cookie?.isExpired ?? false) {
      _cookies.remove(name);
      return null;
    }
    return cookie;
  }

  void _removeExpired() {
    _cookies.removeWhere((_, cookie) => cookie.isExpired);
  }

  void _requireApiOrigin(Uri uri) {
    if (_origin(uri) != _apiOrigin) {
      throw StateError('Authentication cookie origin rejected.');
    }
  }

  static String _origin(Uri uri) {
    final defaultPort = uri.scheme == 'https' ? 443 : 80;
    final port = uri.hasPort && uri.port != defaultPort ? ':${uri.port}' : '';
    return '${uri.scheme}://${uri.host.toLowerCase()}$port';
  }

  static String? _sameSiteName(SameSite? sameSite) {
    if (sameSite == null) return null;
    final name = sameSite.name;
    return '${name[0].toUpperCase()}${name.substring(1)}';
  }
}

import 'dart:io';

import 'package:dio/dio.dart';

import '../config/app_environment.dart';
import 'api_envelope.dart';
import 'network_failure.dart';

class ApiClient {
  ApiClient({required AppEnvironment environment, Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: environment.apiBaseUri.toString(),
              connectTimeout: environment.connectTimeout,
              receiveTimeout: environment.receiveTimeout,
              sendTimeout: environment.sendTimeout,
              contentType: Headers.jsonContentType,
              responseType: ResponseType.json,
            ),
          );

  final Dio _dio;

  Dio get dio => _dio;

  Future<ApiEnvelope<T>> request<T>(
    String path, {
    String method = 'GET',
    Object? data,
    Map<String, dynamic>? queryParameters,
    required T Function(Object? json) decodeResult,
  }) async {
    try {
      final response = await _dio.request<Object?>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(method: method),
      );
      final body = response.data;
      if (body is! Map) {
        throw const NetworkFailure(kind: NetworkFailureKind.malformedResponse);
      }
      final envelope = ApiEnvelope<T>.fromJson(
        Map<String, dynamic>.from(body),
        decodeResult,
      );
      if (!envelope.isSuccess) {
        throw _fromApiCode(envelope.code, response.statusCode);
      }
      return envelope;
    } on NetworkFailure {
      rethrow;
    } on DioException catch (error) {
      throw _fromDio(error);
    }
  }

  NetworkFailure _fromDio(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return const NetworkFailure(kind: NetworkFailureKind.timeout);
    }
    if (error.error is SocketException ||
        error.type == DioExceptionType.connectionError) {
      return const NetworkFailure(kind: NetworkFailureKind.offline);
    }
    final data = error.response?.data;
    final apiCode = data is Map ? data['code'] : null;
    return _fromApiCode(
      apiCode is int ? apiCode : null,
      error.response?.statusCode,
    );
  }

  NetworkFailure _fromApiCode(int? code, int? statusCode) {
    final kind = switch (code) {
      1007 || 1026 => NetworkFailureKind.unauthenticated,
      1008 || 1057 => NetworkFailureKind.forbidden,
      1013 => NetworkFailureKind.disabled,
      1030 || 1031 || 1006 => NetworkFailureKind.notFound,
      1027 ||
      1040 ||
      1041 ||
      1042 ||
      1047 ||
      1058 => NetworkFailureKind.conflict,
      1023 => NetworkFailureKind.rateLimited,
      _ when code != null && code >= 1001 && code < 1100 =>
        NetworkFailureKind.validation,
      _ when statusCode != null && statusCode >= 500 =>
        NetworkFailureKind.server,
      _ => NetworkFailureKind.unknown,
    };
    return NetworkFailure(kind: kind, apiCode: code);
  }
}

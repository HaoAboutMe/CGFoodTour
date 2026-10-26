enum NetworkFailureKind {
  unauthenticated,
  forbidden,
  disabled,
  validation,
  conflict,
  notFound,
  rateLimited,
  offline,
  timeout,
  server,
  malformedResponse,
  unknown,
}

class NetworkFailure implements Exception {
  const NetworkFailure({required this.kind, this.apiCode, this.correlationId});

  final NetworkFailureKind kind;
  final int? apiCode;
  final String? correlationId;

  @override
  String toString() => 'NetworkFailure(kind: $kind, apiCode: $apiCode)';
}

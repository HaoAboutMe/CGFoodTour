enum AppEnvironmentName {
  localAndroid,
  localIos,
  localDevice,
  staging,
  production,
}

class AppEnvironment {
  AppEnvironment({
    required this.name,
    required this.apiBaseUri,
    required this.csrfOrigin,
    required this.allowInsecureHttp,
    this.connectTimeout = const Duration(seconds: 10),
    this.receiveTimeout = const Duration(seconds: 20),
    this.sendTimeout = const Duration(seconds: 20),
    this.enableDiagnosticLogging = false,
  });

  final AppEnvironmentName name;
  final Uri apiBaseUri;
  final Uri csrfOrigin;
  final bool allowInsecureHttp;
  final Duration connectTimeout;
  final Duration receiveTimeout;
  final Duration sendTimeout;
  final bool enableDiagnosticLogging;

  bool get isProduction => name == AppEnvironmentName.production;
  bool get isLocal => switch (name) {
    AppEnvironmentName.localAndroid ||
    AppEnvironmentName.localIos ||
    AppEnvironmentName.localDevice => true,
    AppEnvironmentName.staging || AppEnvironmentName.production => false,
  };

  void validate({required bool isDebug}) {
    if (!apiBaseUri.isAbsolute || apiBaseUri.host.isEmpty) {
      throw const FormatException('API_BASE_URL phải là URL tuyệt đối.');
    }
    if (!csrfOrigin.isAbsolute || csrfOrigin.host.isEmpty) {
      throw const FormatException('CSRF_ORIGIN phải là URL tuyệt đối.');
    }
    if (apiBaseUri.path != '/api' && !apiBaseUri.path.endsWith('/api')) {
      throw const FormatException('API_BASE_URL phải bao gồm đường dẫn /api.');
    }
    final usesHttps =
        apiBaseUri.scheme == 'https' && csrfOrigin.scheme == 'https';
    if (!isLocal && !usesHttps) {
      throw const FormatException('Staging và production bắt buộc dùng HTTPS.');
    }
    if (!usesHttps && (!isDebug || !allowInsecureHttp)) {
      throw const FormatException(
        'HTTP chỉ được phép trong debug khi ALLOW_INSECURE_HTTP=true.',
      );
    }
  }

  factory AppEnvironment.fromCompileTime({required bool isDebug}) {
    const rawName = String.fromEnvironment(
      'APP_ENV',
      defaultValue: 'localAndroid',
    );
    final name = AppEnvironmentName.values.firstWhere(
      (value) => value.name == rawName,
      orElse: () => throw FormatException('APP_ENV không hợp lệ: $rawName'),
    );
    final defaultApiUrl = switch (name) {
      AppEnvironmentName.localAndroid => 'http://10.0.2.2:8080/api',
      AppEnvironmentName.localIos => 'http://127.0.0.1:8080/api',
      AppEnvironmentName.localDevice ||
      AppEnvironmentName.staging ||
      AppEnvironmentName.production => '',
    };
    const configuredApiUrl = String.fromEnvironment('API_BASE_URL');
    const configuredOrigin = String.fromEnvironment('CSRF_ORIGIN');
    const allowInsecureHttp = bool.fromEnvironment(
      'ALLOW_INSECURE_HTTP',
      defaultValue: true,
    );
    final apiUrl = configuredApiUrl.isEmpty ? defaultApiUrl : configuredApiUrl;
    if (apiUrl.isEmpty) {
      throw FormatException(
        'API_BASE_URL là bắt buộc cho môi trường $rawName.',
      );
    }
    final environment = AppEnvironment(
      name: name,
      apiBaseUri: Uri.parse(apiUrl),
      csrfOrigin: Uri.parse(
        configuredOrigin.isEmpty ? 'http://localhost:5173' : configuredOrigin,
      ),
      allowInsecureHttp: allowInsecureHttp,
      enableDiagnosticLogging: isDebug,
    );
    environment.validate(isDebug: isDebug);
    return environment;
  }
}

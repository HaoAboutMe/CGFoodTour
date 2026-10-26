import 'package:flutter_admin/core/config/app_environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  AppEnvironment environment({
    required AppEnvironmentName name,
    required String apiUrl,
    required String origin,
    bool allowHttp = false,
  }) => AppEnvironment(
    name: name,
    apiBaseUri: Uri.parse(apiUrl),
    csrfOrigin: Uri.parse(origin),
    allowInsecureHttp: allowHttp,
  );

  test('accepts explicitly enabled local HTTP in debug', () {
    expect(
      () => environment(
        name: AppEnvironmentName.localAndroid,
        apiUrl: 'http://10.0.2.2:8080/api',
        origin: 'http://localhost:5173',
        allowHttp: true,
      ).validate(isDebug: true),
      returnsNormally,
    );
  });

  test('rejects local HTTP in release', () {
    expect(
      () => environment(
        name: AppEnvironmentName.localAndroid,
        apiUrl: 'http://10.0.2.2:8080/api',
        origin: 'http://localhost:5173',
        allowHttp: true,
      ).validate(isDebug: false),
      throwsFormatException,
    );
  });

  test('rejects staging and production HTTP', () {
    for (final name in [
      AppEnvironmentName.staging,
      AppEnvironmentName.production,
    ]) {
      expect(
        () => environment(
          name: name,
          apiUrl: 'http://example.test/api',
          origin: 'http://admin.example.test',
          allowHttp: true,
        ).validate(isDebug: true),
        throwsFormatException,
      );
    }
  });

  test('accepts HTTPS production configuration', () {
    expect(
      () => environment(
        name: AppEnvironmentName.production,
        apiUrl: 'https://api.example.test/api',
        origin: 'https://admin.example.test',
      ).validate(isDebug: false),
      returnsNormally,
    );
  });
}

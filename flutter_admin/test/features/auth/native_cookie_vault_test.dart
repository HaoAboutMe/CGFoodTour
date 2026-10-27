import 'package:flutter_admin/core/security/secure_session_store.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../../integration_test/auth/support/native_auth_probe.dart';
import '../../../integration_test/auth/support/native_cookie_vault.dart';

void main() {
  const refreshName = 'cgft_refresh';
  const csrfName = 'cgft_csrf';
  final apiBase = Uri.parse('http://10.0.2.2:8080/api');
  late _MemorySecureStore secureStore;
  late NativeCookieVault vault;

  setUp(() {
    secureStore = _MemorySecureStore();
    vault = NativeCookieVault(
      apiBaseUri: apiBase,
      refreshCookieName: refreshName,
      csrfCookieName: csrfName,
      secureStore: secureStore,
    );
  });

  test(
    'captures attributes and restores both cookies from secure storage',
    () async {
      final capture = vault.capture(apiBase.resolve('auth/token'), const <
        String
      >[
        '$refreshName=refresh-placeholder; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict',
        '$csrfName=csrf-placeholder; Path=/; Max-Age=3600; SameSite=Strict',
      ]);

      expect(capture.named(refreshName)?.httpOnly, isTrue);
      expect(capture.named(csrfName)?.httpOnly, isFalse);
      expect(capture.named(refreshName)?.sameSite, 'Strict');
      expect(vault.hasSession, isTrue);
      expect(
        vault
            .cookieHeader(apiBase.resolve('auth/refresh'))
            .contains(refreshName),
        isTrue,
      );

      await vault.persist();
      final restored = NativeCookieVault(
        apiBaseUri: apiBase,
        refreshCookieName: refreshName,
        csrfCookieName: csrfName,
        secureStore: secureStore,
      );
      expect(await restored.restore(), isTrue);
      expect(restored.hasSession, isTrue);
      expect(restored.csrfHeaderValue().isNotEmpty, isTrue);
    },
  );

  test('never emits authentication cookies to a different API origin', () {
    vault.capture(apiBase.resolve('auth/token'), const <String>[
      '$refreshName=refresh-placeholder; Path=/; HttpOnly; SameSite=Strict',
      '$csrfName=csrf-placeholder; Path=/; SameSite=Strict',
    ]);

    expect(
      () => vault.cookieHeader(
        Uri.parse('http://10.0.2.2:9090/api/auth/refresh'),
      ),
      throwsStateError,
    );
  });

  test('does not send Secure cookies over HTTP', () {
    vault.capture(apiBase.resolve('auth/token'), const <String>[
      '$refreshName=refresh-placeholder; Path=/; Secure; HttpOnly; SameSite=Strict',
      '$csrfName=csrf-placeholder; Path=/; Secure; SameSite=Strict',
    ]);

    expect(
      () => vault.cookieHeader(apiBase.resolve('auth/refresh')),
      throwsStateError,
    );
  });

  test(
    'removes expired session cookies and deletes only the spike key',
    () async {
      vault.capture(apiBase.resolve('auth/token'), const <String>[
        '$refreshName=refresh-placeholder; Path=/; HttpOnly; SameSite=Strict',
        '$csrfName=csrf-placeholder; Path=/; SameSite=Strict',
      ]);
      await vault.persist();
      final capture = vault
          .capture(apiBase.resolve('auth/logout'), const <String>[
            '$refreshName=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict',
            '$csrfName=; Path=/; Max-Age=0; SameSite=Strict',
          ]);
      expect(capture.named(refreshName)?.removed, isTrue);
      expect(capture.named(csrfName)?.removed, isTrue);
      expect(vault.hasSession, isFalse);

      await vault.clear();
      expect(secureStore.values, isEmpty);
    },
  );

  test('probe failure text cannot disclose response secrets', () {
    const failure = AuthProbeFailure(
      'Refresh rejected',
      statusCode: 401,
      apiCode: 1007,
    );
    expect(failure.toString(), contains('401'));
    expect(failure.toString(), isNot(contains('refresh-placeholder')));
  });
}

final class _MemorySecureStore implements SecureSessionStore {
  final Map<String, String> values = <String, String>{};

  @override
  Future<void> clear() async => values.clear();

  @override
  Future<void> delete(String key) async => values.remove(key);

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async => values[key] = value;
}

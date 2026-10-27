import 'package:flutter_admin/core/security/secure_session_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'support/auth_spike_config.dart';
import 'support/native_auth_probe.dart';
import 'support/native_cookie_vault.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  final config = AuthSpikeConfig.fromCompileTime();
  final prerequisiteFailure = config.prerequisiteFailure();

  testWidgets(
    'Android Admin login, CSRF, rotation, secure restore, logout and revocation',
    (_) async {
      final store = PlatformSecureSessionStore();
      final vault = _vault(config, store);
      final probe = NativeAuthProbe(config: config, cookies: vault);

      switch (config.phase) {
        case AuthSpikePhase.seed:
          await vault.clear();
          final grant = await probe.login(
            config.adminEmail,
            config.adminPassword,
          );
          _expectSessionCookies(config, grant.response.cookies);
          expect(grant.accessToken.isNotEmpty, isTrue);
          await vault.persist();
          expect(await vault.restore(), isTrue);
          return;
        case AuthSpikePhase.restore:
          expect(await vault.restore(), isTrue);
          final restored = await probe.refresh();
          expect(restored.response.isSuccess, isTrue);
          final me = await probe.currentUser(restored.accessToken);
          expect(me.isSuccess, isTrue);
          expect(responseHasRole(me, 'ADMIN'), isTrue);
          final logout = await probe.logout(accessToken: restored.accessToken);
          expect(logout.isSuccess, isTrue);
          await vault.clear();
          return;
        case AuthSpikePhase.full:
          break;
      }

      await vault.clear();
      final login = await probe.login(config.adminEmail, config.adminPassword);
      expect(login.response.isSuccess, isTrue);
      expect(login.accessToken.isNotEmpty, isTrue);
      _expectSessionCookies(config, login.response.cookies);
      expect(vault.hasSession, isTrue);

      final me = await probe.currentUser(login.accessToken);
      expect(me.isSuccess, isTrue);
      expect(responseHasRole(me, 'ADMIN'), isTrue);
      expect((me.result?['enabled'] as bool?) == true, isTrue);

      final adminResource = await probe.adminUsers(login.accessToken);
      expect(adminResource.isSuccess, isTrue);

      _expectCsrfRejection(await probe.refresh(csrf: CsrfProbe.missing));
      _expectCsrfRejection(await probe.refresh(csrf: CsrfProbe.mismatch));
      _expectForbiddenOrCsrf(await probe.refresh(origin: config.invalidOrigin));
      _expectCsrfRejection(await probe.refresh(sendCookies: false));

      final oldVersion = vault.version();
      final refreshed = await probe.refresh();
      expect(refreshed.response.isSuccess, isTrue);
      expect(refreshed.accessToken.isNotEmpty, isTrue);
      _expectSessionCookies(config, refreshed.response.cookies);
      expect(vault.rotatedSince(oldVersion), isTrue);

      final reused = await probe.refresh(
        cookieHeaderOverride: probe.cookieHeaderForVersion(
          oldVersion,
          '/auth/refresh',
        ),
        csrfHeaderOverride: vault.csrfHeaderForVersion(oldVersion),
      );
      expect(reused.response.isSuccess, isFalse);
      expect(reused.response.statusCode, 401);
      expect(reused.response.apiCode, 1007);

      await vault.persist();
      final restoredVault = _vault(config, store);
      expect(await restoredVault.restore(), isTrue);
      final restoredProbe = NativeAuthProbe(
        config: config,
        cookies: restoredVault,
      );
      final afterRestore = await restoredProbe.refresh();
      expect(afterRestore.response.isSuccess, isTrue);
      expect(afterRestore.accessToken.isNotEmpty, isTrue);

      final beforeLogout = restoredVault.version();
      final logout = await restoredProbe.logout(
        accessToken: afterRestore.accessToken,
      );
      expect(logout.isSuccess, isTrue);
      _expectClearedCookies(config, logout.cookies);
      expect(restoredVault.hasSession, isFalse);
      await restoredVault.clear();

      final revokedAccess = await restoredProbe.currentUser(
        afterRestore.accessToken,
      );
      expect(revokedAccess.isSuccess, isFalse);
      expect(revokedAccess.statusCode, 401);

      final revokedRefresh = await restoredProbe.refresh(
        cookieHeaderOverride: restoredProbe.cookieHeaderForVersion(
          beforeLogout,
          '/auth/refresh',
        ),
        csrfHeaderOverride: restoredVault.csrfHeaderForVersion(beforeLogout),
      );
      expect(revokedRefresh.response.isSuccess, isFalse);
      expect(revokedRefresh.response.statusCode, 401);
      expect(revokedRefresh.response.apiCode, 1007);
    },
    skip: prerequisiteFailure != null,
  );

  testWidgets(
    'Android USER is authenticated but cannot access an Admin resource',
    (_) async {
      final store = PlatformSecureSessionStore();
      final vault = _vault(config, store, suffix: 'user');
      final probe = NativeAuthProbe(config: config, cookies: vault);
      await vault.clear();
      final login = await probe.login(config.userEmail, config.userPassword);
      final me = await probe.currentUser(login.accessToken);
      expect(me.isSuccess, isTrue);
      expect(responseHasRole(me, 'ADMIN'), isFalse);
      final adminResource = await probe.adminUsers(login.accessToken);
      expect(adminResource.isSuccess, isFalse);
      expect(adminResource.statusCode, 403);
      final logout = await probe.logout(accessToken: login.accessToken);
      expect(logout.isSuccess, isTrue);
      await vault.clear();
    },
    skip:
        prerequisiteFailure != null ||
        config.phase != AuthSpikePhase.full ||
        !config.hasUserCredentials,
  );

  testWidgets(
    'Android disabled Admin login follows the Backend contract',
    (_) async {
      final store = PlatformSecureSessionStore();
      final vault = _vault(config, store, suffix: 'disabled');
      final probe = NativeAuthProbe(config: config, cookies: vault);
      await vault.clear();
      final response = await probe.loginAttempt(
        config.disabledAdminEmail,
        config.disabledAdminPassword,
      );
      expect(response.isSuccess, isFalse);
      expect(response.statusCode, 403);
      expect(response.apiCode, 1013);
      expect(vault.hasSession, isFalse);
    },
    skip:
        prerequisiteFailure != null ||
        config.phase != AuthSpikePhase.full ||
        !config.hasDisabledAdminCredentials,
  );
}

NativeCookieVault _vault(
  AuthSpikeConfig config,
  SecureSessionStore store, {
  String suffix = 'admin',
}) => NativeCookieVault(
  apiBaseUri: config.environment.apiBaseUri,
  refreshCookieName: config.refreshCookieName,
  csrfCookieName: config.csrfCookieName,
  secureStore: store,
  storageKey: 'auth_compatibility_spike.cookies.v1.$suffix',
);

void _expectSessionCookies(AuthSpikeConfig config, CookieCapture capture) {
  final refresh = capture.named(config.refreshCookieName);
  final csrf = capture.named(config.csrfCookieName);
  expect(refresh != null, isTrue);
  expect(csrf != null, isTrue);
  expect(refresh!.httpOnly, isTrue);
  expect(csrf!.httpOnly, isFalse);
  expect(refresh.secure, config.expectSecureCookies);
  expect(csrf.secure, config.expectSecureCookies);
  expect(refresh.path, '/');
  expect(csrf.path, '/');
  expect(refresh.sameSite, 'Strict');
  expect(csrf.sameSite, 'Strict');
  expect(refresh.removed, isFalse);
  expect(csrf.removed, isFalse);
}

void _expectClearedCookies(AuthSpikeConfig config, CookieCapture capture) {
  final refresh = capture.named(config.refreshCookieName);
  final csrf = capture.named(config.csrfCookieName);
  expect(refresh?.removed, isTrue);
  expect(csrf?.removed, isTrue);
}

void _expectCsrfRejection(AuthGrant grant) {
  expect(grant.response.isSuccess, isFalse);
  expect(grant.response.statusCode, 403);
  expect(grant.response.apiCode, 1057);
}

void _expectForbiddenOrCsrf(AuthGrant grant) {
  expect(grant.response.isSuccess, isFalse);
  expect(grant.response.statusCode, 403);
  expect(
    grant.response.apiCode == null || grant.response.apiCode == 1057,
    isTrue,
  );
}

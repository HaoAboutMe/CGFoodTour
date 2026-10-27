import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_admin/core/config/app_environment.dart';

enum AuthSpikePhase { full, seed, restore }

/// Compile-time configuration for the real Android authentication probe.
///
/// Credentials intentionally have no defaults. They must be supplied only to a
/// disposable debug test build through `--dart-define` or
/// `--dart-define-from-file` and must never be committed.
final class AuthSpikeConfig {
  AuthSpikeConfig({
    required this.enabled,
    required this.environment,
    required this.phase,
    required this.adminEmail,
    required this.adminPassword,
    required this.userEmail,
    required this.userPassword,
    required this.disabledAdminEmail,
    required this.disabledAdminPassword,
    required this.refreshCookieName,
    required this.csrfCookieName,
    required this.expectSecureCookies,
    required this.invalidOrigin,
  });

  final bool enabled;
  final AppEnvironment environment;
  final AuthSpikePhase phase;
  final String adminEmail;
  final String adminPassword;
  final String userEmail;
  final String userPassword;
  final String disabledAdminEmail;
  final String disabledAdminPassword;
  final String refreshCookieName;
  final String csrfCookieName;
  final bool expectSecureCookies;
  final Uri invalidOrigin;

  bool get hasAdminCredentials =>
      adminEmail.isNotEmpty && adminPassword.isNotEmpty;
  bool get hasUserCredentials =>
      userEmail.isNotEmpty && userPassword.isNotEmpty;
  bool get hasDisabledAdminCredentials =>
      disabledAdminEmail.isNotEmpty && disabledAdminPassword.isNotEmpty;

  static AuthSpikeConfig fromCompileTime() {
    const rawPhase = String.fromEnvironment(
      'AUTH_SPIKE_PHASE',
      defaultValue: 'full',
    );
    final phase = AuthSpikePhase.values.firstWhere(
      (value) => value.name == rawPhase,
      orElse: () => throw FormatException(
        'AUTH_SPIKE_PHASE must be full, seed, or restore.',
      ),
    );
    final environment = AppEnvironment.fromCompileTime(isDebug: kDebugMode);
    const invalidOriginValue = String.fromEnvironment(
      'AUTH_SPIKE_INVALID_ORIGIN',
      defaultValue: 'https://invalid-origin.example',
    );
    final invalidOrigin = Uri.parse(invalidOriginValue);
    if (!invalidOrigin.isAbsolute || invalidOrigin.host.isEmpty) {
      throw const FormatException('AUTH_SPIKE_INVALID_ORIGIN is invalid.');
    }
    if (_origin(invalidOrigin) == _origin(environment.csrfOrigin)) {
      throw const FormatException(
        'AUTH_SPIKE_INVALID_ORIGIN must differ from CSRF_ORIGIN.',
      );
    }

    return AuthSpikeConfig(
      enabled: const bool.fromEnvironment('AUTH_SPIKE_RUN_REAL'),
      environment: environment,
      phase: phase,
      adminEmail: const String.fromEnvironment('AUTH_SPIKE_ADMIN_EMAIL'),
      adminPassword: const String.fromEnvironment('AUTH_SPIKE_ADMIN_PASSWORD'),
      userEmail: const String.fromEnvironment('AUTH_SPIKE_USER_EMAIL'),
      userPassword: const String.fromEnvironment('AUTH_SPIKE_USER_PASSWORD'),
      disabledAdminEmail: const String.fromEnvironment(
        'AUTH_SPIKE_DISABLED_ADMIN_EMAIL',
      ),
      disabledAdminPassword: const String.fromEnvironment(
        'AUTH_SPIKE_DISABLED_ADMIN_PASSWORD',
      ),
      refreshCookieName: const String.fromEnvironment(
        'AUTH_SPIKE_REFRESH_COOKIE_NAME',
        defaultValue: 'cgft_refresh',
      ),
      csrfCookieName: const String.fromEnvironment(
        'AUTH_SPIKE_CSRF_COOKIE_NAME',
        defaultValue: 'cgft_csrf',
      ),
      expectSecureCookies: const bool.fromEnvironment(
        'AUTH_SPIKE_EXPECT_SECURE_COOKIES',
      ),
      invalidOrigin: invalidOrigin,
    );
  }

  String? prerequisiteFailure() {
    if (!enabled) return 'AUTH_SPIKE_RUN_REAL is not enabled.';
    if (!Platform.isAndroid) {
      return 'The native compatibility probe is Android-only.';
    }
    if (phase != AuthSpikePhase.restore && !hasAdminCredentials) {
      return 'Disposable Admin credentials were not supplied.';
    }
    return null;
  }

  static String _origin(Uri uri) {
    final defaultPort = uri.scheme == 'https' ? 443 : 80;
    final port = uri.hasPort && uri.port != defaultPort ? ':${uri.port}' : '';
    return '${uri.scheme}://${uri.host}$port';
  }
}

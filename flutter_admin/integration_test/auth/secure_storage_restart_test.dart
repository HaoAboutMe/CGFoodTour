import 'dart:io';

import 'package:flutter_admin/core/security/secure_session_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

const _storageKey = 'auth_compatibility_spike.restart_probe.v1';
const _marker = 'cgft-secure-storage-probe-value-v1';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  const phase = String.fromEnvironment(
    'AUTH_STORAGE_PHASE',
    defaultValue: 'seed',
  );

  testWidgets(
    'secure storage survives a real Android process restart',
    (_) async {
      final store = PlatformSecureSessionStore();
      switch (phase) {
        case 'seed':
          await store.delete(_storageKey);
          await store.write(_storageKey, _marker);
          expect(await store.read(_storageKey), _marker);
        case 'restore':
          try {
            expect(await store.read(_storageKey), _marker);
          } finally {
            await store.delete(_storageKey);
          }
          expect(await store.read(_storageKey), isNull);
        default:
          fail('AUTH_STORAGE_PHASE must be seed or restore.');
      }
    },
    skip: !Platform.isAndroid,
  );
}

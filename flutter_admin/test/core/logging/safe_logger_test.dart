import 'package:flutter_admin/core/logging/safe_logger.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('redacts nested sensitive keys and inline bearer tokens', () {
    final messages = <String>[];
    final logger = SafeLogger(enabled: true, sink: messages.add);

    logger.debug(
      'request',
      fields: {
        'email': 'admin@example.test',
        'password': 'secret',
        'headers': {
          'Authorization': 'Bearer abc.def.ghi',
          'X-CSRF-Token': 'csrf-secret',
        },
        'note': 'received Bearer token-value',
      },
    );

    final output = messages.single;
    expect(output, contains('admin@example.test'));
    expect(output, isNot(contains('secret')));
    expect(output, isNot(contains('abc.def.ghi')));
    expect(output, isNot(contains('token-value')));
    expect(output, contains('<redacted>'));
  });

  test('does not call sink when disabled', () {
    final messages = <String>[];
    SafeLogger(enabled: false, sink: messages.add).debug('ignored');
    expect(messages, isEmpty);
  });
}

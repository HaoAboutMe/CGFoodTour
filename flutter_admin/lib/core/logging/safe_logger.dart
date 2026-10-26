import 'dart:developer' as developer;

typedef LogSink = void Function(String message);

class SafeLogger {
  SafeLogger({required this.enabled, LogSink? sink})
    : _sink = sink ?? ((message) => developer.log(message, name: 'cgft_admin'));

  final bool enabled;
  final LogSink _sink;

  static const _sensitiveFragments = <String>{
    'password',
    'oldpassword',
    'newpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'cookie',
    'authorization',
    'csrf',
    'otp',
  };

  void debug(String event, {Map<String, Object?> fields = const {}}) {
    if (!enabled) return;
    _sink('$event ${redact(fields)}');
  }

  Object? redact(Object? value, {String? key}) {
    if (key != null && _isSensitiveKey(key)) return '<redacted>';
    if (value is Map) {
      return value.map(
        (entryKey, entryValue) => MapEntry(
          entryKey.toString(),
          redact(entryValue, key: entryKey.toString()),
        ),
      );
    }
    if (value is Iterable) {
      return value.map(redact).toList(growable: false);
    }
    if (value is String) return _redactInlineSecrets(value);
    return value;
  }

  bool _isSensitiveKey(String key) {
    final normalized = key.toLowerCase().replaceAll(RegExp('[^a-z]'), '');
    return _sensitiveFragments.any(normalized.contains);
  }

  String _redactInlineSecrets(String value) {
    return value
        .replaceAll(
          RegExp(r'Bearer\s+[A-Za-z0-9._~+\-/]+=*', caseSensitive: false),
          'Bearer <redacted>',
        )
        .replaceAll(
          RegExp(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'),
          '<redacted-jwt>',
        );
  }
}

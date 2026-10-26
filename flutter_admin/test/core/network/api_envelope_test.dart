import 'package:flutter_admin/core/network/api_envelope.dart';
import 'package:flutter_admin/core/network/page_response.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses backend success envelope', () {
    final envelope = ApiEnvelope<Map<String, dynamic>>.fromJson({
      'code': 1000,
      'message': 'ok',
      'result': {'id': 'demo'},
    }, (json) => Map<String, dynamic>.from(json! as Map));

    expect(envelope.isSuccess, isTrue);
    expect(envelope.result?['id'], 'demo');
  });

  test('accepts error envelope without result', () {
    final envelope = ApiEnvelope<Object?>.fromJson({
      'code': 1008,
      'message': 'forbidden',
    }, (json) => json);

    expect(envelope.isSuccess, isFalse);
    expect(envelope.result, isNull);
  });

  test('parses zero-based backend page response', () {
    final page = PageResponse<String>.fromJson({
      'content': ['a', 'b'],
      'totalElements': 2,
      'totalPages': 1,
      'size': 20,
      'page': 0,
      'first': true,
      'last': true,
    }, (json) => json! as String);

    expect(page.page, 0);
    expect(page.content, ['a', 'b']);
    expect(page.totalElements, 2);
  });
}

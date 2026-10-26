import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_environment.dart';

final environmentProvider = Provider<AppEnvironment>((ref) {
  throw StateError('environmentProvider phải được override khi bootstrap.');
});

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_environment.dart';
import '../core/config/environment_provider.dart';
import '../core/theme/app_colors.dart';
import 'app.dart';

Future<void> bootstrapApplication() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    final environment = AppEnvironment.fromCompileTime(isDebug: kDebugMode);
    runApp(
      ProviderScope(
        overrides: [environmentProvider.overrideWithValue(environment)],
        child: const AdminApplication(),
      ),
    );
  } on FormatException catch (error) {
    runApp(_StartupFailureApp(message: error.message));
  }
}

class _StartupFailureApp extends StatelessWidget {
  const _StartupFailureApp({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: AppColors.canvas,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Không thể khởi tạo cấu hình ứng dụng.\n$message',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_admin/core/config/app_environment.dart';
import 'package:flutter_admin/core/theme/app_theme.dart';
import 'package:flutter_admin/core/widgets/admin_scaffold.dart';
import 'package:flutter_admin/core/widgets/brutalist_button.dart';
import 'package:flutter_admin/core/widgets/brutalist_card.dart';
import 'package:flutter_admin/features/auth/presentation/login_screen.dart';
import 'package:flutter_admin/l10n/generated/app_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('button respects minimum touch target', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Center(
            child: BrutalistButton(label: 'Action', onPressed: () {}),
          ),
        ),
      ),
    );

    expect(
      tester.getSize(find.byType(BrutalistButton)).height,
      greaterThanOrEqualTo(48),
    );
  });

  testWidgets('login placeholder is localized and cannot authenticate', (
    tester,
  ) async {
    final environment = AppEnvironment(
      name: AppEnvironmentName.localAndroid,
      apiBaseUri: Uri.parse('http://10.0.2.2:8080/api'),
      csrfOrigin: Uri.parse('http://localhost:5173'),
      allowInsecureHttp: true,
    );
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        locale: const Locale('vi'),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: LoginScreen(environment: environment),
      ),
    );

    expect(find.text('CG FoodTour Admin'), findsOneWidget);
    expect(find.text('Chỉ dành cho quản trị viên'), findsOneWidget);
    expect(
      find.text('Đăng nhập an toàn sẽ được triển khai ở F1.'),
      findsOneWidget,
    );
    final button = tester.widget<BrutalistButton>(find.byType(BrutalistButton));
    expect(button.onPressed, isNull);
  });

  testWidgets('phone uses bottom navigation without overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: const AdminScaffold(
          currentPath: '/admin/dashboard',
          child: Scaffold(body: Center(child: Text('phone'))),
        ),
      ),
    );

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.byType(NavigationRail), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('wide tablet uses NavigationRail and keeps login card compact', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1024, 768);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: const AdminScaffold(
          currentPath: '/admin/dashboard',
          child: Scaffold(body: Center(child: Text('tablet'))),
        ),
      ),
    );

    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
    expect(tester.takeException(), isNull);

    final environment = AppEnvironment(
      name: AppEnvironmentName.localAndroid,
      apiBaseUri: Uri.parse('http://10.0.2.2:8080/api'),
      csrfOrigin: Uri.parse('http://localhost:5173'),
      allowInsecureHttp: true,
    );
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        locale: const Locale('vi'),
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: LoginScreen(environment: environment),
      ),
    );

    expect(
      tester.getSize(find.byType(BrutalistCard)).width,
      lessThanOrEqualTo(440),
    );
    expect(tester.takeException(), isNull);
  });
}

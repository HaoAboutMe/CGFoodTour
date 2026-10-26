import 'package:flutter/material.dart';
import 'package:flutter_admin/app/router.dart';
import 'package:flutter_admin/features/auth/domain/auth_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('anonymous users are redirected to login', () {
    expect(
      authRedirect(const AuthState.anonymous(), AppRoutes.dashboard),
      AppRoutes.login,
    );
  });

  test('bootstrapping users cannot enter protected routes', () {
    expect(
      authRedirect(const AuthState.bootstrapping(), AppRoutes.users),
      AppRoutes.bootstrap,
    );
  });

  test('verified admins leave public routes for dashboard', () {
    expect(
      authRedirect(
        const AuthState(AuthStatus.authenticatedAdmin),
        AppRoutes.login,
      ),
      AppRoutes.dashboard,
    );
  });

  testWidgets('router never renders protected screen for anonymous session', (
    tester,
  ) async {
    final router = createAppRouter(
      authState: const AuthState.anonymous(),
      initialLocation: AppRoutes.dashboard,
      loginBuilder: (_, _) => const Scaffold(body: Text('LOGIN_GUARD_TARGET')),
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    expect(find.text('LOGIN_GUARD_TARGET'), findsOneWidget);
    expect(find.text('Tổng quan'), findsNothing);
  });
}

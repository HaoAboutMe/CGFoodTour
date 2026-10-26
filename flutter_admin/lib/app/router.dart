import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/config/environment_provider.dart';
import '../core/widgets/admin_scaffold.dart';
import '../features/auth/domain/auth_state.dart';
import '../features/auth/presentation/bootstrap_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/foundation/presentation/protected_placeholder_screen.dart';

abstract final class AppRoutes {
  static const bootstrap = '/bootstrap';
  static const login = '/login';
  static const dashboard = '/admin/dashboard';
  static const stores = '/admin/stores';
  static const recovery = '/admin/stores/recovery';
  static const users = '/admin/users';
  static const categories = '/admin/categories';
  static const profile = '/admin/profile';
}

String? authRedirect(AuthState authState, String location) {
  final isPublic =
      location == AppRoutes.bootstrap || location == AppRoutes.login;
  if (authState.status == AuthStatus.bootstrapping) {
    return location == AppRoutes.bootstrap ? null : AppRoutes.bootstrap;
  }
  if (!authState.isAdmin) {
    return location == AppRoutes.login ? null : AppRoutes.login;
  }
  return isPublic ? AppRoutes.dashboard : null;
}

GoRouter createAppRouter({
  required AuthState authState,
  required WidgetBuilderFactory loginBuilder,
  String initialLocation = AppRoutes.bootstrap,
}) {
  return GoRouter(
    initialLocation: initialLocation,
    redirect: (_, state) => authRedirect(authState, state.uri.path),
    routes: [
      GoRoute(
        path: AppRoutes.bootstrap,
        builder: (_, _) => const BootstrapScreen(),
      ),
      GoRoute(path: AppRoutes.login, builder: loginBuilder),
      ShellRoute(
        builder: (_, state, child) =>
            AdminScaffold(currentPath: state.uri.path, child: child),
        routes: [
          _placeholder(AppRoutes.dashboard, 'Tổng quan'),
          _placeholder(AppRoutes.stores, 'Quản lý quán'),
          _placeholder(AppRoutes.recovery, 'Yêu cầu khôi phục'),
          _placeholder('/admin/stores/:id', 'Chi tiết quán'),
          _placeholder(AppRoutes.users, 'Quản lý người dùng'),
          _placeholder('/admin/users/:id', 'Chi tiết người dùng'),
          _placeholder('/admin/users/:id/edit', 'Chỉnh sửa người dùng'),
          _placeholder(AppRoutes.categories, 'Quản lý danh mục'),
          _placeholder('/admin/categories/new', 'Tạo danh mục'),
          _placeholder('/admin/categories/:id/edit', 'Chỉnh sửa danh mục'),
          _placeholder(AppRoutes.profile, 'Tài khoản quản trị'),
          _placeholder('/admin/profile/edit', 'Chỉnh sửa hồ sơ'),
          _placeholder('/admin/profile/change-password', 'Đổi mật khẩu'),
        ],
      ),
    ],
  );
}

typedef WidgetBuilderFactory =
    Widget Function(BuildContext context, GoRouterState state);

GoRoute _placeholder(String path, String title) => GoRoute(
  path: path,
  builder: (_, _) => ProtectedPlaceholderScreen(title: title),
);

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final environment = ref.watch(environmentProvider);
  final router = createAppRouter(
    authState: authState,
    loginBuilder: (_, _) => LoginScreen(environment: environment),
  );
  ref.onDispose(router.dispose);
  return router;
});

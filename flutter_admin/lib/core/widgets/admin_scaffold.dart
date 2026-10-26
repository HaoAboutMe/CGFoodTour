import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';

class AdminScaffold extends StatelessWidget {
  const AdminScaffold({
    required this.currentPath,
    required this.child,
    super.key,
  });

  final String currentPath;
  final Widget child;

  static const _paths = [
    '/admin/dashboard',
    '/admin/stores',
    '/admin/users',
    '/admin/categories',
  ];

  int get _selectedIndex {
    final index = _paths.indexWhere((path) => currentPath.startsWith(path));
    return index < 0 ? 0 : index;
  }

  void _navigate(BuildContext context, int index) => context.go(_paths[index]);

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 840;
    const destinations = [
      NavigationDestination(
        icon: Icon(Icons.dashboard_outlined),
        label: 'Tổng quan',
      ),
      NavigationDestination(
        icon: Icon(Icons.storefront_outlined),
        label: 'Quán',
      ),
      NavigationDestination(
        icon: Icon(Icons.people_outline),
        label: 'Người dùng',
      ),
      NavigationDestination(
        icon: Icon(Icons.category_outlined),
        label: 'Danh mục',
      ),
    ];

    if (!wide) {
      return Scaffold(
        body: child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) => _navigate(context, index),
          destinations: destinations,
        ),
      );
    }

    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            backgroundColor: AppColors.surface,
            selectedIndex: _selectedIndex,
            onDestinationSelected: (index) => _navigate(context, index),
            labelType: NavigationRailLabelType.all,
            destinations: destinations
                .map(
                  (item) => NavigationRailDestination(
                    icon: item.icon,
                    selectedIcon: item.selectedIcon,
                    label: Text(item.label),
                  ),
                )
                .toList(growable: false),
          ),
          const VerticalDivider(width: 2, thickness: 2, color: AppColors.ink),
          Expanded(child: child),
        ],
      ),
    );
  }
}

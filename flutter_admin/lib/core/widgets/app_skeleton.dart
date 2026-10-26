import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class AppSkeleton extends StatelessWidget {
  const AppSkeleton({
    this.height = 80,
    this.width = double.infinity,
    super.key,
  });

  final double height;
  final double width;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Đang tải',
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: const Color(0xFFE4E2DD),
          border: Border.all(color: AppColors.ink, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}

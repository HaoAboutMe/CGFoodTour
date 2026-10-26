import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppTypography {
  static TextTheme textTheme() {
    const base = TextStyle(
      color: AppColors.ink,
      fontFamily: 'Plus Jakarta Sans',
      fontFamilyFallback: ['sans-serif'],
    );
    return TextTheme(
      displaySmall: base.copyWith(
        fontSize: 28,
        height: 34 / 28,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: base.copyWith(
        fontSize: 24,
        height: 30 / 24,
        fontWeight: FontWeight.w800,
      ),
      headlineSmall: base.copyWith(
        fontSize: 20,
        height: 26 / 20,
        fontWeight: FontWeight.w800,
      ),
      titleMedium: base.copyWith(
        fontSize: 16,
        height: 22 / 16,
        fontWeight: FontWeight.w800,
      ),
      bodyMedium: base.copyWith(
        fontSize: 14,
        height: 21 / 14,
        fontWeight: FontWeight.w500,
      ),
      labelMedium: base.copyWith(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w800,
      ),
      bodySmall: base.copyWith(
        fontSize: 11,
        height: 15 / 11,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

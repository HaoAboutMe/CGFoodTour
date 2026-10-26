import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_admin/core/theme/app_colors.dart';
import 'package:flutter_admin/core/theme/app_theme.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses verified CG FoodTour brand tokens', () {
    expect(AppColors.canvas.toARGB32(), 0xFFF7F6F2);
    expect(AppColors.surface.toARGB32(), 0xFFFFFFFF);
    expect(AppColors.ink.toARGB32(), 0xFF111111);
    expect(AppColors.brand.toARGB32(), 0xFFFF3E3E);
    expect(AppColors.action.toARGB32(), 0xFFC92A2A);

    final theme = AppTheme.light();
    expect(theme.scaffoldBackgroundColor, AppColors.canvas);
    expect(theme.colorScheme.primary, AppColors.action);
    expect(theme.textTheme.bodyMedium?.fontFamily, 'Plus Jakarta Sans');
    expect(theme.textTheme.displaySmall?.fontWeight, FontWeight.w800);
  });

  test('bundled Plus Jakarta Sans asset and OFL license are present', () {
    final font = File(
      'assets/fonts/plus_jakarta_sans/PlusJakartaSans-VariableFont_wght.ttf',
    );
    final license = File(
      'assets/fonts/plus_jakarta_sans/OFL.txt',
    ).readAsStringSync();
    final pubspec = File('pubspec.yaml').readAsStringSync();

    expect(font.lengthSync(), greaterThan(100000));
    expect(font.readAsBytesSync().take(4), [0, 1, 0, 0]);
    expect(license, contains('SIL OPEN FONT LICENSE Version 1.1'));
    expect(pubspec, contains('PlusJakartaSans-VariableFont_wght.ttf'));
  });
}

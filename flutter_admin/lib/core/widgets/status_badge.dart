import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum StatusBadgeTone { success, warning, danger, neutral, info }

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    required this.label,
    required this.tone,
    this.icon,
    super.key,
  });

  final String label;
  final StatusBadgeTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (foreground, background) = switch (tone) {
      StatusBadgeTone.success => (
        AppColors.successText,
        AppColors.successBackground,
      ),
      StatusBadgeTone.warning => (
        AppColors.warningText,
        AppColors.warningBackground,
      ),
      StatusBadgeTone.danger => (
        AppColors.dangerText,
        AppColors.dangerBackground,
      ),
      StatusBadgeTone.neutral => (AppColors.ink, AppColors.canvas),
      StatusBadgeTone.info => (AppColors.focus, const Color(0xFFEFF6FF)),
    };
    return Semantics(
      label: label,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: background,
          border: Border.all(color: foreground, width: 2),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, color: foreground, size: 14),
                const SizedBox(width: 4),
              ],
              Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

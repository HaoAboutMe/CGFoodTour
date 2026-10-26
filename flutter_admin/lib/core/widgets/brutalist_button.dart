import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum BrutalistButtonStyle { primary, secondary, destructive }

class BrutalistButton extends StatelessWidget {
  const BrutalistButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.style = BrutalistButtonStyle.primary,
    this.expand = false,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool expand;
  final BrutalistButtonStyle style;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !isLoading;
    final background = switch (style) {
      BrutalistButtonStyle.primary => AppColors.action,
      BrutalistButtonStyle.secondary => AppColors.surface,
      BrutalistButtonStyle.destructive => AppColors.dangerText,
    };
    final foreground = style == BrutalistButtonStyle.secondary
        ? AppColors.ink
        : AppColors.surface;

    final child = Semantics(
      button: true,
      enabled: enabled,
      label: label,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        constraints: const BoxConstraints(minHeight: 48, minWidth: 48),
        decoration: BoxDecoration(
          color: enabled ? background : AppColors.mutedInk,
          border: Border.all(color: AppColors.ink, width: 2),
          borderRadius: BorderRadius.circular(8),
          boxShadow: enabled
              ? const [BoxShadow(color: AppColors.ink, offset: Offset(4, 4))]
              : const [],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: enabled ? onPressed : null,
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Center(
                child: isLoading
                    ? SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: foreground,
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[
                            Icon(icon, color: foreground, size: 20),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            label.toUpperCase(),
                            style: Theme.of(context).textTheme.labelLarge
                                ?.copyWith(
                                  color: foreground,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
    return expand ? SizedBox(width: double.infinity, child: child) : child;
  }
}

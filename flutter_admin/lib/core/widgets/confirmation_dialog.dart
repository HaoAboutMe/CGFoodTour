import 'package:flutter/material.dart';

import 'brutalist_button.dart';

class ConfirmationDialog extends StatelessWidget {
  const ConfirmationDialog({
    required this.title,
    required this.message,
    this.confirmLabel = 'Xác nhận',
    this.isDestructive = false,
    super.key,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final bool isDestructive;

  static Future<bool> show(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Xác nhận',
    bool isDestructive = false,
  }) async {
    return await showDialog<bool>(
          context: context,
          builder: (_) => ConfirmationDialog(
            title: title,
            message: message,
            confirmLabel: confirmLabel,
            isDestructive: isDestructive,
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        BrutalistButton(
          label: 'Hủy',
          onPressed: () => Navigator.of(context).pop(false),
          style: BrutalistButtonStyle.secondary,
        ),
        BrutalistButton(
          label: confirmLabel,
          onPressed: () => Navigator.of(context).pop(true),
          style: isDestructive
              ? BrutalistButtonStyle.destructive
              : BrutalistButtonStyle.primary,
        ),
      ],
    );
  }
}

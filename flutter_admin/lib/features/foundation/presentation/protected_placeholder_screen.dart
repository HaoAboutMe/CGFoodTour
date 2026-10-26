import 'package:flutter/material.dart';

import '../../../core/widgets/brutalist_card.dart';

class ProtectedPlaceholderScreen extends StatelessWidget {
  const ProtectedPlaceholderScreen({required this.title, super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: BrutalistCard(
            child: Text(
              'Màn hình được bảo vệ. Chức năng sẽ được triển khai ở giai đoạn sau.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
        ),
      ),
    );
  }
}

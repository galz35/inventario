import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme/app_theme.dart';
import '../layout/inv_shell.dart';
import '../models/app_nav_items.dart';

class ModulePlaceholderPage extends StatelessWidget {
  const ModulePlaceholderPage({
    super.key,
    required this.title,
    required this.currentRoute,
    required this.description,
  });

  final String title;
  final String currentRoute;
  final String description;

  @override
  Widget build(BuildContext context) {
    return InvShell(
      title: title,
      currentRoute: currentRoute,
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Center(
        child: Card(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 700),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.engineering, size: 44, color: AppTheme.accentBlue),
                  const SizedBox(height: 12),
                  Text(
                    '$title en migración',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

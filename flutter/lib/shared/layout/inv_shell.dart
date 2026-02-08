import 'package:flutter/material.dart';

import '../models/app_nav_items.dart';

class InvShell extends StatelessWidget {
  const InvShell({
    super.key,
    required this.title,
    required this.currentRoute,
    required this.navItems,
    required this.onNavigate,
    required this.child,
  });

  final String title;
  final String currentRoute;
  final List<AppNavItem> navItems;
  final ValueChanged<String> onNavigate;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // Placeholder implementation for InvShell as described in documents but code not provided in patch
    // Creating a basic shell to allow compilation/viewing
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      drawer: Drawer(
        child: ListView(
          children: [
            const DrawerHeader(child: Text('Inventario')),
            for (final item in navItems)
              ListTile(
                title: Text(item.label),
                selected: currentRoute == item.route,
                onTap: () => onNavigate(item.route),
              ),
          ],
        ),
      ),
      body: child,
    );
  }
}

import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';

class NavItem {
  const NavItem({required this.label, required this.icon, required this.route});

  final String label;
  final IconData icon;
  final String route;
}

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
  final List<NavItem> navItems;
  final ValueChanged<String> onNavigate;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 900;

    return Scaffold(
      drawer: isMobile
          ? Drawer(
              backgroundColor: AppTheme.bgSidebar,
              child: _SidebarNav(
                currentRoute: currentRoute,
                navItems: navItems,
                onNavigate: (route) {
                  Navigator.of(context).pop();
                  onNavigate(route);
                },
              ),
            )
          : null,
      body: Row(
        children: [
          if (!isMobile)
            SizedBox(
              width: 260,
              child: ColoredBox(
                color: AppTheme.bgSidebar,
                child: _SidebarNav(
                  currentRoute: currentRoute,
                  navItems: navItems,
                  onNavigate: onNavigate,
                ),
              ),
            ),
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 64,
                  decoration: const BoxDecoration(
                    color: AppTheme.bgPrimary,
                    border: Border(
                      bottom: BorderSide(color: AppTheme.border),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      if (isMobile)
                        Builder(
                          builder: (context) => IconButton(
                            onPressed: () => Scaffold.of(context).openDrawer(),
                            icon: const Icon(Icons.menu),
                          ),
                        ),
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 20,
                        ),
                      ),
                      const Spacer(),
                      const CircleAvatar(
                        radius: 16,
                        child: Icon(Icons.person, size: 18),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: child,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarNav extends StatelessWidget {
  const _SidebarNav({
    required this.currentRoute,
    required this.navItems,
    required this.onNavigate,
  });

  final String currentRoute;
  final List<NavItem> navItems;
  final ValueChanged<String> onNavigate;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Row(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppTheme.accentBlue,
                    borderRadius: BorderRadius.all(Radius.circular(10)),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(10),
                    child: Text(
                      'I',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'INVCORE',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemCount: navItems.length,
              itemBuilder: (context, index) {
                final item = navItems[index];
                final selected = item.route == currentRoute;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Material(
                    color: selected
                        ? AppTheme.accentBlue.withOpacity(0.18)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    child: ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color:
                              selected ? AppTheme.accentBlue : Colors.transparent,
                        ),
                      ),
                      leading: Icon(
                        item.icon,
                        color: selected ? AppTheme.accentBlue : AppTheme.textMuted,
                      ),
                      title: Text(
                        item.label,
                        style: TextStyle(
                          color: selected ? Colors.white : AppTheme.textMuted,
                          fontWeight:
                              selected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                      onTap: () => onNavigate(item.route),
                    ),
                  ),
                );
              },
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Migración Flutter en progreso',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

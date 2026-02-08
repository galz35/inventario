class AppNavItem {
  const AppNavItem({required this.label, required this.route});
  final String label;
  final String route;
}

const kMainNavItems = <AppNavItem>[
  AppNavItem(label: 'Dashboard', route: '/dashboard'),
  AppNavItem(label: 'Inventario', route: '/inventario'),
  AppNavItem(label: 'Transferencias', route: '/transferencias'),
  AppNavItem(label: 'Operaciones', route: '/operaciones'),
  AppNavItem(label: 'Reportes', route: '/reportes'),
  AppNavItem(label: 'Usuarios', route: '/usuarios'),
  AppNavItem(label: 'Activos', route: '/activos'),
];

import 'package:flutter/material.dart';

import '../layout/inv_shell.dart';

const List<NavItem> kMainNavItems = <NavItem>[
  NavItem(label: 'Inicio', icon: Icons.dashboard_outlined, route: '/dashboard'),
  NavItem(label: 'Inventario', icon: Icons.inventory_2_outlined, route: '/inventario'),
  NavItem(label: 'Transferencias', icon: Icons.local_shipping_outlined, route: '/transferencias'),
  NavItem(label: 'Operaciones', icon: Icons.assignment_outlined, route: '/operaciones'),
  NavItem(label: 'Reportes', icon: Icons.bar_chart_outlined, route: '/reportes'),
  NavItem(label: 'Usuarios', icon: Icons.people_outline, route: '/usuarios'),
  NavItem(label: 'Activos', icon: Icons.handyman_outlined, route: '/activos'),
];

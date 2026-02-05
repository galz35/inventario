import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/activos/presentation/activos_page.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/dashboard/presentation/dashboard_page.dart';
import '../../features/inventario/presentation/inventario_page.dart';
import '../../features/operaciones/presentation/operaciones_page.dart';
import '../../features/reportes/presentation/reportes_page.dart';
import '../../features/transferencias/presentation/transferencias_page.dart';
import '../../features/usuarios/presentation/usuarios_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);
  final authNotifier = ref.watch(authRouterNotifierProvider);

  bool hasModule(String module) {
    final user = authState.user;
    if (user == null) return false;
    return user.canAccess(module);
  }

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: authNotifier,
    redirect: (BuildContext context, GoRouterState state) {
      final isLoggingIn = state.matchedLocation == '/login';
      if (!authState.isAuthenticated && !isLoggingIn) {
        return '/login';
      }
      if (authState.isAuthenticated && isLoggingIn) {
        return '/dashboard';
      }

      if (state.matchedLocation == '/inventario' && !hasModule('inventario')) {
        return '/dashboard';
      }
      if (state.matchedLocation == '/transferencias' && !hasModule('transferencias')) {
        return '/dashboard';
      }
      if (state.matchedLocation == '/operaciones' && !hasModule('operaciones')) {
        return '/dashboard';
      }
      if (state.matchedLocation == '/reportes' && !hasModule('reportes')) {
        return '/dashboard';
      }
      if (state.matchedLocation == '/usuarios' && !hasModule('usuarios')) {
        return '/dashboard';
      }
      if (state.matchedLocation == '/activos' && !hasModule('activos')) {
        return '/dashboard';
      }

      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/login',
        builder: (BuildContext context, GoRouterState state) => const LoginPage(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (BuildContext context, GoRouterState state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/inventario',
        builder: (BuildContext context, GoRouterState state) => const InventarioPage(),
      ),
      GoRoute(
        path: '/transferencias',
        builder: (BuildContext context, GoRouterState state) => const TransferenciasPage(),
      ),
      GoRoute(
        path: '/operaciones',
        builder: (BuildContext context, GoRouterState state) => const OperacionesPage(),
      ),
      GoRoute(
        path: '/reportes',
        builder: (BuildContext context, GoRouterState state) => const ReportesPage(),
      ),
      GoRoute(
        path: '/usuarios',
        builder: (BuildContext context, GoRouterState state) => const UsuariosPage(),
      ),
      GoRoute(
        path: '/activos',
        builder: (BuildContext context, GoRouterState state) => const ActivosPage(),
      ),
    ],
  );
});

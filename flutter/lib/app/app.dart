import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/application/auth_controller.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class InventarioApp extends ConsumerStatefulWidget {
  const InventarioApp({super.key});

  @override
  ConsumerState<InventarioApp> createState() => _InventarioAppState();
}

class _InventarioAppState extends ConsumerState<InventarioApp> {
  @override
  void initState() {
    super.initState();
    // Intentar restaurar sesión guardada (si existe)
    Future<void>.microtask(() async {
      try {
        await ref.read(authControllerProvider.notifier).hydrate();
      } catch (e) {
        debugPrint('Error al restaurar sesión: $e');
        // No es crítico, el usuario simplemente verá el login
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Inventario',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

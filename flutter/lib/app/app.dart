import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/notifications/push_notification_service.dart';
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
    Future<void>.microtask(() async {
      await PushNotificationService.instance.initialize();
      await ref.read(authControllerProvider.notifier).hydrate();
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

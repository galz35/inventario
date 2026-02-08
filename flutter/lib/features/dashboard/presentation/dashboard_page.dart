import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../core/storage/local_db.dart';
import '../../../core/sync/sync_engine.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../../auth/application/auth_controller.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  final LocalDb _localDb = LocalDb();

  bool _syncLoading = false;
  int _pending = 0;
  int _error = 0;
  int _done = 0;
  int _pendingNotifications = 0;
  int _pendingDeviceToken = 0;
  String _lastSync = 'Sin ejecuciones';

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_loadSyncStats);
  }

  Future<void> _loadSyncStats() async {
    final pending = await _localDb.queueCountByStatus('pending');
    final error = await _localDb.queueCountByStatus('error');
    final done = await _localDb.queueCountByStatus('done');
    final pendingNotifications = await _localDb.queueCountByEntity('notification');
    final pendingDeviceToken = await _localDb.queueCountByEntityAction(
      entity: 'notification',
      action: 'register_device_token',
    );
    final lastSync = await _localDb.lastSyncSummary();

    if (!mounted) return;
    setState(() {
      _pending = pending;
      _error = error;
      _done = done;
      _pendingNotifications = pendingNotifications;
      _pendingDeviceToken = pendingDeviceToken;
      _lastSync = lastSync ?? 'Sin ejecuciones';
    });
  }

  Future<void> _runSync() async {
    setState(() => _syncLoading = true);
    final processed = await SyncEngine(_localDb).runPendingQueue();
    await _loadSyncStats();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync completada: $processed pendientes procesados')),
      );
      setState(() => _syncLoading = false);
    }
  }



  Future<void> _retrySyncErrors() async {
    setState(() => _syncLoading = true);
    final moved = await _localDb.resetErrorQueue();
    final processed = await SyncEngine(_localDb).runPendingQueue();
    await _loadSyncStats();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reintento ejecutado: $moved movidos, $processed procesados')),
      );
      setState(() => _syncLoading = false);
    }
  }

  Future<void> _cleanupDoneQueue() async {
    setState(() => _syncLoading = true);
    final removed = await _localDb.clearDoneQueue();
    await _loadSyncStats();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Limpieza completada: $removed registros done eliminados')),
      );
      setState(() => _syncLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;

    return InvShell(
      title: 'Dashboard',
      currentRoute: '/dashboard',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bienvenido ${user?.nombre ?? 'usuario'}',
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: GridView.count(
              crossAxisCount: MediaQuery.sizeOf(context).width > 1100 ? 4 : 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                const _KpiCard(label: 'OT abiertas', value: '42', icon: Icons.assignment_late_outlined),
                const _KpiCard(label: 'Stock crítico', value: '17', icon: Icons.warning_amber_outlined),
                const _KpiCard(label: 'Transferencias', value: '8', icon: Icons.compare_arrows_outlined),
                const _KpiCard(label: 'Activos en campo', value: '126', icon: Icons.construction_outlined),
                _KpiCard(label: 'Sync pendientes', value: '$_pending', icon: Icons.hourglass_empty_outlined),
                _KpiCard(label: 'Sync error', value: '$_error', icon: Icons.error_outline),
                _KpiCard(label: 'Sync done', value: '$_done', icon: Icons.task_alt_outlined),
                _KpiCard(label: 'Notif pendientes', value: '$_pendingNotifications', icon: Icons.notifications_active_outlined),
                _KpiCard(label: 'FCM token queue', value: '$_pendingDeviceToken', icon: Icons.phone_android_outlined),
                _KpiCard(label: 'Última sync', value: _lastSync, icon: Icons.history_outlined),
              ],
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: _syncLoading ? null : _runSync,
                icon: _syncLoading
                    ? const SizedBox.square(
                        dimension: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.sync),
                label: const Text('Ejecutar sync'),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: _syncLoading ? null : _loadSyncStats,
                icon: const Icon(Icons.refresh),
                label: const Text('Refrescar métricas'),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: _syncLoading ? null : _retrySyncErrors,
                icon: const Icon(Icons.replay),
                label: const Text('Reintentar errores'),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: _syncLoading ? null : _cleanupDoneQueue,
                icon: const Icon(Icons.cleaning_services_outlined),
                label: const Text('Limpiar done'),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar sesión'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppTheme.accentBlue),
                const Spacer(),
                const Icon(Icons.more_horiz, color: AppTheme.textMuted),
              ],
            ),
            const Spacer(),
            Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}

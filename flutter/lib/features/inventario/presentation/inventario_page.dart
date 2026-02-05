import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/inventario_controller.dart';

class InventarioPage extends ConsumerStatefulWidget {
  const InventarioPage({super.key});

  @override
  ConsumerState<InventarioPage> createState() => _InventarioPageState();
}

class _InventarioPageState extends ConsumerState<InventarioPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(inventarioControllerProvider.notifier).cargar();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(inventarioControllerProvider);
    final critical = state.items.where((item) => item.stock <= 20).length;
    final totalStock = state.items.fold<double>(0, (sum, item) => sum + item.stock);

    return InvShell(
      title: 'Inventario',
      currentRoute: '/inventario',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Stock Global',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(inventarioControllerProvider.notifier).cargar(forceRemote: true),
                icon: const Icon(Icons.sync),
                label: const Text('Sincronizar'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(label: Text('Items: ${state.items.length}')),
              Chip(label: Text('Stock total: ${totalStock.toStringAsFixed(0)}')),
              Chip(label: Text('Críticos: $critical')),
            ],
          ),
          const SizedBox(height: 12),
          if (state.loading) const LinearProgressIndicator(),
          if (state.error != null) ...[
            const SizedBox(height: 10),
            Text(state.error!, style: const TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 10),
          Expanded(
            child: Card(
              child: ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => const Divider(color: AppTheme.border),
                itemBuilder: (context, index) {
                  final item = state.items[index];
                  return ListTile(
                    leading: const Icon(Icons.inventory_2_outlined),
                    title: Text('${item.codigo} - ${item.descripcion}'),
                    subtitle: item.stock <= 20
                        ? const Text('Stock crítico', style: TextStyle(color: Colors.amberAccent))
                        : null,
                    trailing: SizedBox(
                      width: 160,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          IconButton(
                            tooltip: 'Restar 1',
                            onPressed: () => ref.read(inventarioControllerProvider.notifier).ajustarStock(
                                  id: item.id,
                                  delta: -1,
                                  motivo: 'consumo_operacion',
                                ),
                            icon: const Icon(Icons.remove_circle_outline),
                          ),
                          Text(
                            item.stock.toStringAsFixed(0),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          IconButton(
                            tooltip: 'Sumar 1',
                            onPressed: () => ref.read(inventarioControllerProvider.notifier).ajustarStock(
                                  id: item.id,
                                  delta: 1,
                                  motivo: 'ajuste_manual',
                                ),
                            icon: const Icon(Icons.add_circle_outline),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

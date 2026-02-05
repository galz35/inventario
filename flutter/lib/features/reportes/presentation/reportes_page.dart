import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/reportes_controller.dart';

class ReportesPage extends ConsumerStatefulWidget {
  const ReportesPage({super.key});

  @override
  ConsumerState<ReportesPage> createState() => _ReportesPageState();
}

class _ReportesPageState extends ConsumerState<ReportesPage> {
  String _tipo = 'Inventario crítico';
  String _periodo = 'Últimos 7 días';

  static const _tipos = <String>[
    'Inventario crítico',
    'Transferencias pendientes',
    'Productividad OT',
    'Activos sin inspección',
  ];

  static const _periodos = <String>[
    'Hoy',
    'Últimos 7 días',
    'Mes actual',
    'Trimestre',
  ];

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(reportesControllerProvider.notifier).cargar();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportesControllerProvider);

    return InvShell(
      title: 'Reportes',
      currentRoute: '/reportes',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Centro de reportes',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            runSpacing: 10,
            spacing: 10,
            crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              SizedBox(
                width: 260,
                child: DropdownButtonFormField<String>(
                  value: _tipo,
                  items: _tipos
                      .map((tipo) => DropdownMenuItem<String>(value: tipo, child: Text(tipo)))
                      .toList(growable: false),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _tipo = value);
                  },
                  decoration: const InputDecoration(labelText: 'Tipo de reporte'),
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  value: _periodo,
                  items: _periodos
                      .map((periodo) => DropdownMenuItem<String>(value: periodo, child: Text(periodo)))
                      .toList(growable: false),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _periodo = value);
                  },
                  decoration: const InputDecoration(labelText: 'Periodo'),
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  await ref.read(reportesControllerProvider.notifier).generar(
                        tipo: _tipo,
                        periodo: _periodo,
                      );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Reporte generado localmente y en cola sync.')),
                    );
                  }
                },
                icon: const Icon(Icons.post_add),
                label: const Text('Generar'),
              ),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(reportesControllerProvider.notifier).cargar(forceRemote: true),
                icon: const Icon(Icons.sync),
                label: const Text('Actualizar'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (state.loading) const LinearProgressIndicator(),
          if (state.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(state.error!, style: const TextStyle(color: Colors.redAccent)),
            ),
          const SizedBox(height: 10),
          Expanded(
            child: Card(
              child: ListView.separated(
                itemCount: state.items.length,
                separatorBuilder: (_, __) => const Divider(color: AppTheme.border),
                itemBuilder: (context, index) {
                  final reporte = state.items[index];
                  return ListTile(
                    leading: const Icon(Icons.insert_chart_outlined),
                    title: Text(reporte.tipo),
                    subtitle: Text('Periodo: ${reporte.periodo}'),
                    trailing: Chip(label: Text(reporte.estado)),
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

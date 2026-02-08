import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/operaciones_controller.dart';

class OperacionesPage extends ConsumerStatefulWidget {
  const OperacionesPage({super.key});

  @override
  ConsumerState<OperacionesPage> createState() => _OperacionesPageState();
}

class _OperacionesPageState extends ConsumerState<OperacionesPage> {
  final _codigoOtController = TextEditingController();
  final _tecnicoController = TextEditingController();
  final _materialesController = TextEditingController(text: '1');

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(operacionesControllerProvider.notifier).cargar();
    });
  }

  @override
  void dispose() {
    _codigoOtController.dispose();
    _tecnicoController.dispose();
    _materialesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(operacionesControllerProvider);

    return InvShell(
      title: 'Operaciones OT',
      currentRoute: '/operaciones',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ejecución de operaciones',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            runSpacing: 10,
            spacing: 10,
            crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              SizedBox(
                width: 160,
                child: TextField(
                  controller: _codigoOtController,
                  decoration: const InputDecoration(labelText: 'Código OT'),
                ),
              ),
              SizedBox(
                width: 220,
                child: TextField(
                  controller: _tecnicoController,
                  decoration: const InputDecoration(labelText: 'Técnico'),
                ),
              ),
              SizedBox(
                width: 140,
                child: TextField(
                  controller: _materialesController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Materiales'),
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  final codigo = _codigoOtController.text.trim();
                  if (codigo.isEmpty) return;

                  final messenger = ScaffoldMessenger.of(context);
                  await ref.read(operacionesControllerProvider.notifier).crear(
                        codigoOt: codigo,
                        tecnico: _tecnicoController.text.trim().isEmpty
                            ? 'Técnico por asignar'
                            : _tecnicoController.text.trim(),
                        materialesUsados: int.tryParse(_materialesController.text) ?? 1,
                      );

                  _codigoOtController.clear();

                  if (!mounted) return;
                  messenger.showSnackBar(
                    const SnackBar(content: Text('OT creada localmente y encolada para sync.')),
                  );
                },
                icon: const Icon(Icons.add_task),
                label: const Text('Crear OT'),
              ),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(operacionesControllerProvider.notifier).cargar(forceRemote: true),
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
                  final op = state.items[index];
                  return ListTile(
                    leading: const Icon(Icons.assignment_turned_in_outlined),
                    title: Text('${op.codigoOt} · ${op.tecnico}'),
                    subtitle: Text('Materiales: ${op.materialesUsados}'),
                    trailing: PopupMenuButton<String>(
                      initialValue: op.estado,
                      onSelected: (value) {
                        ref
                            .read(operacionesControllerProvider.notifier)
                            .actualizarEstado(id: op.id, estado: value);
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'Pendiente', child: Text('Pendiente')),
                        PopupMenuItem(value: 'En ejecución', child: Text('En ejecución')),
                        PopupMenuItem(value: 'Completada', child: Text('Completada')),
                      ],
                      child: Chip(label: Text(op.estado)),
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

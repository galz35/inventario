import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/activos_controller.dart';

class ActivosPage extends ConsumerStatefulWidget {
  const ActivosPage({super.key});

  @override
  ConsumerState<ActivosPage> createState() => _ActivosPageState();
}

class _ActivosPageState extends ConsumerState<ActivosPage> {
  final _codigoController = TextEditingController();
  final _nombreController = TextEditingController();
  final _ubicacionController = TextEditingController(text: 'Bodega Central');

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(activosControllerProvider.notifier).cargar();
    });
  }

  @override
  void dispose() {
    _codigoController.dispose();
    _nombreController.dispose();
    _ubicacionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(activosControllerProvider);

    return InvShell(
      title: 'Activos',
      currentRoute: '/activos',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Gestión de activos',
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
                  controller: _codigoController,
                  decoration: const InputDecoration(labelText: 'Código'),
                ),
              ),
              SizedBox(
                width: 230,
                child: TextField(
                  controller: _nombreController,
                  decoration: const InputDecoration(labelText: 'Nombre del activo'),
                ),
              ),
              SizedBox(
                width: 220,
                child: TextField(
                  controller: _ubicacionController,
                  decoration: const InputDecoration(labelText: 'Ubicación'),
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  final codigo = _codigoController.text.trim();
                  final nombre = _nombreController.text.trim();
                  if (codigo.isEmpty || nombre.isEmpty) return;

                  final messenger = ScaffoldMessenger.of(context);
                  await ref.read(activosControllerProvider.notifier).crear(
                        codigo: codigo,
                        nombre: nombre,
                        ubicacion: _ubicacionController.text.trim(),
                      );

                  _codigoController.clear();
                  _nombreController.clear();

                  if (!mounted) return;
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Activo creado localmente y en cola sync.')),
                  );
                },
                icon: const Icon(Icons.add_box_outlined),
                label: const Text('Crear activo'),
              ),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(activosControllerProvider.notifier).cargar(forceRemote: true),
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
                  final activo = state.items[index];
                  return ListTile(
                    leading: const Icon(Icons.handyman_outlined),
                    title: Text('${activo.codigo} · ${activo.nombre}'),
                    subtitle: Text('Ubicación: ${activo.ubicacion}'),
                    trailing: PopupMenuButton<String>(
                      initialValue: activo.estado,
                      onSelected: (value) {
                        ref
                            .read(activosControllerProvider.notifier)
                            .actualizarEstado(id: activo.id, estado: value);
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'Disponible', child: Text('Disponible')),
                        PopupMenuItem(value: 'Asignado', child: Text('Asignado')),
                        PopupMenuItem(value: 'Mantenimiento', child: Text('Mantenimiento')),
                      ],
                      child: Chip(label: Text(activo.estado)),
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

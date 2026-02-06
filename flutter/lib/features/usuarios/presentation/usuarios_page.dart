import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/usuarios_controller.dart';

class UsuariosPage extends ConsumerStatefulWidget {
  const UsuariosPage({super.key});

  @override
  ConsumerState<UsuariosPage> createState() => _UsuariosPageState();
}

class _UsuariosPageState extends ConsumerState<UsuariosPage> {
  final _nombreController = TextEditingController();
  final _emailController = TextEditingController();
  String _rol = 'Técnico';

  static const _roles = <String>['Admin', 'Supervisor', 'Técnico', 'Consulta'];

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(usuariosControllerProvider.notifier).cargar();
    });
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(usuariosControllerProvider);

    return InvShell(
      title: 'Usuarios',
      currentRoute: '/usuarios',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Gestión de usuarios y roles',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            runSpacing: 10,
            spacing: 10,
            crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              SizedBox(
                width: 220,
                child: TextField(
                  controller: _nombreController,
                  decoration: const InputDecoration(labelText: 'Nombre completo'),
                ),
              ),
              SizedBox(
                width: 240,
                child: TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Correo'),
                ),
              ),
              SizedBox(
                width: 160,
                child: DropdownButtonFormField<String>(
                  value: _rol,
                  items: _roles
                      .map((rol) => DropdownMenuItem<String>(value: rol, child: Text(rol)))
                      .toList(growable: false),
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _rol = value);
                  },
                  decoration: const InputDecoration(labelText: 'Rol'),
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  final nombre = _nombreController.text.trim();
                  final email = _emailController.text.trim();
                  if (nombre.isEmpty || email.isEmpty) return;

                  await ref.read(usuariosControllerProvider.notifier).crear(
                        nombre: nombre,
                        email: email,
                        rol: _rol,
                      );

                  _nombreController.clear();
                  _emailController.clear();

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Usuario creado localmente y en cola sync.')),
                    );
                  }
                },
                icon: const Icon(Icons.person_add_alt_1),
                label: const Text('Crear usuario'),
              ),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(usuariosControllerProvider.notifier).cargar(forceRemote: true),
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
                  final user = state.items[index];
                  return ListTile(
                    leading: const Icon(Icons.person_outline),
                    title: Text(user.nombre),
                    subtitle: Text('${user.email} · ${user.rol}'),
                    trailing: PopupMenuButton<String>(
                      initialValue: user.estado,
                      onSelected: (value) {
                        ref
                            .read(usuariosControllerProvider.notifier)
                            .actualizarEstado(id: user.id, estado: value);
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'Activo', child: Text('Activo')),
                        PopupMenuItem(value: 'Suspendido', child: Text('Suspendido')),
                      ],
                      child: Chip(label: Text(user.estado)),
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

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
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(usuariosControllerProvider.notifier).cargar();
    });
  }

  void _mostrarCrearUsuario(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => const _CrearUsuarioDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(usuariosControllerProvider);

    return InvShell(
      title: 'Administración de Usuarios',
      currentRoute: '/usuarios',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Usuarios del sistema',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _mostrarCrearUsuario(context),
                icon: const Icon(Icons.person_add),
                label: const Text('Crear Usuario'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (state.loading) const LinearProgressIndicator(),
          if (state.error != null)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(state.error!, style: const TextStyle(color: Colors.red)),
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
                    leading: CircleAvatar(
                      backgroundColor: user.isActivo ? Colors.green : Colors.grey,
                      child: const Icon(Icons.person, color: Colors.white),
                    ),
                    title: Text(user.nombre),
                    subtitle: Text('${user.rol} · @${user.username}'),
                    trailing: Switch(
                      value: user.isActivo,
                      onChanged: (val) {
                        ref.read(usuariosControllerProvider.notifier).alternarEstado(
                              id: user.id,
                              actualActivo: user.isActivo,
                            );
                      },
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

class _CrearUsuarioDialog extends ConsumerStatefulWidget {
  const _CrearUsuarioDialog();

  @override
  ConsumerState<_CrearUsuarioDialog> createState() => _CrearUsuarioDialogState();
}

class _CrearUsuarioDialogState extends ConsumerState<_CrearUsuarioDialog> {
  final _nombreCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  String _rol = 'Tecnico';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nuevo Usuario'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _nombreCtrl, decoration: const InputDecoration(labelText: 'Nombre')),
          const SizedBox(height: 10),
          TextField(controller: _usernameCtrl, decoration: const InputDecoration(labelText: 'Username')),
          const SizedBox(height: 10),
          InputDecorator(
            decoration: const InputDecoration(labelText: 'Rol'),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _rol,
                isDense: true,
                items: const [
                  DropdownMenuItem(value: 'Admin', child: Text('Admin')),
                  DropdownMenuItem(value: 'Tecnico', child: Text('Tecnico')),
                  DropdownMenuItem(value: 'Inventario', child: Text('Inventario')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _rol = val);
                },
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () async {
            if (_nombreCtrl.text.isEmpty || _usernameCtrl.text.isEmpty) return;
            await ref.read(usuariosControllerProvider.notifier).crear(
                  nombre: _nombreCtrl.text,
                  username: _usernameCtrl.text,
                  rol: _rol,
                );
            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Guardar'),
        ),
      ],
    );
  }
}

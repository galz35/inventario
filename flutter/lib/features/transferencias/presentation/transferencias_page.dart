import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/transferencias_controller.dart';

class TransferenciasPage extends ConsumerStatefulWidget {
  const TransferenciasPage({super.key});

  @override
  ConsumerState<TransferenciasPage> createState() => _TransferenciasPageState();
}

class _TransferenciasPageState extends ConsumerState<TransferenciasPage> {
  final _origenController = TextEditingController(text: 'Almacén Central');
  final _destinoController = TextEditingController();
  final _itemsController = TextEditingController(text: '1');

  Future<void> _showAgregarLineaDialog(BuildContext context, int transferenciaId) async {
    final codigoController = TextEditingController();
    final descripcionController = TextEditingController();
    final cantidadController = TextEditingController(text: '1');

    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Agregar línea'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: codigoController,
                  decoration: const InputDecoration(labelText: 'Código'),
                ),
                TextField(
                  controller: descripcionController,
                  decoration: const InputDecoration(labelText: 'Descripción'),
                ),
                TextField(
                  controller: cantidadController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Cantidad'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Agregar'),
            ),
          ],
        );
      },
    );

    if (result == true && mounted) {
      final cantidad = int.tryParse(cantidadController.text) ?? 1;
      await ref.read(transferenciasControllerProvider.notifier).agregarLinea(
            transferenciaId: transferenciaId,
            codigo: codigoController.text.trim().isEmpty ? 'SIN-COD' : codigoController.text.trim(),
            descripcion: descripcionController.text.trim().isEmpty
                ? 'Sin descripción'
                : descripcionController.text.trim(),
            cantidad: cantidad,
          );
    }
  }

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(transferenciasControllerProvider.notifier).cargar();
    });
  }

  @override
  void dispose() {
    _origenController.dispose();
    _destinoController.dispose();
    _itemsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(transferenciasControllerProvider);
    final total = state.items.length;
    final pendientes = state.items.where((tx) => tx.estado == 'Pendiente').length;
    final enTransito = state.items.where((tx) => tx.estado == 'En tránsito').length;
    final recibidas = state.items.where((tx) => tx.estado == 'Recibida').length;

    return InvShell(
      title: 'Transferencias',
      currentRoute: '/transferencias',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Gestión de transferencias',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(label: Text('Total: $total')),
              Chip(label: Text('Pendientes: $pendientes')),
              Chip(label: Text('En tránsito: $enTransito')),
              Chip(label: Text('Recibidas: $recibidas')),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            runSpacing: 10,
            spacing: 10,
            crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              SizedBox(
                width: 210,
                child: TextField(
                  controller: _origenController,
                  decoration: const InputDecoration(labelText: 'Origen'),
                ),
              ),
              SizedBox(
                width: 210,
                child: TextField(
                  controller: _destinoController,
                  decoration: const InputDecoration(labelText: 'Destino'),
                ),
              ),
              SizedBox(
                width: 120,
                child: TextField(
                  controller: _itemsController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Items'),
                ),
              ),
              FilledButton.icon(
                onPressed: () async {
                  final totalItems = int.tryParse(_itemsController.text) ?? 1;
                  await ref.read(transferenciasControllerProvider.notifier).crear(
                        origen: _origenController.text.trim(),
                        destino: _destinoController.text.trim().isEmpty
                            ? 'Destino sin definir'
                            : _destinoController.text.trim(),
                        totalItems: totalItems,
                      );
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Transferencia creada localmente y en cola sync.')),
                      );
                    }
                  },
                icon: const Icon(Icons.add),
                label: const Text('Crear'),
              ),
              OutlinedButton.icon(
                onPressed: state.loading
                    ? null
                    : () => ref.read(transferenciasControllerProvider.notifier).cargar(forceRemote: true),
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
                  final tx = state.items[index];
                  final lineas = state.lineasPorTransferencia[tx.id] ?? [];
                  final lineasLoading = state.lineasLoading[tx.id] ?? false;
                  return ExpansionTile(
                    leading: const Icon(Icons.local_shipping_outlined),
                    title: Text('#${tx.id} · ${tx.origen} → ${tx.destino}'),
                    subtitle: Text('Estado: ${tx.estado}'),
                    trailing: PopupMenuButton<String>(
                      initialValue: tx.estado,
                      onSelected: (value) {
                        ref
                            .read(transferenciasControllerProvider.notifier)
                            .actualizarEstado(id: tx.id, estado: value);
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'Pendiente', child: Text('Pendiente')),
                        PopupMenuItem(value: 'En tránsito', child: Text('En tránsito')),
                        PopupMenuItem(value: 'Recibida', child: Text('Recibida')),
                      ],
                      child: Chip(label: Text('${tx.totalItems} items · ${tx.estado}')),
                    ),
                    onExpansionChanged: (expanded) {
                      if (expanded && lineas.isEmpty) {
                        ref
                            .read(transferenciasControllerProvider.notifier)
                            .cargarLineas(transferenciaId: tx.id);
                      }
                    },
                    children: [
                      if (lineasLoading) const LinearProgressIndicator(),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Detalle por ítems',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            TextButton.icon(
                              onPressed: () => _showAgregarLineaDialog(context, tx.id),
                              icon: const Icon(Icons.add),
                              label: const Text('Agregar ítem'),
                            ),
                          ],
                        ),
                      ),
                      if (lineas.isEmpty && !lineasLoading)
                        const Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: Text('Sin líneas cargadas.'),
                        ),
                      for (final linea in lineas)
                        ListTile(
                          title: Text('${linea.codigo} · ${linea.descripcion}'),
                          subtitle: Text('Cantidad: ${linea.cantidad} · Recibido: ${linea.recibido}'),
                          trailing: Wrap(
                            spacing: 6,
                            children: [
                              IconButton(
                                tooltip: 'Restar recibido',
                                onPressed: linea.recibido <= 0
                                    ? null
                                    : () {
                                        ref
                                            .read(transferenciasControllerProvider.notifier)
                                            .actualizarRecepcion(
                                              transferenciaId: tx.id,
                                              lineaId: linea.id,
                                              recibido: linea.recibido - 1,
                                            );
                                      },
                                icon: const Icon(Icons.remove_circle_outline),
                              ),
                              IconButton(
                                tooltip: 'Sumar recibido',
                                onPressed: linea.recibido >= linea.cantidad
                                    ? null
                                    : () {
                                        ref
                                            .read(transferenciasControllerProvider.notifier)
                                            .actualizarRecepcion(
                                              transferenciaId: tx.id,
                                              lineaId: linea.id,
                                              recibido: linea.recibido + 1,
                                            );
                                      },
                                icon: const Icon(Icons.add_circle_outline),
                              ),
                            ],
                          ),
                        ),
                    ],
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

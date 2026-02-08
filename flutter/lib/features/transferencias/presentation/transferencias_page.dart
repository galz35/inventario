import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_theme.dart';
import '../../../shared/layout/inv_shell.dart';
import '../../../shared/models/app_nav_items.dart';
import '../application/transferencias_controller.dart';
import '../domain/transferencia_item.dart';

class TransferenciasPage extends ConsumerStatefulWidget {
  const TransferenciasPage({super.key});

  @override
  ConsumerState<TransferenciasPage> createState() => _TransferenciasPageState();
}

class _TransferenciasPageState extends ConsumerState<TransferenciasPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(transferenciasControllerProvider.notifier).cargar();
    });
  }

  void _abrirFormularioCreacion(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => const _CrearTransferenciaDialog(),
    );
  }

  void _verDetalle(BuildContext context, TransferenciaItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _DetalleTransferenciaSheet(item: item),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(transferenciasControllerProvider);

    return InvShell(
      title: 'Transferencias',
      currentRoute: '/transferencias',
      navItems: kMainNavItems,
      onNavigate: (route) => context.go(route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Movimientos de inventario',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _abrirFormularioCreacion(context),
                icon: const Icon(Icons.add_road),
                label: const Text('Nueva transferencia'),
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
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.only(top: 10, bottom: 80),
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 400,
                childAspectRatio: 1.5,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: state.items.length,
              itemBuilder: (context, index) {
                final item = state.items[index];
                return Card(
                  child: InkWell(
                    onTap: () => _verDetalle(context, item),
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Chip(
                                label: Text(item.estado),
                                backgroundColor: _colorEstado(item.estado),
                              ),
                              Text(
                                '#${item.id}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          Text(
                            item.origen,
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                          ),
                          const Icon(Icons.arrow_downward, size: 16, color: AppTheme.accentBlue),
                          Text(
                            item.destino,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                          const Spacer(),
                          Row(
                            children: [
                              const Icon(Icons.inventory_2_outlined, size: 16),
                              const SizedBox(width: 4),
                              Text('${item.totalItems} items'),
                              const Spacer(),
                              const Text('Ver detalle', style: TextStyle(color: AppTheme.accentBlue)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _colorEstado(String estado) {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return Colors.orange.withValues(alpha: 0.2);
      case 'en tránsito':
        return Colors.blue.withValues(alpha: 0.2);
      case 'recibido':
        return Colors.green.withValues(alpha: 0.2);
      default:
        return Colors.grey.withValues(alpha: 0.2);
    }
  }
}

class _CrearTransferenciaDialog extends ConsumerStatefulWidget {
  const _CrearTransferenciaDialog();

  @override
  ConsumerState<_CrearTransferenciaDialog> createState() => _CrearTransferenciaDialogState();
}

class _CrearTransferenciaDialogState extends ConsumerState<_CrearTransferenciaDialog> {
  final _origenCtrl = TextEditingController();
  final _destinoCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nueva Transferencia'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _origenCtrl,
            decoration: const InputDecoration(labelText: 'Bodega Origen'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _destinoCtrl,
            decoration: const InputDecoration(labelText: 'Bodega Destino'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
        FilledButton(
          onPressed: () async {
            if (_origenCtrl.text.isEmpty || _destinoCtrl.text.isEmpty) return;
            await ref.read(transferenciasControllerProvider.notifier).crear(
                  origen: _origenCtrl.text,
                  destino: _destinoCtrl.text,
                  totalItems: 0,
                );
            if (context.mounted) Navigator.of(context).pop();
          },
          child: const Text('Crear'),
        ),
      ],
    );
  }
}

class _DetalleTransferenciaSheet extends ConsumerStatefulWidget {
  const _DetalleTransferenciaSheet({required this.item});

  final TransferenciaItem item;

  @override
  ConsumerState<_DetalleTransferenciaSheet> createState() => _DetalleTransferenciaSheetState();
}

class _DetalleTransferenciaSheetState extends ConsumerState<_DetalleTransferenciaSheet> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(transferenciasControllerProvider.notifier).cargarLineas(
            transferenciaId: widget.item.id,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(transferenciasControllerProvider);
    final lineas = state.lineasPorTransferencia[widget.item.id] ?? [];
    final isLoading = state.lineasLoading[widget.item.id] ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text('Transferencia #${widget.item.id}'),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.close),
          ),
        ],
      ),
      body: Column(
        children: [
          ListTile(
            title: Text('${widget.item.origen} ➔ ${widget.item.destino}'),
            subtitle: Text('Estado: ${widget.item.estado}'),
            trailing: PopupMenuButton<String>(
              onSelected: (val) {
                ref
                    .read(transferenciasControllerProvider.notifier)
                    .actualizarEstado(id: widget.item.id, estado: val);
                Navigator.of(context).pop();
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'En tránsito', child: Text('Iniciar tránsito')),
                PopupMenuItem(value: 'Recibido', child: Text('Finalizar recepción')),
              ],
              child: const Icon(Icons.edit),
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Text('Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                  onPressed: () => _agregarLinea(context),
                  icon: const Icon(Icons.add_circle),
                  tooltip: 'Agregar item',
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: lineas.length,
                    itemBuilder: (context, index) {
                      final linea = lineas[index];
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(linea.cantidad.toString()),
                        ),
                        title: Text(linea.descripcion),
                        subtitle: Text(linea.codigo),
                        trailing: SizedBox(
                          width: 120,
                          child: Row(
                            children: [
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('Recibido: ${linea.recibido}'),
                                  Text('Faltan: ${linea.cantidad - linea.recibido}',
                                      style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(Icons.check_circle_outline),
                                onPressed: () {
                                  if (linea.recibido < linea.cantidad) {
                                    ref
                                        .read(transferenciasControllerProvider.notifier)
                                        .actualizarRecepcion(
                                          transferenciaId: widget.item.id,
                                          lineaId: linea.id,
                                          recibido: linea.recibido + 1,
                                        );
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _agregarLinea(BuildContext context) {
    final codigoCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final cantCtrl = TextEditingController(text: '1');

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Agregar Item'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: codigoCtrl, decoration: const InputDecoration(labelText: 'Código')),
            const SizedBox(height: 8),
            TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Descripción')),
            const SizedBox(height: 8),
            TextField(
              controller: cantCtrl,
              decoration: const InputDecoration(labelText: 'Cantidad'),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () async {
              final cant = int.tryParse(cantCtrl.text) ?? 1;
              if (codigoCtrl.text.isEmpty) return;

              await ref.read(transferenciasControllerProvider.notifier).agregarLinea(
                    transferenciaId: widget.item.id,
                    codigo: codigoCtrl.text,
                    descripcion: descCtrl.text,
                    cantidad: cant,
                  );
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Agregar'),
          ),
        ],
      ),
    );
  }
}

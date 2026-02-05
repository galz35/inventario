import '../domain/inventario_item.dart';

abstract class InventarioRepository {
  Future<List<InventarioItem>> listarStock({bool forceRemote = false});

  Future<void> actualizarStockLocal(List<InventarioItem> items);

  Future<void> ajustarStock({
    required int id,
    required double delta,
    required String motivo,
  });
}

import '../domain/transferencia_item.dart';

abstract class TransferenciasRepository {
  Future<List<TransferenciaItem>> listar({bool forceRemote = false});

  Future<int> crear({
    required String origen,
    required String destino,
    required int totalItems,
  });

  Future<void> actualizarEstado({
    required int id,
    required String estado,
  });

  Future<List<TransferenciaLineaItem>> listarLineas({
    required int transferenciaId,
  });

  Future<int> agregarLinea({
    required int transferenciaId,
    required String codigo,
    required String descripcion,
    required int cantidad,
  });

  Future<void> actualizarRecepcion({
    required int lineaId,
    required int recibido,
  });
}

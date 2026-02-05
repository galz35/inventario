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
}

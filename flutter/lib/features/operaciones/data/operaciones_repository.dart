import '../domain/operacion_item.dart';

abstract class OperacionesRepository {
  Future<List<OperacionItem>> listar({bool forceRemote = false});

  Future<int> crear({
    required String codigoOt,
    required String tecnico,
    required int materialesUsados,
  });

  Future<void> actualizarEstado({
    required int id,
    required String estado,
  });
}

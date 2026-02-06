import '../domain/activo_item.dart';

abstract class ActivosRepository {
  Future<List<ActivoItem>> listar({bool forceRemote = false});

  Future<int> crear({
    required String codigo,
    required String nombre,
    required String ubicacion,
  });

  Future<void> actualizarEstado({
    required int id,
    required String estado,
  });
}

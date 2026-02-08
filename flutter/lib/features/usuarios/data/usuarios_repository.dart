import '../domain/usuario_item.dart';

abstract class UsuariosRepository {
  Future<List<UsuarioItem>> listar({bool forceRemote = false});

  Future<int> crear({
    required String username,
    required String nombre,
    required String rol,
  });

  Future<void> actualizarEstado({
    required int id,
    required String estado,
  });
}

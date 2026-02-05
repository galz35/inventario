import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/usuarios_repository.dart';
import '../data/usuarios_repository_impl.dart';
import '../domain/usuario_item.dart';

class UsuariosState {
  const UsuariosState({
    this.items = const <UsuarioItem>[],
    this.loading = false,
    this.error,
  });

  final List<UsuarioItem> items;
  final bool loading;
  final String? error;

  UsuariosState copyWith({
    List<UsuarioItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return UsuariosState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class UsuariosController extends StateNotifier<UsuariosState> {
  UsuariosController(this._repository) : super(const UsuariosState());

  final UsuariosRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listar(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'No se pudieron cargar usuarios.');
    }
  }

  Future<void> crear({required String nombre, required String email, required String rol}) async {
    await _repository.crear(nombre: nombre, email: email, rol: rol);
    await cargar();
  }

  Future<void> actualizarEstado({required int id, required String estado}) async {
    await _repository.actualizarEstado(id: id, estado: estado);
    await cargar();
  }
}

final usuariosLocalDbProvider = Provider<LocalDb>((ref) => LocalDb());

final usuariosRepositoryProvider = Provider<UsuariosRepository>((ref) {
  return UsuariosRepositoryImpl(ref.watch(usuariosLocalDbProvider));
});

final usuariosControllerProvider =
    StateNotifierProvider<UsuariosController, UsuariosState>((ref) {
  return UsuariosController(ref.watch(usuariosRepositoryProvider));
});

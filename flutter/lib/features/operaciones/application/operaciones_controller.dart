import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/operaciones_repository.dart';
import '../data/operaciones_repository_impl.dart';
import '../domain/operacion_item.dart';

class OperacionesState {
  const OperacionesState({
    this.items = const <OperacionItem>[],
    this.loading = false,
    this.error,
  });

  final List<OperacionItem> items;
  final bool loading;
  final String? error;

  OperacionesState copyWith({
    List<OperacionItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return OperacionesState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class OperacionesController extends StateNotifier<OperacionesState> {
  OperacionesController(this._repository) : super(const OperacionesState());

  final OperacionesRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listar(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'No se pudo cargar operaciones.');
    }
  }

  Future<void> crear({
    required String codigoOt,
    required String tecnico,
    required int materialesUsados,
  }) async {
    await _repository.crear(
      codigoOt: codigoOt,
      tecnico: tecnico,
      materialesUsados: materialesUsados,
    );
    await cargar();
  }

  Future<void> actualizarEstado({required int id, required String estado}) async {
    await _repository.actualizarEstado(id: id, estado: estado);
    await cargar();
  }
}

final operacionesLocalDbProvider = Provider<LocalDb>((ref) => LocalDb());

final operacionesRepositoryProvider = Provider<OperacionesRepository>((ref) {
  return OperacionesRepositoryImpl(ref.watch(operacionesLocalDbProvider));
});

final operacionesControllerProvider =
    StateNotifierProvider<OperacionesController, OperacionesState>((ref) {
  return OperacionesController(ref.watch(operacionesRepositoryProvider));
});

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/activos_repository.dart';
import '../data/activos_repository_impl.dart';
import '../domain/activo_item.dart';

class ActivosState {
  const ActivosState({
    this.items = const <ActivoItem>[],
    this.loading = false,
    this.error,
  });

  final List<ActivoItem> items;
  final bool loading;
  final String? error;

  ActivosState copyWith({
    List<ActivoItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return ActivosState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ActivosController extends StateNotifier<ActivosState> {
  ActivosController(this._repository) : super(const ActivosState());

  final ActivosRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listar(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'No se pudieron cargar activos.');
    }
  }

  Future<void> crear({required String codigo, required String nombre, required String ubicacion}) async {
    await _repository.crear(codigo: codigo, nombre: nombre, ubicacion: ubicacion);
    await cargar();
  }

  Future<void> actualizarEstado({required int id, required String estado}) async {
    await _repository.actualizarEstado(id: id, estado: estado);
    await cargar();
  }
}

final activosLocalDbProvider = Provider<LocalDb>((ref) => LocalDb());

final activosRepositoryProvider = Provider<ActivosRepository>((ref) {
  return ActivosRepositoryImpl(ref.watch(activosLocalDbProvider));
});

final activosControllerProvider =
    StateNotifierProvider<ActivosController, ActivosState>((ref) {
  return ActivosController(ref.watch(activosRepositoryProvider));
});

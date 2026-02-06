import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/inventario_repository.dart';
import '../data/inventario_repository_impl.dart';
import '../domain/inventario_item.dart';

class InventarioState {
  const InventarioState({
    this.items = const <InventarioItem>[],
    this.loading = false,
    this.error,
  });

  final List<InventarioItem> items;
  final bool loading;
  final String? error;

  InventarioState copyWith({
    List<InventarioItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return InventarioState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class InventarioController extends StateNotifier<InventarioState> {
  InventarioController(this._repository) : super(const InventarioState());

  final InventarioRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listarStock(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(
        loading: false,
        error: 'No se pudo cargar inventario.',
      );
    }
  }

  Future<void> ajustarStock({
    required int id,
    required double delta,
    required String motivo,
  }) async {
    await _repository.ajustarStock(id: id, delta: delta, motivo: motivo);
    await cargar();
  }
}

final localDbProvider = Provider<LocalDb>((ref) => LocalDb());

final inventarioRepositoryProvider = Provider<InventarioRepository>((ref) {
  return InventarioRepositoryImpl(ref.watch(localDbProvider));
});

final inventarioControllerProvider =
    StateNotifierProvider<InventarioController, InventarioState>((ref) {
  return InventarioController(ref.watch(inventarioRepositoryProvider));
});

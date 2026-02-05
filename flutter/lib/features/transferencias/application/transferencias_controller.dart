import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/transferencias_repository.dart';
import '../data/transferencias_repository_impl.dart';
import '../domain/transferencia_item.dart';

class TransferenciasState {
  const TransferenciasState({
    this.items = const <TransferenciaItem>[],
    this.loading = false,
    this.error,
  });

  final List<TransferenciaItem> items;
  final bool loading;
  final String? error;

  TransferenciasState copyWith({
    List<TransferenciaItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return TransferenciasState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class TransferenciasController extends StateNotifier<TransferenciasState> {
  TransferenciasController(this._repository) : super(const TransferenciasState());

  final TransferenciasRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listar(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'No se pudo cargar transferencias.');
    }
  }

  Future<void> crear({
    required String origen,
    required String destino,
    required int totalItems,
  }) async {
    await _repository.crear(origen: origen, destino: destino, totalItems: totalItems);
    await cargar();
  }

  Future<void> actualizarEstado({required int id, required String estado}) async {
    await _repository.actualizarEstado(id: id, estado: estado);
    await cargar();
  }
}

final transferenciasLocalDbProvider = Provider<LocalDb>((ref) => LocalDb());

final transferenciasRepositoryProvider = Provider<TransferenciasRepository>((ref) {
  return TransferenciasRepositoryImpl(ref.watch(transferenciasLocalDbProvider));
});

final transferenciasControllerProvider =
    StateNotifierProvider<TransferenciasController, TransferenciasState>((ref) {
  return TransferenciasController(ref.watch(transferenciasRepositoryProvider));
});

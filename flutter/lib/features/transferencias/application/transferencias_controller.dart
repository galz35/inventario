import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/transferencias_repository.dart';
import '../data/transferencias_repository_impl.dart';
import '../domain/transferencia_item.dart';

class TransferenciasState {
  const TransferenciasState({
    this.items = const <TransferenciaItem>[],
    this.lineasPorTransferencia = const <int, List<TransferenciaLineaItem>>{},
    this.lineasLoading = const <int, bool>{},
    this.loading = false,
    this.error,
  });

  final List<TransferenciaItem> items;
  final Map<int, List<TransferenciaLineaItem>> lineasPorTransferencia;
  final Map<int, bool> lineasLoading;
  final bool loading;
  final String? error;

  TransferenciasState copyWith({
    List<TransferenciaItem>? items,
    Map<int, List<TransferenciaLineaItem>>? lineasPorTransferencia,
    Map<int, bool>? lineasLoading,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return TransferenciasState(
      items: items ?? this.items,
      lineasPorTransferencia: lineasPorTransferencia ?? this.lineasPorTransferencia,
      lineasLoading: lineasLoading ?? this.lineasLoading,
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

  Future<void> cargarLineas({required int transferenciaId}) async {
    final updatedLoading = Map<int, bool>.from(state.lineasLoading);
    updatedLoading[transferenciaId] = true;
    state = state.copyWith(lineasLoading: updatedLoading);

    try {
      final lineas = await _repository.listarLineas(transferenciaId: transferenciaId);
      final updatedLineas = Map<int, List<TransferenciaLineaItem>>.from(state.lineasPorTransferencia);
      updatedLineas[transferenciaId] = lineas;
      updatedLoading[transferenciaId] = false;
      state = state.copyWith(lineasPorTransferencia: updatedLineas, lineasLoading: updatedLoading);
    } catch (_) {
      updatedLoading[transferenciaId] = false;
      state = state.copyWith(lineasLoading: updatedLoading, error: 'No se pudieron cargar líneas.');
    }
  }

  Future<void> agregarLinea({
    required int transferenciaId,
    required String codigo,
    required String descripcion,
    required int cantidad,
  }) async {
    await _repository.agregarLinea(
      transferenciaId: transferenciaId,
      codigo: codigo,
      descripcion: descripcion,
      cantidad: cantidad,
    );
    await cargarLineas(transferenciaId: transferenciaId);
    await cargar();
  }

  Future<void> actualizarRecepcion({
    required int transferenciaId,
    required int lineaId,
    required int recibido,
  }) async {
    await _repository.actualizarRecepcion(lineaId: lineaId, recibido: recibido);
    await cargarLineas(transferenciaId: transferenciaId);
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

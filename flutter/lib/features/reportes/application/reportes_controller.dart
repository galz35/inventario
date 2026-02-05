import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_db.dart';
import '../data/reportes_repository.dart';
import '../data/reportes_repository_impl.dart';
import '../domain/reporte_item.dart';

class ReportesState {
  const ReportesState({
    this.items = const <ReporteItem>[],
    this.loading = false,
    this.error,
  });

  final List<ReporteItem> items;
  final bool loading;
  final String? error;

  ReportesState copyWith({
    List<ReporteItem>? items,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return ReportesState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ReportesController extends StateNotifier<ReportesState> {
  ReportesController(this._repository) : super(const ReportesState());

  final ReportesRepository _repository;

  Future<void> cargar({bool forceRemote = false}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await _repository.listar(forceRemote: forceRemote);
      state = state.copyWith(items: items, loading: false);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'No se pudieron cargar reportes.');
    }
  }

  Future<void> generar({required String tipo, required String periodo}) async {
    await _repository.generar(tipo: tipo, periodo: periodo);
    await cargar();
  }
}

final reportesLocalDbProvider = Provider<LocalDb>((ref) => LocalDb());

final reportesRepositoryProvider = Provider<ReportesRepository>((ref) {
  return ReportesRepositoryImpl(ref.watch(reportesLocalDbProvider));
});

final reportesControllerProvider =
    StateNotifierProvider<ReportesController, ReportesState>((ref) {
  return ReportesController(ref.watch(reportesRepositoryProvider));
});

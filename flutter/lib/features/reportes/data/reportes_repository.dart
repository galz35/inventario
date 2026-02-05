import '../domain/reporte_item.dart';

abstract class ReportesRepository {
  Future<List<ReporteItem>> listar({bool forceRemote = false});

  Future<int> generar({
    required String tipo,
    required String periodo,
  });
}

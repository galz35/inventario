class ReporteItem {
  const ReporteItem({
    required this.id,
    required this.tipo,
    required this.periodo,
    required this.estado,
    required this.generatedAt,
  });

  final int id;
  final String tipo;
  final String periodo;
  final String estado;
  final DateTime generatedAt;
}

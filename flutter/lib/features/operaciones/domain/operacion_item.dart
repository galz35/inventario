class OperacionItem {
  const OperacionItem({
    required this.id,
    required this.codigoOt,
    required this.tecnico,
    required this.estado,
    required this.materialesUsados,
  });

  final int id;
  final String codigoOt;
  final String tecnico;
  final String estado;
  final int materialesUsados;
}

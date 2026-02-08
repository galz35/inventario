class TransferenciaItem {
  const TransferenciaItem({
    required this.id,
    required this.origen,
    required this.destino,
    required this.estado,
    required this.totalItems,
  });

  final int id;
  final String origen;
  final String destino;
  final String estado;
  final int totalItems;
}

class TransferenciaLineaItem {
  const TransferenciaLineaItem({
    required this.id,
    required this.codigo,
    required this.descripcion,
    required this.cantidad,
    required this.recibido,
  });

  final int id;
  final String codigo;
  final String descripcion;
  final int cantidad;
  final int recibido;
}

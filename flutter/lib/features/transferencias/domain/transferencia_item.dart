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

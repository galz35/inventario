class InventarioItem {
  const InventarioItem({
    required this.id,
    required this.codigo,
    required this.descripcion,
    required this.stock,
  });

  final int id;
  final String codigo;
  final String descripcion;
  final double stock;
}

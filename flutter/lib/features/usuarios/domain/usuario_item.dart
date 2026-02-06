class UsuarioItem {
  const UsuarioItem({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    required this.estado,
  });

  final int id;
  final String nombre;
  final String email;
  final String rol;
  final String estado;
}

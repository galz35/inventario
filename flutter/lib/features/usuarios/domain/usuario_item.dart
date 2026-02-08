class UsuarioItem {
  const UsuarioItem({
    required this.id,
    required this.username,
    required this.nombre,
    required this.rol,
    required this.estado,
    required this.lastLogin,
  });

  final int id;
  final String username;
  final String nombre;
  final String rol;
  final String estado;
  final String? lastLogin;

  bool get isActivo => estado == 'Activo';
}

class AppUser {
  const AppUser({
    required this.id,
    required this.nombre,
    required this.rol,
    required this.permisos,
  });

  final int id;
  final String nombre;
  final String rol;
  final List<String> permisos;

  bool canAccess(String module) {
    return permisos.contains(module) || rol.toLowerCase() == 'admin';
  }
}

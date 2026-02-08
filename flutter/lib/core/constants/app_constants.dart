class AppConstants {
  // Cambiar esta IP a la de tu laptop cuando cambies de red WiFi
  // Usa 'ipconfig' en Windows para encontrar tu IP local
  static const String apiBaseUrl = 'http://10.4.127.159:3000/api';
  static const Duration syncInterval = Duration(minutes: 5);

  static const List<String> allModules = <String>[
    'dashboard',
    'inventario',
    'transferencias',
    'operaciones',
    'reportes',
    'usuarios',
    'activos',
  ];
}

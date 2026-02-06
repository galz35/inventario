class AppConstants {
  static const String apiBaseUrl = 'https://api.inventario.local';
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

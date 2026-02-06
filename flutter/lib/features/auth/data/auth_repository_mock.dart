import 'dart:developer';

import 'auth_repository.dart';
import '../domain/app_user.dart';

class AuthRepositoryMock implements AuthRepository {
  AppUser? _user;

  @override
  Future<AppUser?> currentUser() async => _user;

  @override
  Future<AppUser> login({required String username, required String password}) async {
    _user = AppUser(
      id: 1,
      nombre: username.isEmpty ? 'Operador' : username,
      rol: 'Admin',
      permisos: const <String>[
        'dashboard',
        'inventario',
        'transferencias',
        'operaciones',
        'reportes',
        'usuarios',
        'activos',
      ],
    );
    return _user!;
  }

  @override
  Future<void> registerDeviceToken({
    required int userId,
    required String token,
    required String role,
  }) async {
    log(
      'Mock register FCM token user=$userId role=$role token=$token',
      name: 'AuthRepositoryMock',
    );
  }

  @override
  Future<void> logout() async {
    _user = null;
  }
}

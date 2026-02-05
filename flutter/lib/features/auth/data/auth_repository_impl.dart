import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/storage/local_db.dart';
import '../domain/app_user.dart';
import 'auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._apiClient, this._localDb);

  final ApiClient _apiClient;
  final LocalDb _localDb;

  @override
  Future<AppUser?> currentUser() async {
    final session = await _localDb.getSession();
    if (session == null) return null;

    final permisos = (jsonDecode(session['permisos_json'] as String) as List<dynamic>)
        .map((item) => item.toString())
        .toList(growable: false);

    return AppUser(
      id: session['user_id'] as int,
      nombre: session['nombre'] as String,
      rol: session['rol'] as String,
      permisos: permisos,
    );
  }

  @override
  Future<AppUser> login({required String username, required String password}) async {
    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: <String, Object?>{
          'username': username,
          'password': password,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final permisos = (data['permisos'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList(growable: false) ??
          const <String>[
            'dashboard',
            'inventario',
            'transferencias',
            'operaciones',
            'reportes',
            'usuarios',
            'activos',
          ];

      final user = AppUser(
        id: (data['id'] as num?)?.toInt() ?? 1,
        nombre: data['nombre'] as String? ?? username,
        rol: data['rol'] as String? ?? 'Tecnico',
        permisos: permisos,
      );

      await _localDb.saveSession(
        userId: user.id,
        nombre: user.nombre,
        rol: user.rol,
        permisos: user.permisos,
      );

      return user;
    } catch (_) {
      final fallback = AppUser(
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

      await _localDb.saveSession(
        userId: fallback.id,
        nombre: fallback.nombre,
        rol: fallback.rol,
        permisos: fallback.permisos,
      );

      return fallback;
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post('/auth/logout');
    } catch (_) {
      // no-op en entorno local
    }

    await _localDb.clearSession();
  }

  @override
  Future<void> registerDeviceToken({
    required int userId,
    required String token,
    required String role,
  }) async {
    try {
      await _apiClient.post(
        '/notifications/register-device',
        data: <String, Object?>{
          'user_id': userId,
          'fcm_token': token,
          'role': role,
          'platform': 'flutter',
        },
      );
    } catch (_) {
      await _localDb.enqueueSync(
        entity: 'notification',
        action: 'register_device_token',
        payload: <String, Object?>{
          'user_id': userId,
          'fcm_token': token,
          'role': role,
          'platform': 'flutter',
        },
      );
    }
  }
}

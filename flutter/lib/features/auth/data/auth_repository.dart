import '../domain/app_user.dart';

abstract class AuthRepository {
  Future<AppUser> login({required String username, required String password});

  Future<void> logout();

  Future<AppUser?> currentUser();

  Future<void> registerDeviceToken({
    required int userId,
    required String token,
    required String role,
  });
}

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/notifications/push_notification_service.dart';
import '../../../core/storage/local_db.dart';
import '../data/auth_repository.dart';
import '../data/auth_repository_impl.dart';
import '../domain/app_user.dart';

class AuthState {
  const AuthState({
    this.user,
    this.loading = false,
    this.error,
  });

  final AppUser? user;
  final bool loading;
  final String? error;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    AppUser? user,
    bool? loading,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState());

  final AuthRepository _repository;

  Future<void> hydrate() async {
    final user = await _repository.currentUser();
    state = state.copyWith(user: user, clearError: true);
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final user = await _repository.login(username: username, password: password);

      // Push notifications son opcionales (requieren Firebase configurado)
      try {
        final token = await PushNotificationService.instance.getToken();
        if (token != null && token.isNotEmpty) {
          await _repository.registerDeviceToken(
            userId: user.id,
            token: token,
            role: user.rol,
          );
        }
        await PushNotificationService.instance.subscribeUserTopics(role: user.rol);
      } catch (_) {
        // Firebase no configurado, continuar sin notificaciones
      }

      state = state.copyWith(user: user, loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'No se pudo iniciar sesión. Verifica tu conexión.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState();
  }
}

class AuthRouterNotifier extends ChangeNotifier {
  AuthRouterNotifier(this.ref) {
    ref.listen<AuthState>(authControllerProvider, (_, __) => notifyListeners());
  }

  final Ref ref;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ApiClient(baseUrl: AppConstants.apiBaseUrl),
    LocalDb(),
  );
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});

final authRouterNotifierProvider = Provider<AuthRouterNotifier>((ref) {
  return AuthRouterNotifier(ref);
});

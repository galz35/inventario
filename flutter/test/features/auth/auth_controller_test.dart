import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Import local files - adjusting paths assuming test folder structure
import 'package:inventario/features/auth/application/auth_controller.dart';
import 'package:inventario/features/auth/data/auth_repository.dart';
import 'package:inventario/features/auth/domain/app_user.dart';

@GenerateMocks([AuthRepository])
import 'auth_controller_test.mocks.dart';

void main() {
  late MockAuthRepository mockRepository;
  late ProviderContainer container;

  setUp(() {
    mockRepository = MockAuthRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockRepository),
      ],
    );
  });

  test('Initial state is not authenticated', () {
    final state = container.read(authControllerProvider);
    expect(state.user, null);
    expect(state.isAuthenticated, false);
  });

  test('Login success updates state', () async {
    const user = AppUser(id: 1, nombre: 'Test', rol: 'Admin', permisos: []);
    when(mockRepository.login(username: 'admin', password: '123'))
        .thenAnswer((_) async => user);
    
    // Stub other calls
    when(mockRepository.registerDeviceToken(userId: 1, token: anyNamed('token'), role: anyNamed('role')))
        .thenAnswer((_) async {});

    final controller = container.read(authControllerProvider.notifier);
    final success = await controller.login('admin', '123');

    expect(success, true);
    expect(container.read(authControllerProvider).user, user);
  });

  test('Logout clears state', () async {
    when(mockRepository.logout()).thenAnswer((_) async {});
    
    final controller = container.read(authControllerProvider.notifier);
    await controller.logout();

    expect(container.read(authControllerProvider).user, null);
  });
}

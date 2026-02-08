import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:inventario/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('end-to-end test', () {
    testWidgets('Login and navigate to dashboard', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify login page
      expect(find.text('INVCORE'), findsOneWidget);

      // Enter credentials (using default mock text in UI)
      await tester.tap(find.text('Ingresar'));
      await tester.pumpAndSettle();

      // Verify dashboard
      expect(find.text('Dashboard'), findsOneWidget);
    });
  });
}

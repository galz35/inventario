import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

// Firebase es opcional - descomenta cuando tengas una cuenta configurada
// import 'package:firebase_core/firebase_core.dart';
// import 'core/notifications/push_notification_service.dart';
// import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase es opcional. Si no tienes cuenta, esto no afecta.
  // Descomenta las siguientes líneas cuando configures Firebase:
  /*
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await PushNotificationService.instance.initialize();
  } catch (e) {
    debugPrint('Firebase no configurado: $e');
  }
  */

  runApp(
    const ProviderScope(
      child: InventarioApp(),
    ),
  );
}

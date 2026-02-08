import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/notifications/push_notification_service.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar Firebase solo si existen las opciones generadas
  // En un entorno real, se debe ejecutar 'flutterfire configure' para generar firebase_options.dart
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Inicializar servicio de notificaciones
    await PushNotificationService.instance.initialize();
  } catch (e) {
    debugPrint('Firebase initialization failed or pending configuration: $e');
  }

  runApp(
    const ProviderScope(
      child: InventarioApp(),
    ),
  );
}

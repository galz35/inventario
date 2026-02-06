import 'dart:developer';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  static const String technicianTopic = 'tecnicos_asignaciones';

  Future<void> initialize() async {
    if (kIsWeb) {
      await _initializeFirebase();
      await _requestPermission();
      await _setupForegroundListeners();
      return;
    }

    if (defaultTargetPlatform != TargetPlatform.android &&
        defaultTargetPlatform != TargetPlatform.iOS) {
      return;
    }

    await _initializeFirebase();
    await _requestPermission();
    await _setupForegroundListeners();
    await subscribeToTopic(technicianTopic);
  }

  Future<void> _initializeFirebase() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
    } catch (e, st) {
      log('FCM init error', error: e, stackTrace: st, name: 'PushNotificationService');
    }
  }

  Future<String?> getToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (e, st) {
      log('FCM getToken error', error: e, stackTrace: st, name: 'PushNotificationService');
      return null;
    }
  }

  Future<void> _requestPermission() async {
    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      final token = await getToken();
      log('FCM token: $token', name: 'PushNotificationService');
    } catch (e, st) {
      log('FCM permission/token error', error: e, stackTrace: st, name: 'PushNotificationService');
    }
  }

  Future<void> _setupForegroundListeners() async {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log(
        'FCM foreground: title=${message.notification?.title} body=${message.notification?.body} data=${message.data}',
        name: 'PushNotificationService',
      );
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log('FCM opened app: ${message.data}', name: 'PushNotificationService');
    });
  }

  Future<void> subscribeUserTopics({required String role}) async {
    final normalized = role.toLowerCase();
    await subscribeToTopic(technicianTopic);
    await subscribeToTopic('rol_$normalized');
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
    } catch (e, st) {
      log('FCM subscribe error topic=$topic', error: e, stackTrace: st, name: 'PushNotificationService');
    }
  }
}

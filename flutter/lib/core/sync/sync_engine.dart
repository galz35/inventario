import 'dart:convert';

import '../storage/local_db.dart';

class SyncEngine {
  SyncEngine(this._localDb);

  final LocalDb _localDb;

  Future<int> runPendingQueue() async {
    final db = await _localDb.instance();
    final pending = await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: <Object?>['pending'],
      orderBy: 'id ASC',
      limit: 50,
    );

    var processed = 0;
    var failed = 0;
    var notificationProcessed = 0;
    var notificationFailed = 0;

    for (final row in pending) {
      try {
        final payloadRaw = row['payload'] as String;
        final payload = jsonDecode(payloadRaw) as Map<String, dynamic>;

        final entity = row['entity'] as String;
        final action = row['action'] as String;

        _validatePayload(entity: entity, action: action, payload: payload);

        await db.update(
          'sync_queue',
          <String, Object?>{'status': 'done'},
          where: 'id = ?',
          whereArgs: <Object?>[row['id']],
        );

        if (entity == 'notification') {
          notificationProcessed++;
        }

        processed++;
      } catch (_) {
        failed++;
        final entity = row['entity'] as String;
        if (entity == 'notification') {
          notificationFailed++;
        }

        final retries = (row['retries'] as int) + 1;
        await db.update(
          'sync_queue',
          <String, Object?>{
            'retries': retries,
            'status': retries >= 5 ? 'error' : 'pending',
          },
          where: 'id = ?',
          whereArgs: <Object?>[row['id']],
        );
      }
    }

    await db.insert('sync_log', <String, Object?>{
      'scope': 'sync_queue.push',
      'detail':
          'Procesados $processed, fallidos $failed, notifications ok $notificationProcessed, notifications fail $notificationFailed, total ${pending.length}',
      'status': failed == 0 ? 'ok' : 'partial',
      'created_at': DateTime.now().toIso8601String(),
    });

    return processed;
  }

  void _validatePayload({
    required String entity,
    required String action,
    required Map<String, dynamic> payload,
  }) {
    if (entity == 'notification' && action == 'register_device_token') {
      final userId = payload['user_id'];
      final token = payload['fcm_token'];
      if (userId is! int && userId is! num) {
        throw const FormatException('notification.register_device_token sin user_id válido');
      }
      if (token is! String || token.isEmpty) {
        throw const FormatException('notification.register_device_token sin fcm_token válido');
      }
    }

    if (entity == 'notification' && action == 'technician_assignment') {
      final topic = payload['topic'];
      final title = payload['title'];
      if (topic is! String || topic.isEmpty) {
        throw const FormatException('notification.technician_assignment sin topic válido');
      }
      if (title is! String || title.isEmpty) {
        throw const FormatException('notification.technician_assignment sin title válido');
      }
    }
  }
}

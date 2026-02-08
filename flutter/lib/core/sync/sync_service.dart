import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import '../api/api_client.dart';
import '../storage/local_db.dart';
import '../storage/secure_storage.dart';

class SyncService {
  final LocalDb _localDb;
  final ApiClient _api = ApiClient();

  SyncService(this._localDb);

  /// Ejecuta sincronización completa: push + pull
  Future<SyncResult> syncAll() async {
    final pushResult = await pushChanges();
    final pullResult = await pullChanges();
    
    return SyncResult(
      pushed: pushResult.successCount,
      pulled: pullResult.totalItems,
      errors: pushResult.errors,
    );
  }

  /// Envía cambios locales al servidor
  Future<PushResult> pushChanges() async {
    final db = await _localDb.database;
    
    // Obtener items pendientes
    final pending = await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );

    if (pending.isEmpty) {
      return PushResult(successCount: 0, errors: 0, results: []);
    }

    final userId = await SecureStorage.getUserId();
    final deviceId = await SecureStorage.getDeviceId();

    // Validar userId
    if (userId == null) {
        // Si no hay usuario, no podemos sincronizar
        return PushResult(successCount: 0, errors: pending.length, results: []);
    }

    final items = pending.map((row) => {
      'localId': row['id'].toString(),
      'entity': row['entity'],
      'action': row['action'],
      'payload': jsonDecode(row['payload'] as String),
      'createdAt': row['created_at'],
    }).toList();

    try {
      final response = await _api.post('/sync/push', data: {
        'deviceId': deviceId,
        'userId': userId,
        'items': items,
      });

      final data = response.data as Map<String, dynamic>;
      final results = (data['results'] as List).cast<Map<String, dynamic>>();

      // Actualizar estado de cada item
      for (final result in results) {
        final status = result['status'] == 'success' ? 'done' : 'error';
        await db.update(
          'sync_queue',
          {'status': status, 'synced_at': DateTime.now().toIso8601String()},
          where: 'id = ?',
          whereArgs: [int.parse(result['localId'])],
        );
      }

      return PushResult(
        successCount: data['successCount'] ?? 0,
        errors: data['errorCount'] ?? 0,
        results: results,
      );
    } catch (e) {
      // Marcar como error pero mantener para reintentar
      return PushResult(successCount: 0, errors: pending.length, results: []);
    }
  }

  /// Descarga cambios del servidor
  Future<PullResult> pullChanges() async {
    final userId = await SecureStorage.getUserId();
    final deviceId = await SecureStorage.getDeviceId();
    final lastSync = await _localDb.getLastSyncTime();

    // Validar userId
    if (userId == null) {
         return PullResult(totalItems: 0, syncedAt: null, error: 'User not logged in');
    }

    try {
      final response = await _api.post('/sync/pull', data: {
        'deviceId': deviceId,
        'userId': userId,
        'lastSyncAt': lastSync?.toIso8601String() ?? '1970-01-01T00:00:00Z',
        'entities': ['inventario', 'activos', 'operaciones', 'transferencias', 'catalogos'],
      });

      final data = response.data as Map<String, dynamic>;
      int totalItems = 0;

      // Procesar cada entidad
      if (data['data'] != null) {
        final syncData = data['data'] as Map<String, dynamic>;
        
        if (syncData['inventario'] != null) {
          await _processInventarioPull(syncData['inventario'] as List);
          totalItems += (syncData['inventario'] as List).length;
        }
        
        if (syncData['activos'] != null) {
          await _processActivosPull(syncData['activos'] as List);
          totalItems += (syncData['activos'] as List).length;
        }
        
        if (syncData['operaciones'] != null) {
          await _processOperacionesPull(syncData['operaciones'] as List);
          totalItems += (syncData['operaciones'] as List).length;
        }
        
        if (syncData['transferencias'] != null) {
          await _processTransferenciasPull(syncData['transferencias'] as List);
          totalItems += (syncData['transferencias'] as List).length;
        }
      }

      // Guardar timestamp de última sync
      if (data['syncedAt'] != null) {
          await _localDb.setLastSyncTime(DateTime.parse(data['syncedAt']));
      }

      return PullResult(totalItems: totalItems, syncedAt: data['syncedAt']);
    } catch (e) {
      return PullResult(totalItems: 0, syncedAt: null, error: e.toString());
    }
  }

  Future<void> _processInventarioPull(List items) async {
    final db = await _localDb.database;
    final batch = db.batch();
    for (final item in items) {
      batch.insert(
        'inventario_cache',
        {
          'id': item['id'],
          'codigo': item['codigo'],
          'descripcion': item['descripcion'],
          'stock': item['stock'],
          'updated_at': item['updated_at'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<void> _processActivosPull(List items) async {
    final db = await _localDb.database;
    final batch = db.batch();
    for (final item in items) {
      batch.insert(
        'activos_cache',
        {
          'id': item['id'],
          'codigo': item['codigo'],
          'nombre': item['nombre'],
          'ubicacion': item['ubicacion'],
          'estado': item['estado'],
          'updated_at': item['updated_at'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<void> _processOperacionesPull(List items) async {
    final db = await _localDb.database;
    final batch = db.batch();
    for (final item in items) {
      batch.insert(
        'operaciones_cache',
        {
          'id': item['id'],
          'codigo_ot': item['codigoOt'],
          'tecnico': item['tecnico'],
          'materiales_usados': item['materialesUsados'],
          'estado': item['estado'],
          'updated_at': item['updated_at'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<void> _processTransferenciasPull(List items) async {
    final db = await _localDb.database;
    
    for (final item in items) {
      await db.insert(
        'transferencias_cache',
        {
          'id': item['id'],
          'origen': item['origen'],
          'destino': item['destino'],
          'estado': item['estado'],
          'total_items': item['totalItems'],
          'updated_at': item['updated_at'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
      
      // Procesar líneas
      if (item['lineas'] != null) {
          final batchLines = db.batch();
        for (final linea in item['lineas']) {
          batchLines.insert(
            'transferencia_lineas_cache',
            {
              'id': linea['id'],
              'transferencia_id': item['id'],
              'codigo': linea['codigo'],
              'descripcion': linea['descripcion'],
              'cantidad': linea['cantidad'],
              'recibido': linea['recibido'],
            },
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
        await batchLines.commit(noResult: true);
      }
    }
  }
}

class SyncResult {
  final int pushed;
  final int pulled;
  final int errors;
  SyncResult({required this.pushed, required this.pulled, required this.errors});
}

class PushResult {
  final int successCount;
  final int errors;
  final List<Map<String, dynamic>> results;
  PushResult({required this.successCount, required this.errors, required this.results});
}

class PullResult {
  final int totalItems;
  final String? syncedAt;
  final String? error;
  PullResult({required this.totalItems, this.syncedAt, this.error});
}

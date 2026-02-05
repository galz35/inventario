import 'dart:convert';

import '../../../core/storage/local_db.dart';
import '../domain/transferencia_item.dart';
import 'transferencias_repository.dart';

class TransferenciasRepositoryImpl implements TransferenciasRepository {
  TransferenciasRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<int> crear({
    required String origen,
    required String destino,
    required int totalItems,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('transferencias_cache', <String, Object?>{
      'origen': origen,
      'destino': destino,
      'estado': 'Pendiente',
      'total_items': totalItems,
      'updated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'transferencia',
      action: 'create',
      payload: <String, Object?>{
        'local_id': id,
        'origen': origen,
        'destino': destino,
        'estado': 'Pendiente',
        'total_items': totalItems,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'transferencias.create.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'origen': origen, 'destino': destino}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<List<TransferenciaItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('transferencias_cache', orderBy: 'id DESC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 1001,
          'origen': 'Almacén Central',
          'destino': 'Cuadrilla Norte',
          'estado': 'En tránsito',
          'total_items': 14,
          'updated_at': now,
        },
        <String, Object?>{
          'id': 1002,
          'origen': 'Bodega Sur',
          'destino': 'Proyecto Alpha',
          'estado': 'Pendiente',
          'total_items': 8,
          'updated_at': now,
        },
      ];
      for (final row in defaults) {
        await db.insert('transferencias_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('transferencias_cache', orderBy: 'id DESC');
    return result
        .map((row) => TransferenciaItem(
              id: row['id'] as int,
              origen: row['origen'] as String,
              destino: row['destino'] as String,
              estado: row['estado'] as String,
              totalItems: row['total_items'] as int,
            ))
        .toList(growable: false);
  }

  @override
  Future<void> actualizarEstado({required int id, required String estado}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'transferencias_cache',
      <String, Object?>{'estado': estado, 'updated_at': now},
      where: 'id = ?',
      whereArgs: <Object?>[id],
    );

    await _localDb.enqueueSync(
      entity: 'transferencia',
      action: 'update_status',
      payload: <String, Object?>{'local_id': id, 'estado': estado},
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'transferencias.status.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'estado': estado}),
      'status': 'ok',
      'created_at': now,
    });
  }

}

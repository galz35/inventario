import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../../core/storage/local_db.dart';
import '../domain/operacion_item.dart';
import 'operaciones_repository.dart';

class OperacionesRepositoryImpl implements OperacionesRepository {
  OperacionesRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<int> crear({
    required String codigoOt,
    required String tecnico,
    required int materialesUsados,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('operaciones_cache', <String, Object?>{
      'codigo_ot': codigoOt,
      'tecnico': tecnico,
      'estado': 'Pendiente',
      'materiales_usados': materialesUsados,
      'updated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'operacion',
      action: 'create',
      payload: <String, Object?>{
        'local_id': id,
        'codigo_ot': codigoOt,
        'tecnico': tecnico,
        'estado': 'Pendiente',
        'materiales_usados': materialesUsados,
      },
    );

    await _localDb.enqueueSync(
      entity: 'notification',
      action: 'technician_assignment',
      payload: <String, Object?>{
        'channel': 'fcm',
        'topic': 'tecnicos_asignaciones',
        'target_tecnico': tecnico,
        'title': 'Nueva OT asignada',
        'body': '$codigoOt asignada a $tecnico',
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'operaciones.create.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'codigo_ot': codigoOt}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<List<OperacionItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('operaciones_cache', orderBy: 'id DESC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 501,
          'codigo_ot': 'OT-501',
          'tecnico': 'Luis Rojas',
          'estado': 'En ejecución',
          'materiales_usados': 6,
          'updated_at': now,
        },
        <String, Object?>{
          'id': 502,
          'codigo_ot': 'OT-502',
          'tecnico': 'María Pérez',
          'estado': 'Pendiente',
          'materiales_usados': 2,
          'updated_at': now,
        },
      ];

      for (final row in defaults) {
        await db.insert('operaciones_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('operaciones_cache', orderBy: 'id DESC');
    return result
        .map(
          (row) => OperacionItem(
            id: row['id'] as int,
            codigoOt: row['codigo_ot'] as String,
            tecnico: row['tecnico'] as String,
            estado: row['estado'] as String,
            materialesUsados: row['materiales_usados'] as int,
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> actualizarEstado({required int id, required String estado}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'operaciones_cache',
      <String, Object?>{'estado': estado, 'updated_at': now},
      where: 'id = ?',
      whereArgs: <Object?>[id],
    );

    await _localDb.enqueueSync(
      entity: 'operacion',
      action: 'update_status',
      payload: <String, Object?>{'local_id': id, 'estado': estado},
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'operaciones.status.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'estado': estado}),
      'status': 'ok',
      'created_at': now,
    });
  }
}

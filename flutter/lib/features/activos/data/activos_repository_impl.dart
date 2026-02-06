import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../../core/storage/local_db.dart';
import '../domain/activo_item.dart';
import 'activos_repository.dart';

class ActivosRepositoryImpl implements ActivosRepository {
  ActivosRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<int> crear({required String codigo, required String nombre, required String ubicacion}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('activos_cache', <String, Object?>{
      'codigo': codigo,
      'nombre': nombre,
      'estado': 'Disponible',
      'ubicacion': ubicacion,
      'updated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'activo',
      action: 'create',
      payload: <String, Object?>{
        'local_id': id,
        'codigo': codigo,
        'nombre': nombre,
        'estado': 'Disponible',
        'ubicacion': ubicacion,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'activos.create.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'codigo': codigo}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<List<ActivoItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('activos_cache', orderBy: 'id DESC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 901,
          'codigo': 'ACT-901',
          'nombre': 'Generador portátil',
          'estado': 'Disponible',
          'ubicacion': 'Bodega Norte',
          'updated_at': now,
        },
        <String, Object?>{
          'id': 902,
          'codigo': 'ACT-902',
          'nombre': 'Taladro industrial',
          'estado': 'Asignado',
          'ubicacion': 'Proyecto Alpha',
          'updated_at': now,
        },
      ];

      for (final row in defaults) {
        await db.insert('activos_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('activos_cache', orderBy: 'id DESC');
    return result
        .map(
          (row) => ActivoItem(
            id: row['id'] as int,
            codigo: row['codigo'] as String,
            nombre: row['nombre'] as String,
            estado: row['estado'] as String,
            ubicacion: row['ubicacion'] as String,
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> actualizarEstado({required int id, required String estado}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'activos_cache',
      <String, Object?>{'estado': estado, 'updated_at': now},
      where: 'id = ?',
      whereArgs: <Object?>[id],
    );

    await _localDb.enqueueSync(
      entity: 'activo',
      action: 'update_status',
      payload: <String, Object?>{'local_id': id, 'estado': estado},
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'activos.status.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'estado': estado}),
      'status': 'ok',
      'created_at': now,
    });
  }
}

import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../../core/storage/local_db.dart';
import '../domain/usuario_item.dart';
import 'usuarios_repository.dart';

class UsuariosRepositoryImpl implements UsuariosRepository {
  UsuariosRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<int> crear({required String nombre, required String email, required String rol}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('usuarios_cache', <String, Object?>{
      'nombre': nombre,
      'email': email,
      'rol': rol,
      'estado': 'Activo',
      'updated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'usuario',
      action: 'create',
      payload: <String, Object?>{
        'local_id': id,
        'nombre': nombre,
        'email': email,
        'rol': rol,
        'estado': 'Activo',
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'usuarios.create.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'email': email, 'rol': rol}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<List<UsuarioItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('usuarios_cache', orderBy: 'id DESC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 301,
          'nombre': 'Carla Torres',
          'email': 'carla.torres@inventario.app',
          'rol': 'Admin',
          'estado': 'Activo',
          'updated_at': now,
        },
        <String, Object?>{
          'id': 302,
          'nombre': 'Jorge Ramírez',
          'email': 'jorge.ramirez@inventario.app',
          'rol': 'Supervisor',
          'estado': 'Suspendido',
          'updated_at': now,
        },
      ];

      for (final row in defaults) {
        await db.insert('usuarios_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('usuarios_cache', orderBy: 'id DESC');
    return result
        .map(
          (row) => UsuarioItem(
            id: row['id'] as int,
            nombre: row['nombre'] as String,
            email: row['email'] as String,
            rol: row['rol'] as String,
            estado: row['estado'] as String,
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> actualizarEstado({required int id, required String estado}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'usuarios_cache',
      <String, Object?>{'estado': estado, 'updated_at': now},
      where: 'id = ?',
      whereArgs: <Object?>[id],
    );

    await _localDb.enqueueSync(
      entity: 'usuario',
      action: 'update_status',
      payload: <String, Object?>{'local_id': id, 'estado': estado},
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'usuarios.status.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'estado': estado}),
      'status': 'ok',
      'created_at': now,
    });
  }
}

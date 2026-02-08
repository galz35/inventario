import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../../core/storage/local_db.dart';
import '../domain/usuario_item.dart';
import 'usuarios_repository.dart';

class UsuariosRepositoryImpl implements UsuariosRepository {
  UsuariosRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<List<UsuarioItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('usuarios_cache', orderBy: 'id ASC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 101,
          'nombre': 'Administrador',
          'email': 'admin@inventario.local',
          'rol': 'Admin',
          'estado': 'Activo',
          'updated_at': now,
        },
        <String, Object?>{
          'id': 102,
          'nombre': 'Juan Técnico',
          'email': 'juan@inventario.local',
          'rol': 'Tecnico',
          'estado': 'Activo',
          'updated_at': now,
        },
        <String, Object?>{
          'id': 103,
          'nombre': 'Pedro Bodeguero',
          'email': 'pedro@inventario.local',
          'rol': 'Inventario',
          'estado': 'Inactivo',
          'updated_at': now,
        },
      ];

      for (final row in defaults) {
        await db.insert('usuarios_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('usuarios_cache', orderBy: 'id ASC');
    return result
        .map(
          (row) => UsuarioItem(
            id: row['id'] as int,
            username: (row['email'] as String).split('@').first,
            nombre: row['nombre'] as String,
            rol: row['rol'] as String,
            estado: row['estado'] as String,
            lastLogin: null, // No guardado en cache simple
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<int> crear({
    required String username,
    required String nombre,
    required String rol,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('usuarios_cache', <String, Object?>{
      'nombre': nombre,
      'email': '$username@inventario.local',
      'rol': rol,
      'estado': 'Activo',
      'updated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'usuario',
      action: 'create',
      payload: <String, Object?>{
        'local_id': id,
        'username': username,
        'nombre': nombre,
        'rol': rol,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'usuarios.create.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'username': username}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
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
      payload: <String, Object?>{
        'id': id,
        'estado': estado,
      },
    );
  }
}

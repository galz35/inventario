import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class LocalDb {
  Database? _db;

  Future<Database> get database => instance();

  Future<Database> instance() async {
    if (_db != null) return _db!;

    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'inventario.db');

    _db = await openDatabase(
      path,
      version: 10,
      onCreate: (db, version) async {
        await _createSchema(db);
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          await _createInventarioCache(db);
          await _createSyncLog(db);
        }
        if (oldVersion < 3) {
          await _createTransferenciasCache(db);
        }
        if (oldVersion < 4) {
          await _createOperacionesCache(db);
        }
        if (oldVersion < 5) {
          await _createReportesCache(db);
        }
        if (oldVersion < 6) {
          await _createUsuariosCache(db);
        }
        if (oldVersion < 7) {
          await _createActivosCache(db);
        }
        if (oldVersion < 8) {
          await _createSessionCache(db);
        }
        if (oldVersion < 9) {
          await _createTransferenciaLineasCache(db);
        }
        if (oldVersion < 10) {
          await _createAppMetadata(db);
        }
      },
    );

    return _db!;
  }

  Future<int> enqueueSync({
    required String entity,
    required String action,
    required Map<String, Object?> payload,
  }) async {
    final db = await instance();
    return db.insert('sync_queue', <String, Object?>{
      'entity': entity,
      'action': action,
      'payload': jsonEncode(payload),
      'status': 'pending',
      'retries': 0,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<int> queueCountByStatus(String status) async {
    final db = await instance();
    final row = await db.rawQuery(
      'SELECT COUNT(*) as total FROM sync_queue WHERE status = ?',
      <Object?>[status],
    );
    return (row.first['total'] as int?) ?? 0;
  }



  Future<int> queueCountByEntity(String entity) async {
    final db = await instance();
    final row = await db.rawQuery(
      'SELECT COUNT(*) as total FROM sync_queue WHERE entity = ? AND status = ?',
      <Object?>[entity, 'pending'],
    );
    return (row.first['total'] as int?) ?? 0;
  }

  Future<int> queueCountByEntityAction({
    required String entity,
    required String action,
  }) async {
    final db = await instance();
    final row = await db.rawQuery(
      'SELECT COUNT(*) as total FROM sync_queue WHERE entity = ? AND action = ? AND status = ?',
      <Object?>[entity, action, 'pending'],
    );
    return (row.first['total'] as int?) ?? 0;
  }

  Future<String?> lastSyncSummary() async {
    final db = await instance();
    final rows = await db.query(
      'sync_log',
      where: 'scope = ?',
      whereArgs: <Object?>['sync_queue.push'],
      orderBy: 'id DESC',
      limit: 1,
    );
    if (rows.isEmpty) return null;

    final createdAt = rows.first['created_at'] as String;
    final status = rows.first['status'] as String;
    return '$status · $createdAt';
  }

  Future<DateTime?> getLastSyncTime() async {
    final db = await instance();
    final result = await db.query(
      'app_metadata',
      columns: ['value'],
      where: 'key = ?',
      whereArgs: ['last_sync_time'],
    );
    if (result.isNotEmpty && result.first['value'] != null) {
      return DateTime.tryParse(result.first['value'] as String);
    }
    return null;
  }

  Future<void> setLastSyncTime(DateTime time) async {
    final db = await instance();
    await db.insert(
      'app_metadata',
      {'key': 'last_sync_time', 'value': time.toIso8601String()},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> resetErrorQueue({int limit = 100}) async {
    final db = await instance();
    final errors = await db.query(
      'sync_queue',
      columns: <String>['id'],
      where: 'status = ?',
      whereArgs: <Object?>['error'],
      orderBy: 'id ASC',
      limit: limit,
    );

    var updated = 0;
    for (final row in errors) {
      updated += await db.update(
        'sync_queue',
        <String, Object?>{'status': 'pending'},
        where: 'id = ?',
        whereArgs: <Object?>[row['id']],
      );
    }
    return updated;
  }

  Future<int> clearDoneQueue({int keepLatest = 200}) async {
    final db = await instance();
    final keepRows = await db.query(
      'sync_queue',
      columns: <String>['id'],
      where: 'status = ?',
      whereArgs: <Object?>['done'],
      orderBy: 'id DESC',
      limit: keepLatest,
    );

    final keepIds = keepRows.map((row) => row['id']).toSet();
    final doneRows = await db.query(
      'sync_queue',
      columns: <String>['id'],
      where: 'status = ?',
      whereArgs: <Object?>['done'],
    );

    var removed = 0;
    for (final row in doneRows) {
      if (keepIds.contains(row['id'])) continue;
      removed += await db.delete(
        'sync_queue',
        where: 'id = ?',
        whereArgs: <Object?>[row['id']],
      );
    }
    return removed;
  }

  Future<void> saveSession({
    required int userId,
    required String nombre,
    required String rol,
    required List<String> permisos,
  }) async {
    final db = await instance();
    await db.delete('session_cache');
    await db.insert('session_cache', <String, Object?>{
      'user_id': userId,
      'nombre': nombre,
      'rol': rol,
      'permisos_json': jsonEncode(permisos),
      'updated_at': DateTime.now().toIso8601String(),
    });
  }

  Future<Map<String, Object?>?> getSession() async {
    final db = await instance();
    final rows = await db.query('session_cache', orderBy: 'id DESC', limit: 1);
    if (rows.isEmpty) return null;
    return rows.first;
  }

  Future<void> clearSession() async {
    final db = await instance();
    await db.delete('session_cache');
  }

  Future<void> _createSchema(Database db) async {
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        retries INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    ''');

    await _createSyncLog(db);
    await _createInventarioCache(db);
    await _createTransferenciasCache(db);
    await _createTransferenciaLineasCache(db);
    await _createOperacionesCache(db);
    await _createReportesCache(db);
    await _createUsuariosCache(db);
    await _createActivosCache(db);
    await _createSessionCache(db);
    await _createAppMetadata(db);
  }

  Future<void> _createSyncLog(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL,
        detail TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createInventarioCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS inventario_cache (
        id INTEGER PRIMARY KEY,
        codigo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        stock REAL NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createTransferenciasCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS transferencias_cache (
        id INTEGER PRIMARY KEY,
        origen TEXT NOT NULL,
        destino TEXT NOT NULL,
        estado TEXT NOT NULL,
        total_items INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createTransferenciaLineasCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS transferencia_lineas_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transferencia_id INTEGER NOT NULL,
        codigo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        recibido INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createOperacionesCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS operaciones_cache (
        id INTEGER PRIMARY KEY,
        codigo_ot TEXT NOT NULL,
        tecnico TEXT NOT NULL,
        estado TEXT NOT NULL,
        materiales_usados INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createReportesCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS reportes_cache (
        id INTEGER PRIMARY KEY,
        tipo TEXT NOT NULL,
        periodo TEXT NOT NULL,
        estado TEXT NOT NULL,
        generated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createUsuariosCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS usuarios_cache (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL,
        rol TEXT NOT NULL,
        estado TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createActivosCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS activos_cache (
        id INTEGER PRIMARY KEY,
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        estado TEXT NOT NULL,
        ubicacion TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createSessionCache(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS session_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL,
        permisos_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createAppMetadata(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    ''');
  }
}

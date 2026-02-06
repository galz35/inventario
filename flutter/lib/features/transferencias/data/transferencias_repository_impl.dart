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

    await db.insert('transferencias_items_cache', <String, Object?>{
      'transferencia_id': id,
      'codigo': 'ITEM-001',
      'descripcion': 'Item inicial',
      'cantidad': totalItems,
      'recibido': 0,
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

    await _localDb.enqueueSync(
      entity: 'transferencia_item',
      action: 'create',
      payload: <String, Object?>{
        'transferencia_id': id,
        'codigo': 'ITEM-001',
        'descripcion': 'Item inicial',
        'cantidad': totalItems,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'transferencias.create.local',
      'detail': jsonEncode(<String, Object?>{
        'id': id,
        'origen': origen,
        'destino': destino,
        'items': totalItems,
      }),
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

  @override
  Future<List<TransferenciaLineaItem>> listarLineas({
    required int transferenciaId,
  }) async {
    final db = await _localDb.instance();
    final rows = await db.query(
      'transferencias_items_cache',
      where: 'transferencia_id = ?',
      whereArgs: <Object?>[transferenciaId],
      orderBy: 'id ASC',
    );

    if (rows.isEmpty) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'transferencia_id': transferenciaId,
          'codigo': 'MAT-100',
          'descripcion': 'Cable de poder',
          'cantidad': 6,
          'recibido': 0,
          'updated_at': now,
        },
        <String, Object?>{
          'transferencia_id': transferenciaId,
          'codigo': 'MAT-200',
          'descripcion': 'Conectores',
          'cantidad': 3,
          'recibido': 1,
          'updated_at': now,
        },
      ];
      for (final row in defaults) {
        await db.insert('transferencias_items_cache', row);
      }
    }

    final result = await db.query(
      'transferencias_items_cache',
      where: 'transferencia_id = ?',
      whereArgs: <Object?>[transferenciaId],
      orderBy: 'id ASC',
    );

    return result
        .map(
          (row) => TransferenciaLineaItem(
            id: row['id'] as int,
            transferenciaId: row['transferencia_id'] as int,
            codigo: row['codigo'] as String,
            descripcion: row['descripcion'] as String,
            cantidad: row['cantidad'] as int,
            recibido: row['recibido'] as int,
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<int> agregarLinea({
    required int transferenciaId,
    required String codigo,
    required String descripcion,
    required int cantidad,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('transferencias_items_cache', <String, Object?>{
      'transferencia_id': transferenciaId,
      'codigo': codigo,
      'descripcion': descripcion,
      'cantidad': cantidad,
      'recibido': 0,
      'updated_at': now,
    });

    await db.rawUpdate(
      'UPDATE transferencias_cache SET total_items = total_items + ?, updated_at = ? WHERE id = ?',
      <Object?>[cantidad, now, transferenciaId],
    );

    await _localDb.enqueueSync(
      entity: 'transferencia_item',
      action: 'create',
      payload: <String, Object?>{
        'transferencia_id': transferenciaId,
        'codigo': codigo,
        'descripcion': descripcion,
        'cantidad': cantidad,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'transferencias.items.create.local',
      'detail': jsonEncode(<String, Object?>{
        'transferencia_id': transferenciaId,
        'codigo': codigo,
        'cantidad': cantidad,
      }),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<void> actualizarRecepcion({
    required int lineaId,
    required int recibido,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    await db.update(
      'transferencias_items_cache',
      <String, Object?>{'recibido': recibido, 'updated_at': now},
      where: 'id = ?',
      whereArgs: <Object?>[lineaId],
    );

    await _localDb.enqueueSync(
      entity: 'transferencia_item',
      action: 'update_received',
      payload: <String, Object?>{'linea_id': lineaId, 'recibido': recibido},
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'transferencias.items.received.local',
      'detail': jsonEncode(<String, Object?>{'linea_id': lineaId, 'recibido': recibido}),
      'status': 'ok',
      'created_at': now,
    });
  }

}

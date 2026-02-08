import 'dart:convert';

import '../../../core/storage/local_db.dart';
import '../domain/inventario_item.dart';
import 'inventario_repository.dart';

class InventarioRepositoryImpl implements InventarioRepository {
  InventarioRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<void> actualizarStockLocal(List<InventarioItem> items) async {
    final db = await _localDb.instance();
    final batch = db.batch();
    batch.delete('inventario_cache');
    for (final item in items) {
      batch.insert('inventario_cache', <String, Object?>{
        'id': item.id,
        'codigo': item.codigo,
        'descripcion': item.descripcion,
        'stock': item.stock,
        'updated_at': DateTime.now().toIso8601String(),
      });
    }
    await batch.commit(noResult: true);
  }

  @override
  Future<void> ajustarStock({
    required int id,
    required double delta,
    required String motivo,
  }) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final rows = await db.query(
      'inventario_cache',
      where: 'id = ?',
      whereArgs: <Object?>[id],
      limit: 1,
    );
    if (rows.isEmpty) return;

    final current = (rows.first['stock'] as num).toDouble();
    final next = current + delta;

    await db.update(
      'inventario_cache',
      <String, Object?>{
        'stock': next < 0 ? 0 : next,
        'updated_at': now,
      },
      where: 'id = ?',
      whereArgs: <Object?>[id],
    );

    await _localDb.enqueueSync(
      entity: 'inventario',
      action: 'adjust_stock',
      payload: <String, Object?>{
        'id': id,
        'delta': delta,
        'motivo': motivo,
        'updated_at': now,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'inventario.adjust.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'delta': delta, 'motivo': motivo}),
      'status': 'ok',
      'created_at': now,
    });
  }

  @override
  Future<List<InventarioItem>> listarStock({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final cached = await db.query('inventario_cache', orderBy: 'descripcion ASC');
    if (cached.isNotEmpty && !forceRemote) {
      return cached
          .map((row) => InventarioItem(
                id: row['id'] as int,
                codigo: row['codigo'] as String,
                descripcion: row['descripcion'] as String,
                stock: (row['stock'] as num).toDouble(),
              ))
          .toList(growable: false);
    }

    const remote = <InventarioItem>[
      InventarioItem(id: 1, codigo: 'MAT-001', descripcion: 'Cable UTP Cat6', stock: 120),
      InventarioItem(id: 2, codigo: 'MAT-002', descripcion: 'Conector RJ45', stock: 540),
      InventarioItem(id: 3, codigo: 'MAT-003', descripcion: 'Switch 24p', stock: 14),
      InventarioItem(id: 4, codigo: 'MAT-004', descripcion: 'Patch panel', stock: 27),
    ];

    await actualizarStockLocal(remote);

    await db.insert('sync_log', <String, Object?>{
      'scope': 'inventario.pull',
      'detail': jsonEncode(<String, Object?>{'items': remote.length}),
      'status': 'ok',
      'created_at': DateTime.now().toIso8601String(),
    });

    return remote;
  }
}

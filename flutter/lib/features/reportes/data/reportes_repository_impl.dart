import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../../../core/storage/local_db.dart';
import '../domain/reporte_item.dart';
import 'reportes_repository.dart';

class ReportesRepositoryImpl implements ReportesRepository {
  ReportesRepositoryImpl(this._localDb);

  final LocalDb _localDb;

  @override
  Future<int> generar({required String tipo, required String periodo}) async {
    final db = await _localDb.instance();
    final now = DateTime.now().toIso8601String();

    final id = await db.insert('reportes_cache', <String, Object?>{
      'tipo': tipo,
      'periodo': periodo,
      'estado': 'Generado',
      'generated_at': now,
    });

    await _localDb.enqueueSync(
      entity: 'reporte',
      action: 'generate',
      payload: <String, Object?>{
        'local_id': id,
        'tipo': tipo,
        'periodo': periodo,
        'generated_at': now,
      },
    );

    await db.insert('sync_log', <String, Object?>{
      'scope': 'reportes.generate.local',
      'detail': jsonEncode(<String, Object?>{'id': id, 'tipo': tipo, 'periodo': periodo}),
      'status': 'ok',
      'created_at': now,
    });

    return id;
  }

  @override
  Future<List<ReporteItem>> listar({bool forceRemote = false}) async {
    final db = await _localDb.instance();
    final rows = await db.query('reportes_cache', orderBy: 'generated_at DESC');

    if (rows.isEmpty || forceRemote) {
      final now = DateTime.now().toIso8601String();
      final defaults = <Map<String, Object?>>[
        <String, Object?>{
          'id': 801,
          'tipo': 'Inventario crítico',
          'periodo': 'Últimos 7 días',
          'estado': 'Generado',
          'generated_at': now,
        },
        <String, Object?>{
          'id': 802,
          'tipo': 'Transferencias pendientes',
          'periodo': 'Mes actual',
          'estado': 'Generado',
          'generated_at': now,
        },
      ];

      for (final row in defaults) {
        await db.insert('reportes_cache', row, conflictAlgorithm: ConflictAlgorithm.replace);
      }
    }

    final result = await db.query('reportes_cache', orderBy: 'generated_at DESC');
    return result
        .map(
          (row) => ReporteItem(
            id: row['id'] as int,
            tipo: row['tipo'] as String,
            periodo: row['periodo'] as String,
            estado: row['estado'] as String,
            generatedAt: DateTime.parse(row['generated_at'] as String),
          ),
        )
        .toList(growable: false);
  }
}

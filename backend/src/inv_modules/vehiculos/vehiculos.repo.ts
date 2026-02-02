import {
    ejecutarSP,
    ejecutarQuery,
    Int,
    NVarChar,
    Decimal,
} from '../../db/base.repo';

export async function listarVehiculos() {
    return await ejecutarSP('Inv_sp_vehiculos_listar');
}

export async function upsertVehiculo(dto: {
    id?: number;
    placa: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    idTecnicoAsignado?: number;
}) {
    if (dto.id) {
        return await ejecutarQuery(`
      UPDATE Inv_cat_vehiculos 
      SET placa = @placa, marca = @marca, modelo = @modelo, anio = @anio, idTecnicoAsignado = @idTec 
      WHERE idVehiculo = @id`,
            {
                id: { valor: dto.id, tipo: Int },
                placa: { valor: dto.placa, tipo: NVarChar },
                marca: { valor: dto.marca || null, tipo: NVarChar },
                modelo: { valor: dto.modelo || null, tipo: NVarChar },
                anio: { valor: dto.anio || null, tipo: Int },
                idTec: { valor: dto.idTecnicoAsignado || null, tipo: Int }
            });
    } else {
        return await ejecutarQuery(`
      INSERT INTO Inv_cat_vehiculos (placa, marca, modelo, anio, idTecnicoAsignado)
      VALUES (@placa, @marca, @modelo, @anio, @idTec)`,
            {
                placa: { valor: dto.placa, tipo: NVarChar },
                marca: { valor: dto.marca || null, tipo: NVarChar },
                modelo: { valor: dto.modelo || null, tipo: NVarChar },
                anio: { valor: dto.anio || null, tipo: Int },
                idTec: { valor: dto.idTecnicoAsignado || null, tipo: Int }
            });
    }
}

export async function registrarLogVehiculo(dto: {
    idVehiculo: number;
    idUsuario: number;
    kmEntrada: number;
    kmSalida: number;
    gastoCombustible: number;
    numeroVoucher?: string;
    urlVoucher?: string;
}) {
    return await ejecutarSP('Inv_sp_vehiculos_registrar_log', {
        idVehiculo: { valor: dto.idVehiculo, tipo: Int },
        idUsuario: { valor: dto.idUsuario, tipo: Int },
        kmEntrada: { valor: dto.kmEntrada, tipo: Int },
        kmSalida: { valor: dto.kmSalida, tipo: Int },
        gasto: { valor: dto.gastoCombustible, tipo: Decimal(18, 2) },
        voucher: { valor: dto.numeroVoucher || null, tipo: NVarChar },
        urlVoucher: { valor: dto.urlVoucher || null, tipo: NVarChar }
    });
}

export async function obtenerUltimosLogs(idVehiculo?: number) {
    const query = `
    SELECT TOP 50 l.*, v.placa, u.nombre as tecnicoNombre
    FROM Inv_ope_vehiculos_log l
    JOIN Inv_cat_vehiculos v ON l.idVehiculo = v.idVehiculo
    JOIN Inv_seg_usuarios u ON l.idUsuario = u.idUsuario
    ${idVehiculo ? 'WHERE l.idVehiculo = @id' : ''}
    ORDER BY l.fechaLog DESC, l.idLog DESC
  `;
    return await ejecutarQuery(query, idVehiculo ? { id: { valor: idVehiculo, tipo: Int } } : undefined);
}

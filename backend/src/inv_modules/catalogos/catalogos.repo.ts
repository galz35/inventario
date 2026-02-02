import {
  ejecutarSP,
  ejecutarQuery,
  Int,
  NVarChar,
  Bit,
  Decimal,
} from '../../db/base.repo';

export async function listarCategorias() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'CATEGORIAS' });
}

export async function listarProveedores() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'PROVEEDORES' });
}

export async function listarProductos() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'PRODUCTOS' });
}

export async function listarAlmacenes() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'ALMACENES' });
}

export async function listarClientes() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'CLIENTES' });
}

export async function listarTiposOT() {
  return await ejecutarSP('Inv_sp_cat_listar', { entidad: 'TIPO_OT' });
}

export async function listarUsuarios() {
  return await ejecutarQuery(`
        SELECT u.idUsuario, u.nombre, u.correo, u.carnet, r.nombre as rolNombre
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        WHERE u.activo = 1
        ORDER BY u.nombre ASC
    `);
}

export async function upsertCategoria(dto: {
  id?: number;
  nombre: string;
  descripcion?: string;
}) {
  return await ejecutarSP('Inv_sp_cat_upsert', {
    entidad: { valor: 'CATEGORIAS', tipo: NVarChar },
    id: { valor: dto.id || null, tipo: Int },
    nombre: { valor: dto.nombre, tipo: NVarChar },
    descripcion: { valor: dto.descripcion || null, tipo: NVarChar },
  });
}

export async function upsertProveedor(dto: {
  id?: number;
  nombre: string;
  direccion?: string;
  contacto?: string;
}) {
  return await ejecutarSP('Inv_sp_cat_upsert', {
    entidad: { valor: 'PROVEEDORES', tipo: NVarChar },
    id: { valor: dto.id || null, tipo: Int },
    nombre: { valor: dto.nombre, tipo: NVarChar },
    descripcion: { valor: dto.direccion || null, tipo: NVarChar },
  });
}

export async function upsertProducto(dto: {
  id?: number;
  nombre: string;
  sku?: string;
  categoriaId: number;
}) {
  return await ejecutarSP('Inv_sp_cat_upsert', {
    entidad: { valor: 'PRODUCTOS', tipo: NVarChar },
    id: { valor: dto.id || null, tipo: Int },
    nombre: { valor: dto.nombre, tipo: NVarChar },
    idPadre: { valor: dto.categoriaId, tipo: Int },
  });
}

export async function upsertAlmacen(dto: {
  id?: number;
  nombre: string;
  ubicacion?: string;
  esCentral: boolean;
}) {
  return await ejecutarSP('Inv_sp_cat_upsert', {
    entidad: { valor: 'ALMACENES', tipo: NVarChar },
    id: { valor: dto.id || null, tipo: Int },
    nombre: { valor: dto.nombre, tipo: NVarChar },
    descripcion: { valor: dto.ubicacion || null, tipo: NVarChar },
  });
}

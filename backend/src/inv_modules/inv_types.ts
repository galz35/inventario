/**
 * Definiciones de tipos para el Sistema de Inventario (Prefijo Inv_)
 */

export interface InvUsuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  carnet: string;
  idRol: number;
  idAlmacenTecnico?: number;
  activo: boolean;
  rol?: InvRol;
}

export interface InvRol {
  idRol: number;
  nombre: string;
  descripcion?: string;
  reglas: string; // JSON string
  activo: boolean;
}

export interface InvProducto {
  idProducto: number;
  codigo: string;
  nombre: string;
  idCategoria: number;
  unidad: string;
  esSerializado: boolean;
  costo: number;
  minimoStock: number;
  activo: boolean;
}

export interface InvAlmacen {
  idAlmacen: number;
  nombre: string;
  idPadre?: number;
  tipo: 'CENTRAL' | 'REGIONAL' | 'PROYECTO' | 'TECNICO';
  responsableId?: number;
  ubicacion?: string;
  activo: boolean;
}

export interface InvStock {
  almacenId: number;
  productoId: number;
  propietarioTipo: 'EMPRESA' | 'PROVEEDOR';
  proveedorId?: number;
  cantidad: number;
  // Auxiliares para UI
  almacenNombre?: string;
  productoNombre?: string;
  productoCodigo?: string;
  proveedorNombre?: string;
  unidad?: string;
}

# Referencia de Esquema de Base de Datos

## Tabla: Inv_act_activos
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idActivo | int | NO | - |
| serial | nvarchar | NO | 50 |
| idProducto | int | NO | - |
| estado | nvarchar | YES | 20 |
| idAlmacenActual | int | YES | - |
| idTecnicoActual | int | YES | - |
| idClienteActual | int | YES | - |
| fechaIngreso | datetime | YES | - |
| notas | nvarchar | YES | -1 |

## Tabla: Inv_act_movimientos
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idMovimiento | int | NO | - |
| idActivo | int | NO | - |
| tipoMovimiento | nvarchar | YES | 50 |
| idUsuarioResponsable | int | NO | - |
| almacenAnteriorId | int | YES | - |
| almacenNuevoId | int | YES | - |
| tecnicoAnteriorId | int | YES | - |
| tecnicoNuevoId | int | YES | - |
| fechaMovimiento | datetime | YES | - |
| notas | nvarchar | YES | -1 |

## Tabla: Inv_act_reparaciones
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idReparacion | int | NO | - |
| idActivo | int | NO | - |
| fechaEnvio | datetime | YES | - |
| fechaRetorno | datetime | YES | - |
| diagnostico | nvarchar | YES | -1 |
| resultado | nvarchar | YES | 50 |
| costoReparacion | decimal | YES | - |
| enviadoPor | int | YES | - |

## Tabla: Inv_cat_almacenes
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idAlmacen | int | NO | - |
| nombre | nvarchar | NO | 100 |
| idPadre | int | YES | - |
| tipo | nvarchar | NO | 20 |
| responsableId | int | YES | - |
| ubicacion | nvarchar | YES | 200 |
| activo | bit | YES | - |
| fechaCreacion | datetime | YES | - |

## Tabla: Inv_cat_categorias_producto
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idCategoria | int | NO | - |
| nombre | nvarchar | NO | 100 |
| descripcion | nvarchar | YES | 250 |
| activo | bit | YES | - |

## Tabla: Inv_cat_clientes
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idCliente | int | NO | - |
| nombre | nvarchar | YES | 150 |
| identificacion | nvarchar | YES | 50 |
| direccion | nvarchar | YES | 250 |
| telefono | nvarchar | YES | 20 |
| email | nvarchar | YES | 100 |
| activo | bit | YES | - |

## Tabla: Inv_cat_productos
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idProducto | int | NO | - |
| codigo | nvarchar | NO | 50 |
| nombre | nvarchar | NO | 200 |
| idCategoria | int | YES | - |
| unidad | nvarchar | YES | 20 |
| esSerializado | bit | YES | - |
| costo | decimal | YES | - |
| minimoStock | int | YES | - |
| activo | bit | YES | - |
| fechaCreacion | datetime | YES | - |

## Tabla: Inv_cat_proveedores
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idProveedor | int | NO | - |
| nombre | nvarchar | NO | 150 |
| nit | nvarchar | YES | 50 |
| contacto | nvarchar | YES | 100 |
| telefono | nvarchar | YES | 50 |
| correo | nvarchar | YES | 100 |
| activo | bit | YES | - |
| fechaCreacion | datetime | YES | - |

## Tabla: Inv_cat_tipos_ot
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idTipoOT | int | NO | - |
| nombre | nvarchar | NO | 50 |
| requiereFirma | bit | YES | - |
| requiereEvidencia | bit | YES | - |
| requiereEquipoSerializado | bit | YES | - |
| slaHoras | int | YES | - |
| activo | bit | YES | - |

## Tabla: Inv_inv_ajustes
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idAjuste | int | NO | - |
| almacenId | int | NO | - |
| productoId | int | NO | - |
| cantidadAnterior | decimal | YES | - |
| cantidadNueva | decimal | YES | - |
| motivo | nvarchar | YES | -1 |
| idUsuario | int | NO | - |
| fechaAjuste | datetime | YES | - |

## Tabla: Inv_inv_conteos_cabecera
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idConteo | int | NO | - |
| almacenId | int | NO | - |
| idUsuarioInicia | int | NO | - |
| fechaInicio | datetime | YES | - |
| fechaFin | datetime | YES | - |
| estado | nvarchar | YES | 20 |
| notas | nvarchar | YES | -1 |

## Tabla: Inv_inv_conteos_detalle
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idDetalle | int | NO | - |
| idConteo | int | NO | - |
| productoId | int | NO | - |
| stockSistema | decimal | YES | - |
| stockFisico | decimal | YES | - |
| diferencia | decimal | YES | - |

## Tabla: Inv_inv_liquidacion_consignacion
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idLiquidacion | int | NO | - |
| proveedorId | int | NO | - |
| idUsuarioResponsable | int | NO | - |
| fechaLiquidacion | datetime | YES | - |
| totalPagar | decimal | YES | - |
| estado | nvarchar | YES | 20 |
| notas | nvarchar | YES | -1 |

## Tabla: Inv_inv_liquidacion_consignacion_det
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idDetalle | int | NO | - |
| idLiquidacion | int | NO | - |
| productoId | int | NO | - |
| cantidadLiquidada | decimal | NO | - |
| precioUnitario | decimal | NO | - |
| subtotal | decimal | YES | - |

## Tabla: Inv_inv_movimiento_detalle
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idDetalle | int | NO | - |
| idMovimiento | int | NO | - |
| productoId | int | NO | - |
| propietarioTipo | nvarchar | YES | 20 |
| proveedorId | int | NO | - |
| cantidad | decimal | NO | - |
| costoUnitario | decimal | YES | - |
| stockAnterior | decimal | YES | - |
| stockNuevo | decimal | YES | - |

## Tabla: Inv_inv_movimientos
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idMovimiento | int | NO | - |
| tipoMovimiento | nvarchar | NO | 50 |
| almacenOrigenId | int | YES | - |
| almacenDestinoId | int | YES | - |
| idDocumentoReferencia | int | YES | - |
| tipoDocumentoReferencia | nvarchar | YES | 50 |
| referenciaTexto | nvarchar | YES | 100 |
| notas | nvarchar | YES | -1 |
| fechaMovimiento | datetime | YES | - |
| idUsuarioResponsable | int | NO | - |
| estado | nvarchar | YES | 20 |

## Tabla: Inv_inv_stock
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| almacenId | int | NO | - |
| productoId | int | NO | - |
| propietarioTipo | nvarchar | NO | 20 |
| proveedorId | int | NO | - |
| cantidad | decimal | NO | - |

## Tabla: Inv_inv_transferencia_detalle
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idDetalle | int | NO | - |
| idTransferencia | int | NO | - |
| productoId | int | NO | - |
| cantidadEnviada | decimal | NO | - |
| cantidadRecibida | decimal | YES | - |

## Tabla: Inv_inv_transferencias
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idTransferencia | int | NO | - |
| almacenOrigenId | int | NO | - |
| almacenDestinoId | int | NO | - |
| idUsuarioEnvia | int | NO | - |
| idUsuarioRecibe | int | YES | - |
| fechaEnvio | datetime | YES | - |
| fechaRecepcion | datetime | YES | - |
| estado | nvarchar | YES | 20 |
| notas | nvarchar | YES | -1 |

## Tabla: Inv_ope_ot
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idOT | int | NO | - |
| idProyecto | int | YES | - |
| idTecnicoAsignado | int | YES | - |
| clienteNombre | nvarchar | YES | 150 |
| clienteDireccion | nvarchar | YES | -1 |
| tipoOT | nvarchar | YES | 50 |
| prioridad | nvarchar | YES | 20 |
| estado | nvarchar | YES | 20 |
| fechaAsignacion | datetime | YES | - |
| fechaInicio | datetime | YES | - |
| fechaCierre | datetime | YES | - |
| notas | nvarchar | YES | -1 |
| fechaCreacion | datetime | YES | - |
| idTareaWBS | int | YES | - |
| idUsuarioCrea | int | YES | - |

## Tabla: Inv_ope_ot_consumo
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idConsumo | int | NO | - |
| idOT | int | NO | - |
| productoId | int | NO | - |
| cantidad | decimal | NO | - |
| idMovimientoInventario | int | YES | - |
| fechaConsumo | datetime | YES | - |

## Tabla: Inv_ope_ot_evidencias
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idEvidencia | int | NO | - |
| idOT | int | NO | - |
| tipoEvidencia | nvarchar | YES | 20 |
| urlArchivo | nvarchar | YES | -1 |
| fechaCarga | datetime | YES | - |

## Tabla: Inv_ope_ot_firmas
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idOT | int | NO | - |
| nombreFirmante | nvarchar | YES | 100 |
| dniFirmante | nvarchar | YES | 20 |
| urlFirma | nvarchar | YES | -1 |
| fechaFirma | datetime | YES | - |

## Tabla: Inv_ope_proyecto_material_estimado
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idTarea | int | NO | - |
| productoId | int | NO | - |
| cantidadEstimada | decimal | NO | - |
| idAlmacenSugerido | int | YES | - |

## Tabla: Inv_ope_proyecto_tareas
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idTarea | int | NO | - |
| idProyecto | int | NO | - |
| idTareaPadre | int | YES | - |
| nombre | nvarchar | NO | 200 |
| descripcion | nvarchar | YES | -1 |
| fechaInicioPrevista | datetime | YES | - |
| fechaFinPrevista | datetime | YES | - |
| orden | int | YES | - |
| estado | nvarchar | YES | 50 |

## Tabla: Inv_ope_proyectos
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idProyecto | int | NO | - |
| nombre | nvarchar | NO | 150 |
| descripcion | nvarchar | YES | -1 |
| estado | nvarchar | YES | 20 |
| fechaInicio | datetime | YES | - |
| fechaFin | datetime | YES | - |
| idResponsable | int | YES | - |
| idAlmacenProyecto | int | YES | - |
| fechaCreacion | datetime | YES | - |

## Tabla: Inv_p_SlowQueries
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idLog | int | NO | - |
| duracionMS | int | NO | - |
| sqlText | nvarchar | NO | -1 |
| tipo | nvarchar | YES | 20 |
| parametros | nvarchar | YES | -1 |
| fecha | datetime | YES | - |
| origen | nvarchar | YES | 200 |

## Tabla: Inv_seg_refresh_tokens
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idToken | int | NO | - |
| idUsuario | int | NO | - |
| token | nvarchar | NO | 500 |
| expira | datetime | NO | - |
| creado | datetime | YES | - |
| revocado | datetime | YES | - |

## Tabla: Inv_seg_roles
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idRol | int | NO | - |
| nombre | nvarchar | NO | 50 |
| descripcion | nvarchar | YES | 200 |
| reglas | nvarchar | YES | -1 |
| activo | bit | YES | - |
| fechaCreacion | datetime | YES | - |
| actualizadoPor | int | YES | - |
| esSistema | bit | YES | - |
| defaultMenu | nvarchar | YES | -1 |

## Tabla: Inv_seg_usuarios
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idUsuario | int | NO | - |
| nombre | nvarchar | NO | 100 |
| correo | nvarchar | NO | 100 |
| carnet | nvarchar | NO | 20 |
| password | nvarchar | NO | -1 |
| idRol | int | YES | - |
| idAlmacenTecnico | int | YES | - |
| activo | bit | YES | - |
| fechaCreacion | datetime | YES | - |
| ultimoAcceso | datetime | YES | - |
| refreshToken | nvarchar | YES | -1 |

## Tabla: Inv_sis_auditoria
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idAuditoria | int | NO | - |
| idUsuario | int | YES | - |
| accion | nvarchar | YES | 100 |
| entidad | nvarchar | YES | 100 |
| entidadId | nvarchar | YES | 50 |
| datosAnteriores | nvarchar | YES | -1 |
| datosNuevos | nvarchar | YES | -1 |
| fecha | datetime | YES | - |

## Tabla: Inv_sis_logs
| Columna | Tipo | Nulable | Tamaño |
| --- | --- | --- | --- |
| idLog | int | NO | - |
| idUsuario | int | YES | - |
| accion | nvarchar | YES | 100 |
| entidad | nvarchar | YES | 100 |
| datos | nvarchar | YES | -1 |
| fecha | datetime | YES | - |

## Stored Procedures
- Inv_sp_activo_asignar_tecnico
- Inv_sp_activo_dar_baja
- Inv_sp_activo_enviar_reparacion
- Inv_sp_activo_historial
- Inv_sp_activo_instalar
- Inv_sp_activos_listar
- Inv_sp_auth_login
- Inv_sp_auth_token_registrar
- Inv_sp_auth_token_validar
- Inv_sp_cat_almacen_upsert
- Inv_sp_cat_categoria_upsert
- Inv_sp_cat_listar
- Inv_sp_cat_producto_upsert
- Inv_sp_cat_proveedor_upsert
- Inv_sp_conteo_finalizar
- Inv_sp_conteo_iniciar
- Inv_sp_conteo_registrar_item
- Inv_sp_dashboard_resumen
- Inv_sp_inv_kardex_obtener
- Inv_sp_inv_movimiento_crear_header
- Inv_sp_inv_movimiento_procesar_item
- Inv_sp_inv_stock_ajustar
- Inv_sp_inv_stock_obtener
- Inv_sp_inv_transferencia_confirmar
- Inv_sp_inv_transferencia_enviar
- Inv_sp_inv_transferencia_item_enviar
- Inv_sp_inv_validar_stock
- Inv_sp_ot_consumo_registrar
- Inv_sp_ot_crear
- Inv_sp_ot_listar
- Inv_sp_ot_listar_filtro
- Inv_sp_ot_listar_tecnico
- Inv_sp_proyecto_crear
- Inv_sp_proyecto_material_estimar
- Inv_sp_proyecto_resumen
- Inv_sp_proyecto_tarea_crear
- Inv_sp_proyecto_wbs_obtener
- Inv_sp_proyectos_listar
- Inv_sp_rep_activos_estado
- Inv_sp_rep_consumo_por_ot
- Inv_sp_rep_consumo_por_tecnico
- Inv_sp_rep_ot_sla_tiempos
- Inv_sp_rep_stock_bajo
- Inv_sp_repo_consumo_por_proyecto
- Inv_sp_seg_permisos_verificar

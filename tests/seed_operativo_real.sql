-- SCRIPT DE CARGA DE DATOS REALES PARA EMPRESA DE TELECOMUNICACIONES (FTTH)
USE inventario;
GO

-- 1. LIMPIEZA DE DATOS PREVIOS (Opcional, para asegurar que el seed sea limpio)
DELETE FROM Inv_ope_ot_consumo;
DELETE FROM Inv_ope_ot_evidencias;
DELETE FROM Inv_ope_ot_firmas;
DELETE FROM Inv_ope_ot;
DELETE FROM Inv_ope_proyecto_material_estimado;
DELETE FROM Inv_ope_proyecto_tareas;
DELETE FROM Inv_ope_proyectos;
DELETE FROM Inv_inv_movimiento_detalle;
DELETE FROM Inv_inv_movimientos;
DELETE FROM Inv_inv_stock;
DELETE FROM Inv_cat_almacenes;
DELETE FROM Inv_cat_productos;
DELETE FROM Inv_cat_categorias_producto;
DELETE FROM Inv_cat_proveedores;
DELETE FROM Inv_seg_usuarios WHERE usuario <> 'admin@empresa.com';
GO

-- 2. CATEGORÍAS DE PRODUCTOS
INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES 
('Fibra Óptica', 'Cables externos, internos y drop butterfly'),
('Equipos Activos', 'ONTs, OLTs, Routers, Switches'),
('Pasivos y Herrajes', 'Splitters, Cajas Nap, Tensores, Grapas, Conectores'),
('Herramientas', 'Fusionadoras, OPM, OTDR, Cortadoras, Escaleras'),
('Flota Vehicular', 'Camionetas, Vans y Unidades Móviles');
GO

-- 3. PROVEEDORES
INSERT INTO Inv_cat_proveedores (nombre, contacto, telefono, email, direccion) VALUES 
('Huawei Technologies', 'Ing. Li Wei', '+505 8888-1111', 'ventas@huawei.com', 'Parque Tecnológico'),
('Corning Optical Communications', 'Robert Smith', '+505 7777-2222', 'robert.s@corning.com', 'Zona Franca'),
('Furukawa Solutions', 'Ana Garcia', '+505 5555-3333', 'ana.g@furukawa.com', 'Oficinas Centrales'),
('Stanley Tools', 'Marcos Perez', '+505 2222-4444', 'm.perez@stanley.com', 'Distribuidora Ferretera');
GO

-- 4. USUARIOS REALES (Capa Humana Responsable)
-- Clave por defecto '123456' (Hasheada sería similar a admin)
DECLARE @claveHash NVARCHAR(MAX) = '$2b$10$7N3zH9vJ5WpT728qM6/iXOqXqC3z2z8vG9z9z9z9z9z9z9z9z9z9'; -- Simulado

-- Directivos y Administración
INSERT INTO Inv_seg_usuarios (idUsuario, nombre, usuario, clave, rolNombre, activo) VALUES 
(100, 'Diana Martinez', 'diana.martinez@empresa.com', @claveHash, 'ADMIN', 1),
(101, 'Sofia Lopez', 'sofia.lopez@empresa.com', @claveHash, 'SUPERVISOR', 1), -- Despachadora
(102, 'Elena Rojas', 'elena.rojas@empresa.com', @claveHash, 'AUDITOR', 1),
(103, 'Mario Estrada', 'mario.estrada@empresa.com', @claveHash, 'ADMIN', 1); -- Jefe Logística

-- Técnicos Escalón 1 (12 Técnicos)
INSERT INTO Inv_seg_usuarios (idUsuario, nombre, usuario, clave, rolNombre, activo) VALUES 
(201, 'Carlos Paredes', 'carlos.paredes@empresa.com', @claveHash, 'TECNICO', 1),
(202, 'Juan Rodriguez', 'juan.rodriguez@empresa.com', @claveHash, 'TECNICO', 1),
(203, 'Miguel Torres', 'miguel.torres@empresa.com', @claveHash, 'TECNICO', 1),
(204, 'Luis Enrique Gomez', 'luis.gomez@empresa.com', @claveHash, 'TECNICO', 1),
(205, 'Fernando Castro', 'fernando.castro@empresa.com', @claveHash, 'TECNICO', 1),
(206, 'David Salazar', 'david.salazar@empresa.com', @claveHash, 'TECNICO', 1),
(207, 'Roberto Mendez', 'roberto.mendez@empresa.com', @claveHash, 'TECNICO', 1),
(208, 'Alejandro Ortiz', 'alejandro.ortiz@empresa.com', @claveHash, 'TECNICO', 1),
(209, 'Jorge Luis Vaca', 'jorge.vaca@empresa.com', @claveHash, 'TECNICO', 1),
(210, 'Ricardo Silva', 'ricardo.silva@empresa.com', @claveHash, 'TECNICO', 1),
(211, 'Oscar Valdivia', 'oscar.valdivia@empresa.com', @claveHash, 'TECNICO', 1),
(212, 'Hugo Sanchez', 'hugo.sanchez@empresa.com', @claveHash, 'TECNICO', 1);
GO

-- 5. CATÁLOGO DE PRODUCTOS (Materiales, Equipos, Herramientas, Vehículos)
-- Categorías IDs asumidas: 1-Fiber, 2-Equipos, 3-Pasivos, 4-Tools, 5-Flota
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock) VALUES 
('FIB-DROP-750', 'Fibra Drop 1 Hilo (Bobina 750m)', 1, 'Mts', 0, 150.00, 20),
('FIB-ADSS-24', 'Cable ADSS 24 Hilos (Carrete 4000m)', 1, 'Mts', 0, 1200.00, 1),
('ONT-HWA-EG8145', 'ONT Huawei EG8145V5 Dual Band', 2, 'Pza', 1, 45.00, 100),
('RT-TP-ARCHER', 'Router TP-Link Archer C60', 2, 'Pza', 1, 35.00, 50),
('TOOL-FUS-60S', 'Fusionadora Fujikura 60S Pro', 4, 'Pza', 1, 4500.00, 2),
('TOOL-OPM-V10', 'Medidor de Potencia Óptica Pon V10', 4, 'Pza', 1, 85.00, 5),
('FLOT-TOY-HIL01', 'Camioneta Toyota Hilux 2024 (Placa M 245-122)', 5, 'Pza', 1, 35000.00, 0),
('FLOT-NIS-FRO02', 'Camioneta Nissan Frontier 2023 (Placa M 310-988)', 5, 'Pza', 1, 28000.00, 0),
('PASS-NAP-16', 'Caja NAP 16 Puertos C/Splitter', 3, 'Pza', 0, 22.00, 40),
('PASS-TEN-Y', 'Tensor tipo Y para acometida', 3, 'Pza', 0, 0.45, 500),
('PASS-CON-SC', 'Conector Rápido SC/APC', 3, 'Pza', 0, 0.85, 1000);
GO

-- 6. ALMACENES (Responsabilidad Humana)
-- idUsuario 103 Mario Estrada es el Jefe de Almacén Central
INSERT INTO Inv_cat_almacenes (nombre, tipo, responsableId, activo) VALUES 
('Almacén Central Valle', 'CENTRAL', 103, 1),
('Centro de Distribución Norte', 'REGIONAL', 211, 1), -- Oscar Valdivia a cargo en el Norte
('Bodega Regional Sur', 'REGIONAL', 206, 1),    -- David Salazar a cargo en el Sur
('Almacén de Tránsito y Repuestos', 'PROYECTO', 103, 1);
GO

-- 7. STOCK INICIAL (Bodega Central)
-- idAlmacen 1 = Valle, 2 = CD Norte, 3 = Regional Sur, 4 = Transito
DECLARE @BodegaCentral INT = (SELECT idAlmacen FROM Inv_cat_almacenes WHERE nombre = 'Almacén Central Valle');
DECLARE @ProdFiber INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'FIB-DROP-750');
DECLARE @ProdONT INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'ONT-HWA-EG8145');
DECLARE @ProdConector INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'PASS-CON-SC');

INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES 
(@BodegaCentral, @ProdFiber, 'EMPRESA', 2, 15000.50), -- 15km de fibra
(@BodegaCentral, @ProdONT, 'EMPRESA', 1, 500),
(@BodegaCentral, @ProdONT, 'PROVEEDOR', 1, 200), -- Consignación
(@BodegaCentral, @ProdConector, 'EMPRESA', 3, 5000);
GO

-- 8. PROYECTOS REALES (Planificación WBS)
INSERT INTO Inv_ope_proyectos (idProyecto, nombre, descripcion, estado, fechaInicio, fechaFin, idResponsable) VALUES 
(1, 'Expansión FTTH Residencial Las Colinas', 'Construcción de red GPON para 1200 clientes potenciales.', 'EJECUCION', '2026-01-15', '2026-06-30', 100),
(2, 'Renovación Troncal Fibra Carretera Masaya', 'Recambio de cable ADSS de 12 a 24 hilos por degradación.', 'PLANIFICADO', '2026-02-01', '2026-03-15', 103);
GO

-- 9. TAREAS PROYECTO 1 (WBS)
INSERT INTO Inv_ope_proyecto_tareas (idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista, orden) VALUES 
(1, NULL, 'Fase 1: Implementación de Backbone', 'Tendido de fibra troncal y colocación de ODFs', '2026-01-15', '2026-02-15', 1),
(1, NULL, 'Fase 2: Distribución de Cajas NAP', 'Instalación de 80 cajas NAP en postes estratégicos', '2026-02-16', '2026-04-30', 2);
GO

-- Subtareas para Fase 1
DECLARE @Tarea11 INT = (SELECT idTarea FROM Inv_ope_proyecto_tareas WHERE nombre = 'Fase 1: Implementación de Backbone');
INSERT INTO Inv_ope_proyecto_tareas (idProyecto, idTareaPadre, nombre, descripcion, orden) VALUES 
(1, @Tarea11, 'Instalación de ODF en Central', 'Montaje de rack y patchcords', 1),
(1, @Tarea11, 'Fusión de hilos en troncal K12', 'Fusión por calor de hilos 1-24', 2);
GO

-- 10. ÓRDENES DE TRABAJO (Casos Reales)
-- Sofia Lopez (101) asigna los casos
INSERT INTO Inv_ope_ot (idProyecto, idTecnicoAsignado, clienteNombre, clienteDireccion, tipoOT, prioridad, estado, notas) VALUES 
(1, 201, 'Condominio Altamira Casa 42', 'Entrada Principal 2 cuadras al sur', 'INSTALACION', 'ALTA', 'ASIGNADA', 'Requiere escalera de 24 pies'),
(1, 202, 'Restaurante Los Fogones', 'Calle Marginal Km 14.5', 'MANTENIMIENTO', 'MEDIA', 'PROCESO', 'Revisar niveles de potencia en ONT'),
(1, 203, 'Apartamentos El Bosque #4', 'Segunda planta, acceso por escalera trasera', 'REPARACION', 'ALTA', 'REGISTRADA', 'Corte de fibra por poda de árboles');
GO

PRINT 'Carga de datos operativa finalizada con éxito.';
GO

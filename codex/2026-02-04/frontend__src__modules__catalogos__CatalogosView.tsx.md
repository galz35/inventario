Archivo: frontend/src/modules/catalogos/CatalogosView.tsx

Diseño
- Tabs superiores para categorías, proveedores, productos y clientes.
- DataTable central con botón de nuevo registro.
- Modal de creación con campos condicionados por tab.
- Modal de historial de servicios de clientes con DataTable interna.

Posibles errores / riesgos
- formData se reutiliza entre tabs sin reset; al cambiar de tab puede arrastrar campos no válidos para el nuevo tipo.
- En form de proveedores/clientes, el campo Dirección/NIT usa el mismo input y setea ambos (direccion y nit) con el mismo valor.
- En handleViewHistory se reutiliza setLoading (el mismo de DataTable principal), lo que puede bloquear la tabla principal mientras se carga historial.
- El enlace "Ver Consignaciones" usa href="#consignacion" pero no dispara cambio de view; solo cambia hash.

Mejoras concretas
- Resetear formData al cambiar activeTab y separar modelos por tipo.
- Separar inputs para Dirección y NIT.
- Usar estado de loading separado para el modal de historial.
- Reemplazar el link por una navegación explícita (setView) o botón con callback.

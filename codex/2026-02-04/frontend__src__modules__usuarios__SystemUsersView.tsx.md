Archivo: frontend/src/modules/usuarios/SystemUsersView.tsx

Diseño
- Encabezado con botón de nuevo usuario.
- DataTable con avatar, rol y acciones (perfil, activar/desactivar).
- Modal de creación con formulario básico.
- Modal de perfil con secciones de herramientas e historial.

Posibles errores / riesgos
- loadUsers aplica extracción de data.data.data por seguridad; si la API devuelve un objeto con data no-array, se silencian errores y se muestra lista vacía sin aviso.
- handleOpenProfile obtiene herramientas con activosService.getActivos y luego filtra por idTecnicoActual; si la API ya filtra por rol/usuario, se hace trabajo extra.
- Se usa confirm() en handleToggleStatus; no mantiene estilo de alert.service.

Mejoras concretas
- Mostrar mensaje de error o estado vacío cuando loadUsers falla.
- Evitar doble carga de activos si existe endpoint de activos por técnico.
- Reemplazar confirm() por alertConfirm para consistencia de UI.

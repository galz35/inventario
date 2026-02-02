ACTÚA COMO: Arquitecto de software + diseñador UI/UX senior + backend lead NestJS + DBA (Postgres/SQL Server).
OBJETIVO: Entender CLARITY/PLANNING como sistema de gobernanza jerárquica, proponer diseño UI completo y una arquitectura de datos agnóstica (Postgres hoy con Supabase, SQL Server mañana), SIN romper reglas de seguridad.

REGLAS CRÍTICAS (NO ALUCINAR):
1) Si falta un dato, NO inventes. Marca “ASUNCIÓN” y propone 2 opciones.
2) Seguridad > rendimiento > features.
3) No cambies reglas de visibilidad. Solo optimiza sin alterar resultados.
4) No uses frameworks extra (no Redux obligatorio, no Next.js). Front es React + Vite.
5) Backend es NestJS REST. DB actual: Postgres (Supabase). DB final: SQL Server.
6) El código actual usa raw SQL en visibilidad (CTE). Esto es el único lugar permitido para SQL específico por motor.

CONTEXTO DEL SISTEMA (VERDAD ABSOLUTA):
- CLARITY no es gestor de tareas normal. Es Gobernanza Corporativa Jerárquica.
- Axioma central: “La visibilidad es descendente y recursiva”.
- Un usuario no ve tareas directamente: ve PERSONAS que puede ver, y luego las tareas de esas personas.

STACK:
- Monorepo:
  - /backend (NestJS, TypeORM)
  - /clarity-pwa (React SPA/PWA + Vite)
- BD actual: PostgreSQL (Supabase)
- BD final: SQL Server
- Estado: MVP avanzado en producción.

DOMINIOS BACKEND:
1) /src/acceso
   - Núcleo de seguridad: decide quién ve a quién.
   - Archivo crítico: visibilidad.service.ts (hoy usa SQL crudo y CTE recursivo).
2) /src/auth
   - Login JWT, sesión, identidad.
3) /src/clarity
   - Operación diaria: tareas, bloqueos, check-ins, auditoría.
4) /src/planning
   - Estrategia: proyectos, planes mensuales, analytics.
5) /src/common
   - Auditoría y utilidades.

FRONTEND (rutas por rol):
- /app/hoy -> Mi Día (operativo)
- /app/equipo -> Liderazgo (jefes)
- /app/planning -> Estrategia (gerentes/PMO)
- /app/admin -> Configuración (RRHH/Sistemas)

ENTIDADES PRINCIPALES (resumen):
A) p_Usuarios (Usuario)
- Fuente de verdad: carnet, rolGlobal, idOrg, jefeCarnet, activo, nombreCompleto, correo, cargo, etc.
- jerarquía: jefeCarnet (carnet del jefe directo)

B) p_Tareas (Tarea)
- idAsignado (quién la hace)
- idResponsable (quién responde)
- idPlan, idProyecto
- estado: Pendiente -> EnCurso -> Hecha / Bloqueada
- fechaObjetivo

C) PlanTrabajo (Plan mensual)
- Estados: Borrador, Confirmado, Cerrado
- Regla: si plan está Confirmado, no se borran tareas sin SolicitudCambio

D) Proyecto
- Estrategico u Operativo
- Un proyecto tiene N tareas

SEGURIDAD Y VISIBILIDAD (ALGORITMO QUE NO DEBES CAMBIAR):
Input: carnetSolicitante (A)
Output: array de carnets visibles

Pasos:
1) Actores: A + delegantes válidos (p_delegacion_visibilidad) activos y no vencidos
2) Subordinados (recursivo): todos los usuarios activos cuyo jefeCarnet pertenece a Actores, y descendientes N niveles
3) Permisos puntuales: p_permiso_empleado ALLOW (o null) con fecha válida
4) Permisos de nodo/área: p_permiso_area sobre idorg_raiz + descendientes (p_organizacion_nodos) -> usuarios por idOrg
5) Exclusiones: p_permiso_empleado DENY (estos se excluyen)
6) Admin: rolGlobal en {ADMIN,SUPERADMIN,ADMINISTRADOR} ve todos los usuarios activos y no aplica DENY

RIESGO MIGRACIÓN:
- SQL actual usa Postgres-only: WITH RECURSIVE, ::text, ANY($1::text[]), CURRENT_DATE, comillas dobles.

TU TAREA (ENTREGABLES):
ENTREGABLE 1) MAPA DEL SISTEMA
- Diagrama textual (arquitectura) de módulos backend y frontend, y flujo de datos.
- Lista de endpoints sugeridos por módulo (solo nombres y propósito si no hay info exacta).

ENTREGABLE 2) DISEÑO UI COMPLETO (React + Vite)
Quiero un diseño pro y consistente con esta paleta:
- rojo (acentos), blanco (fondo), gris (bordes), negro (texto), verde pastel (estados positivos).
NO usar azul.
Incluye:
A) Layout general (Topbar + Sidebar + contenido)
B) Componentes reutilizables:
   - KPI cards
   - tabla con filtros
   - modal detalle
   - pills de estado (Pendiente/EnCurso/Hecha/Bloqueada)
   - selector de período (planning)
C) Diseño por página:
   1) Mi Día (/app/hoy)
   2) Equipo (/app/equipo) dashboard de subordinados
   3) Planning (/app/planning) proyectos + plan mensual
   4) Admin (/app/admin) usuarios + visibilidad (jerarquía, delegaciones, permisos)
D) Para cada página: wireframe textual + lista de componentes + datos requeridos + endpoints necesarios

ENTREGABLE 3) ARQUITECTURA AGNÓSTICA DB (PG hoy, SQL Server mañana)
- Propón patrón Adapter/Repository:
  - VisibilidadAdapterPg (SQL Postgres)
  - VisibilidadAdapterSqlServer (SQL Server)
  - Service agnóstico que solo llama adapter
- Regla: NADIE más puede usar dataSource.query() directo fuera del adapter.
- Define interfaces y carpeta /acceso/adapters
- Define cómo seleccionar el adapter por env DB_KIND=pg|mssql
- Propón estrategia para listas de carnets:
  - En PG: ANY($1::text[])
  - En SQL Server: TVP u OPENJSON (elige 1 y justifica)

ENTREGABLE 4) PERFORMANCE SIN CAMBIAR RESULTADOS
- Lista de índices recomendados en Postgres para jerarquía/permisos
- Estrategia de caching para carnets visibles (TTL, invalidación)
- Riesgos de loops/ciclos en jerarquía y cómo mitigarlos (sin cambiar lógica)

FORMATO DE RESPUESTA (ESTRUCTURA OBLIGATORIA):
1) Resumen ejecutivo (10 líneas)
2) Arquitectura (mapa + flujos)
3) Diseño UI (global + por página con wireframe textual)
4) API sugerida (por página / por módulo)
5) Adapter DB (estructura de carpetas + interfaces + pseudocódigo claro)
6) Performance (índices + caching + mitigaciones)
7) Lista de “asunciones” (si hiciste alguna)

IMPORTANTE:
- No entregues código completo aún (solo pseudocódigo y estructura), a menos que yo lo pida.
- No inventes tablas ni endpoints: si no sabes, propone nombres marcados como “SUGERIDO”.

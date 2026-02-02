
# Guía de Despliegue para Demo (Prototipo)

Este documento detalla los pasos para desplegar el sistema **Clarity Inventory & Operations (Prototipo)** en un servidor Linux (Ubuntu/Debian recomendado) para la presentación al cliente.

## 1. Requisitos Previos del Servidor

*   **OS:** Ubuntu 22.04 LTS o superior.
*   **Recursos (Min):** 2 vCPU, 4GB RAM (Recomendado 8GB si se corre la DB local).
*   **Software Base:**
    *   Docker Engine & Docker Compose
    *   Git

## 2. Preparación del Entorno (Local -> Servidor)

### A. Base de Datos (SQL Server)
Dado que estamos usando una instancia RDS (`54.146.235.205`), **NO** es necesario desplegar SQL Server en el contenedor de la demo si se tiene conectividad.
*   **Importante:** Asegurar que el Firewall/Security Group del servidor de la demo permita salida al puerto `1433`.

### B. Variables de Entorno (.env)
Crear un archivo `.env` en la raíz del servidor con la siguiente configuración (ajustada para producción):

```env
# Configuración Servidor Demo
PORT=3000
HOST=0.0.0.0

# Base de Datos (Conexión Realista FTTH)
DB_TYPE=mssql
MSSQL_HOST=54.146.235.205
MSSQL_PORT=1433
MSSQL_USER=plan
MSSQL_PASSWORD=admin123
MSSQL_DATABASE=inventario
MSSQL_ENCRYPT=true
MSSQL_TRUST_CERT=true

# Seguridad
JWT_SECRET=DEMO_KEY_SUPER_SECRET_CHANGE_ME_IN_PROD_BUT_OK_FOR_DEMO
```

## 3. Despliegue con Docker Compose

Crear un archivo `docker-compose.yml` en el servidor:

```yaml
version: '3.8'

services:
  # Backend API (NestJS + Fastify)
  backend:
    image: node:18-alpine
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run start:prod"
    networks:
      - clarity-net

  # Frontend (React + Vite) - Servido via Nginx o Preview
  frontend:
    image: node:18-alpine
    working_dir: /app
    ports:
      - "80:8080"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run build && npm run preview -- --host --port 8080"
    networks:
      - clarity-net

networks:
  clarity-net:
    driver: bridge
```

## 4. Pasos de Instalación en el Servidor

1.  **Clonar Repositorio (o subir archivos zip):**
    ```bash
    git clone <tu_repo_url> clarity_demo
    cd clarity_demo
    ```

2.  **Configurar Variables:**
    Copiar el contenido del `.env` sugerido arriba al archivo `backend/.env`.

3.  **Iniciar Servicios:**
    ```bash
    docker-compose up -d --build
    ```

4.  **Verificar Logs:**
    ```bash
    docker-compose logs -f
    ```

## 5. Validación Final (Checklist Pre-Demo)

*   [ ] **Login:** Ingresar con credenciales de admin (`admin` / `admin123` o `123456`).
*   [ ] **Datos:** Verificar que aparezca "EXPANSIÓN FTTH NORTE PH-1" en Proyectos.
*   [ ] **Inventario:** Verificar que existan ONTs Huawei y Bobinas de Fibra en el Dashboard.
*   [ ] **Flujo:** Crear una Tarea nueva y ver que no arroje error 500.

## 6. Solución de Problemas Comunes

*   **Error de Conexión DB:** Verificar `ping 54.146.235.205`. Si falla, revisar firewall.
*   **Error CORS:** El backend está configurado para aceptar `origin: true` en la demo, no debería fallar.
*   **Puerto Ocupado:** Asegurar que el puerto 80 no esté ocupado por Apache/Nginx del sistema base.

---
**Nota:** Este despliegue es "Zero-Config" pensado para que funcione `npm run preview` de Vite, lo cual es perfecto para demostraciones ágiles sin configurar un Nginx complejo.

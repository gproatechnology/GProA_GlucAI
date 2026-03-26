# 🔐 CONTROL DE ACCESOS Y PRIVILEGIOS - GECRAI v1.2

Este documento explica cómo funciona el sistema de permisos y niveles de acceso dentro de la plataforma GECRAI 1.2, tanto a nivel de usuario como a nivel de organización (planes).

---

## 👥 ROLES DE USUARIO

Cada usuario dentro de una organización tiene un rol asignado que determina qué acciones puede realizar.

| Rol | Descripción | Privilegios Clave |
|:--- |:--- |:--- |
| **Owner** (Dueño) | Creador de la organización. | Control total, gestión de facturación, borrar organización, gestionar todos los usuarios y proyectos. |
| **Admin** (Administrador) | Gestor de equipos. | Añadir/eliminar miembros, crear/editar/borrar cualquier proyecto de la organización. |
| **Member** (Miembro) | Usuario operativo. | Crear y editar proyectos y cálculos propios. Ver proyectos de otros miembros. |
| **Viewer** (Observador) | Usuario de consulta. | Solo lectura. No puede crear proyectos ni modificar cálculos existentes. |

### Matriz de Permisos

| Acción | Owner | Admin | Member | Viewer |
|:--- |:---:|:---:|:---:|:---:|
| Crear Proyectos | ✅ | ✅ | ✅ | ❌ |
| Editar cualquier Proyecto | ✅ | ✅ | ❌* | ❌ |
| Borrar Proyectos | ✅ | ✅ | ❌ | ❌ |
| Gestionar Usuarios | ✅ | ✅ | ❌ | ❌ |
| Suspender/Activar Usuarios | ✅ | ✅ | ❌ | ❌ |
| Cambiar Plan / Facturación | ✅ | ❌ | ❌ | ❌ |

*\*Los Members pueden editar proyectos que ellos mismos crearon.*

---

## 🏢 PLANES DE ORGANIZACIÓN (SaaS)

GECRAI utiliza una arquitectura multi-tenant donde los límites dependen del plan contratado por la organización.

| Característica | FREE | STARTER | PRO | ENTERPRISE |
|:--- |:---:|:---:|:---:|:---:|
| **Usuarios Máx.** | 1 | 3 | 10 | Ilimitado |
| **Proyectos Máx.** | 3 | 10 | 50 | Ilimitado |
| **Cálculos / mes** | 100 | 500 | 2,000 | Ilimitado |
| **Consultas IA / mes** | 50 | 200 | 1,000 | Ilimitado |
| **Reportes PDF** | ❌ | ✅ | ✅ | ✅ |
| **Acceso vía API** | ❌ | ❌ | ✅ | ✅ |
| **Soporte Prioritario** | ❌ | ❌ | ✅ | ✅ |

---

## 🛡️ SEGURIDAD Y VALIDACIÓN

- **Multi-tenencia Estricta**: Un usuario NUNCA puede ver proyectos de otra organización, incluso si conoce el ID del proyecto. El sistema valida el `org_id` en cada consulta a la base de datos.
- **Validación de Límites**: Antes de crear un proyecto o usuario, el sistema verifica si la organización ha alcanzado el límite de su plan actual.
- **Protección de Rutas**: Todas las rutas de la API (excepto login/registro) requieren un token JWT válido y verifican los permisos del usuario en tiempo real.
- **Revocación Estricta (Blacklist)**: Al cerrar sesión (Logout), el token JWT vigente es incorporado a una lista negra en Redis. Esto asegura que un token comprometido o robado no pueda ser reutilizado una vez que el usuario cierra su sesión.
- **CORS Estricto**: Para prevenir ataques cross-site, los orígenes (dominios) permitidos son gestionados rígidamente mediante variables de entorno en producción, evitando configuraciones wildcard (`*`).
- **Estados de Cuenta**: Los administradores pueden suspender (desactivar) y reactivar cuentas de usuario temporalmente si se detecta comportamiento inusual o cese de relación laboral.

---

## 🚀 PASO A PASO PARA INGRESAR

Al ser una plataforma SaaS (Multi-tenant), no hay una contraseña "maestra" única. Cada usuario debe crear su propia cuenta o ser invitado.

### 1. Registro Inicial (Crear Organización)
Si es la primera vez que usas la plataforma en este entorno:
1. Ve a `http://localhost:3000/register` (o haz clic en "Sign Up").
2. Completa los datos:
   - **Email**: Tu correo (ej: `admin@tuempresa.com`).
   - **Password**: Debe ser segura (mín. 8 caracteres, mayúscula, número y símbolo).
   - **Organization Name**: El nombre de tu empresa o equipo.
3. Al registrarte, te convertirás automáticamente en el **Owner** de esa nueva organización.

### 2. Inicio de Sesión (Login)
Una vez tengas cuenta:
1. Ve a `http://localhost:3000/login`.
2. Ingresa tu **Email** y **Password**.
3. El sistema te redirigirá al Dashboard principal de tu organización.

### 3. Gestión de Credenciales
- **Contraseñas**: El sistema almacena las contraseñas usando el algoritmo **BCrypt** (hashing seguro). Nadie, ni siquiera los administradores de la base de datos, puede ver tu contraseña en texto plano.
- **Tokens de Sesión**: GECRAI utiliza **JWT (JSON Web Tokens)**. Tu sesión es válida por un tiempo determinado y se renueva automáticamente mediante *Refresh Tokens* para mayor seguridad.

---
*GECRAI 1.2 - Documentación de Seguridad e Infraestructura*

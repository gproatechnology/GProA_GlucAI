# Manual Funcional - GECRAI 1.2
## Sistema Inteligente para Memorias de Cálculo Eléctricas

GECRAI 1.2 es una plataforma SaaS (Software as a Service) diseñada específicamente para ingenieros eléctricos y proyectistas. Este manual explica qué hace el programa, cómo entrar y cómo utilizar sus funciones principales.

---

## 1. Acceso al Sistema (Autenticación)

El sistema utiliza un esquema de seguridad de grado industrial (JWT con Cookies HttpOnly).

### Cómo Ingresar:
1. **URL Local**: Accede a `http://localhost:3000`.
2. **Registro**: Si es tu primera vez, ve a "Registrarse".
    - Deberás crear una **Organización** (ej: "Ingeniería Alpha").
    - Crear tu usuario administrador.
3. **Login**: Introduce tus credenciales.
    - **Seguridad**: El sistema ahora protege tu sesión automáticamente mediante cookies invisibles que no pueden ser robadas por virus o scripts.

---

## 2. El Panel Principal (Dashboard)

Al entrar, verás un resumen de tu actividad apoyado por una interfaz totalmente renovada (Premium UX):
- **Glassmorphism Design**: Tarjetas translúcidas y diseño vibrante para mayor inmersión.
- **Estadísticas Rápidas**: Número total de proyectos, cálculos realizados este mes y uso de tu plan representados en gráficos interactivos (Recharts).
- **Actividad Reciente**: Los últimos proyectos en los que has trabajado.
- **Acceso Directo**: Botones para iniciar un nuevo cálculo rápidamente.

---

## 3. Gestión de Proyectos

GECRAI organiza el trabajo por **Proyectos**. Un proyecto es un contenedor que agrupa múltiples memorias de cálculo para una misma obra o cliente.

### Operaciones:
- **Crear Proyecto**: Define el nombre, descripción, nivel de tensión (MT/BT) y ubicación.
- **Listado**: Visualiza todos tus proyectos en una tabla interactiva con filtros.
- **Detalle de Proyecto**: Dentro de cada proyecto, puedes ver y gestionar su historial de cálculos específicos.

---

## 4. Módulo de Cálculos Eléctricos (El Corazón de GECRAI)

Actualmente, el sistema se especializa en dos cálculos críticos bajo normativas internacionales:

### A. Cálculo de Caída de Tensión (Voltage Drop)
Calcula la pérdida de voltaje en un conductor basado en:
- **Entradas**: Material (Cobre/Aluminio), calibre, longitud, corriente de carga, factor de potencia y tensión nominal.
- **Resultado**: Porcentaje de caída de tensión y cumplimiento con el límite permitido (ej: 3% o 5%).

### B. Dimensionamiento de Conductores (Conductor Sizing)
Determina el calibre adecuado del cable:
- **Entradas**: Corriente de diseño, temperatura ambiente, tipo de aislamiento (THHN, XHHW, etc.), tipo de canalización y número de conductores portadores de corriente.
- **Resultado**: Calibre sugerido y capacidad de conducción (ampacidad) corregida por factores de temperatura y agrupamiento.

---

## 5. Características Avanzadas y Seguridad

- **Multi-tenancy**: Tu información está totalmente aislada. Nadie fuera de tu organización puede ver tus proyectos.
- **Reportes PDF Profesionales**: Descarga la Memoria de Cálculo de cada proyecto cumpliendo estrictamente con la normativa NOM-001/NEC. Puedes exportarla con un solo clic pulsando el botón "Memoria PDF" dentro del espacio de Proyectos.
- **Headers de Seguridad**: El sistema bloquea automáticamente ataques de tipo Clickjacking, XSS y Sniffing, mientras que el cierre de sesión inactiva los tokens JWT usando Listas Negras (Redis).
- **Caché en Tiempo Real**: Cálculos matemáticos complejos y consultas concurrentes se balancean al microsegundo utilizando Memorias Caché (Redis).

---

## 6. Guía Rápida de Uso

1. **Paso 1**: Crea un nuevo **Proyecto** (ej: "Edificio Central").
2. **Paso 2**: Entra al proyecto y haz clic en **"Nuevo Cálculo"**.
3. **Paso 3**: Selecciona **"Caída de Tensión"**, llena los datos técnicos y presiona **"Calcular"**.
4. **Paso 4**: Los resultados se guardarán automáticamente vinculados a tu proyecto para futuras consultas o auditorías.

---

**Desarrollado por GProA**
*Versión 1.2.0 - 2026*

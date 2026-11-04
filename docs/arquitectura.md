# Arquitectura GlucAI 2.0

## Capas del sistema

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| **Frontend** | HTML5 + ES6 Modules + CSS | Interfaz de usuario, formulario, visualización |
| **Motor IA** | JavaScript puro | Validación, normalización, KNN, explicabilidad |
| **Datos** | JSON estático + localStorage | Dataset sintético, historial de diagnósticos |
| **Despliegue** | Estático (Render/GitHub Pages) | Hosting sin servidor |

## Flujo de datos

```
Entrada (33 biomarcadores) → Validación → Normalización Z-Score → 
Distancia Euclídea Ponderada → KNN k=5 → Votación → 
Clase + Confianza → Explicabilidad → Resultado
```

## Filosofía de desarrollo

- Desarrollo ligero, por sprints
- Sin backend obligatorio en fase inicial
- Frontend estático desplegable en cualquier hosting estático
- Motor KNN independiente y testeable

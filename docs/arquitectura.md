# Arquitectura GlucAI 2.0

## Capas

- **Frontend:** HTML5 + ES6 Modules + CSS (estático, sin framework)
- **Motor IA:** JavaScript puro (validación, normalización z-score, KNN, explicabilidad)
- **Datos:** JSON estático + localStorage opcional

## Estructura de carpetas

```
GlucAI/
├── docs/
├── src/frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── knn/
│   │   ├── ui/
│   │   └── data/
│   └── assets/
└── tests/
```

## Filosofía

Desarrollo ligero, por sprints, sin backend obligatorio en fase inicial.

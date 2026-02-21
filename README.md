# Task API - Challenge ITRock

API serverless de gestión de tareas personales construida con Serverless Framework, TypeScript y SQLite.

## Stack Técnico

| Componente     | Tecnología                                  |
| -------------- | -------------------------------------------- |
| Runtime        | Node.js 18+ con TypeScript                   |
| Framework      | Serverless Framework v3 + serverless-offline |
| Bundler        | serverless-esbuild                           |
| Base de datos  | SQLite (better-sqlite3)                      |
| Autenticación | JWT (jsonwebtoken)                           |
| Validación    | Zod v4                                       |
| Middleware     | middy v7                                     |
| Tests          | Jest + ts-jest                               |

## Arquitectura

```
HTTP Request → Handler → Middleware (auth, validation, errors) → Service → Repository → SQLite
```

- **Handlers**: Capa fina que parsea el evento y retorna HTTP response. Sin lógica de negocio.
- **Middleware** (middy): Auth (JWT → userId), Validación (Zod), Error handling (catch-all).
- **Services**: Toda la lógica de negocio. Errores tipados (NotFoundError, ForbiddenError).
- **Repositories**: Acceso a datos, queries SQL puras.
- **Database**: Conexión singleton reutilizada entre invocaciones warm de Lambda.

## Instalación

```bash
# Clonar e instalar
git clone https://github.com/Nicolas-Pistillo/itrock-challenge-serverless-task-api.git
cd itrock-challenge-serverless-task-api
npm install

# Copiar configuración
cp .env.example .env

# Iniciar servidor local
npm run dev

# Correr tests
npm run test
```

## Endpoints

### Autenticación

**POST /auth/login** — Obtener JWT token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

Credenciales disponibles:

- `admin` / `password123`
- `user` / `password456`

### Tareas (requieren JWT)

Para todos los endpoints de tareas, incluir el header:

```
Authorization: Bearer <token>
```

**POST /tasks** — Crear tarea

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Mi tarea","description":"Descripción opcional"}'
```

**GET /tasks** — Listar tareas (paginado + filtros)

```bash
# Básico
curl http://localhost:3000/tasks -H "Authorization: Bearer <token>"

# Con paginación
curl "http://localhost:3000/tasks?page=1&limit=5" -H "Authorization: Bearer <token>"

# Filtrar por completadas
curl "http://localhost:3000/tasks?completed=true" -H "Authorization: Bearer <token>"

# Filtrar por rango de fechas
curl "http://localhost:3000/tasks?from=2024-01-01T00:00:00.000Z&to=2024-12-31T23:59:59.999Z" \
  -H "Authorization: Bearer <token>"
```

**PATCH /tasks/:id** — Actualizar tarea

```bash
curl -X PATCH http://localhost:3000/tasks/<task-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"completed":true}'
```

**DELETE /tasks/:id** — Eliminar tarea

```bash
curl -X DELETE http://localhost:3000/tasks/<task-id> \
  -H "Authorization: Bearer <token>"
```

**POST /tasks/import** — Importar tareas desde JSONPlaceholder

```bash
curl -X POST http://localhost:3000/tasks/import \
  -H "Authorization: Bearer <token>"
```

Importa las primeras 5 tareas del userId 1 de [JSONPlaceholder](https://jsonplaceholder.typicode.com/todos).

## Formato de Respuesta

Todas las respuestas siguen un envelope consistente:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

En caso de error:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found"
  }
}
```

## Decisiones Técnicas

### SQLite en lugar de DynamoDB

SQLite simplifica el desarrollo local y testing (`:memory:` para tests). Para producción se podría migrar a DynamoDB sin cambiar la capa de servicios gracias al patrón Repository.

### Middy como middleware

Estándar de facto para Lambda. Permite componer cadenas de middleware (auth → validation → handler) de forma limpia y testeable.

### Zod para validación

Validación en runtime con inferencia de tipos TypeScript. Schemas reutilizables y mensajes de error descriptivos.

### Arquitectura por capas

Separación clara de responsabilidades: handlers no tienen lógica de negocio, services no saben de HTTP, repositories no tienen lógica de negocio. Facilita testing unitario con mocks.

### Error hierarchy

Errores tipados (`NotFoundError`, `ForbiddenError`, etc.) que el middleware de errores mapea automáticamente a respuestas HTTP apropiadas.

## Tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage
```

- **Unit tests**: Services (con mock del repository), Repository (SQLite `:memory:`)
- **Integration tests**: Handlers completos con middleware chain

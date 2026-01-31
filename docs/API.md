# Moby Kanban API

REST API for programmatic task management. Designed for Moby to interact with the board.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://moby-kanban.vercel.app/api`

## Authentication

Currently no authentication required (trusted environment).

## Endpoints

### List Tasks

```
GET /api/tasks
```

Returns all tasks ordered by status and position.

**Response** `200 OK`
```json
[
  {
    "id": "clx123...",
    "title": "Build Kanban MVP",
    "description": "Create drag-and-drop board",
    "status": "DONE",
    "priority": "HIGH",
    "creator": "MOBY",
    "needsReview": false,
    "position": 0,
    "createdAt": "2026-01-31T00:00:00.000Z",
    "updatedAt": "2026-01-31T00:00:00.000Z"
  }
]
```

### Create Task

```
POST /api/tasks
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "New task",           // required
  "description": "Details...",   // optional
  "priority": "MEDIUM",          // optional: LOW, MEDIUM, HIGH, URGENT
  "creator": "MOBY"              // optional: MOBY, STEPHAN
}
```

**Response** `201 Created`
```json
{
  "id": "clx456...",
  "title": "New task",
  "status": "BACKLOG",
  ...
}
```

### Get Task

```
GET /api/tasks/:id
```

**Response** `200 OK` or `404 Not Found`

### Update Task

```
PATCH /api/tasks/:id
Content-Type: application/json
```

**Request Body** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "needsReview": true,
  "position": 0
}
```

**Response** `200 OK` or `404 Not Found`

### Delete Task

```
DELETE /api/tasks/:id
```

**Response** `200 OK`
```json
{ "success": true }
```

### Toggle Review Flag

```
POST /api/tasks/:id/flag
```

Toggles the `needsReview` boolean.

**Response** `200 OK`
```json
{
  "id": "clx123...",
  "needsReview": true,
  ...
}
```

## Enums

### Status
- `BACKLOG` - Not started
- `IN_PROGRESS` - Being worked on
- `DONE` - Completed

### Priority
- `LOW` - Can wait
- `MEDIUM` - Normal priority (default)
- `HIGH` - Important
- `URGENT` - Do immediately

### Creator
- `MOBY` - Created by AI (default)
- `STEPHAN` - Created by human

## Example: Moby Creating a Task

```bash
curl -X POST https://moby-kanban.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review email watcher implementation",
    "description": "Check the Python script for edge cases",
    "priority": "HIGH",
    "creator": "MOBY"
  }'
```

## Example: Flagging for Review

```bash
curl -X POST https://moby-kanban.vercel.app/api/tasks/clx123.../flag
```

## Example: Moving to Done

```bash
curl -X PATCH https://moby-kanban.vercel.app/api/tasks/clx123... \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}'
```

## Notes

- The web UI uses client-side localStorage for persistence (works offline)
- The API uses SQLite via Prisma (works in development)
- For production persistence, consider migrating to Vercel Postgres or Turso

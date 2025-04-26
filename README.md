# Todo Application API

A RESTful API for managing Todos and their Items, built with Node.js, Express, and MySQL.

## Requirements

- Node.js
- MySQL

## Setup

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Configure MySQL connection in `src/config/db.config.js`
4. Run the application:
```
npm start
```

For development with auto-reload:
```
npm run dev
```

## API Endpoints

### Todo API

- `GET /api/todos` - Get all Todos (with pagination, filtering)
  - Query parameters:
    - `page` - Page number (default: 1)
    - `size` - Items per page (default: 10)
    - `status` - Filter by status (ACTIVE, INACTIVE, DELETED)
    - `title` - Search by title
- `GET /api/todos/:id` - Get a single Todo by ID (with its Items)
- `POST /api/todos` - Create a new Todo (with Items)
  - Request body:
    ```json
    {
      "title": "Required Title",
      "subtitle": "Optional Subtitle",
      "status": "ACTIVE",
      "items": [
        {
          "content": "Item content 1",
          "isCompleted": false
        },
        {
          "content": "Item content 2",
          "isCompleted": true
        }
      ]
    }
    ```
- `PUT /api/todos/:id` - Update a Todo
- `DELETE /api/todos/:id` - Delete a Todo (soft delete)

### Item API

- `GET /api/items/todo/:todoId` - Get all Items for a Todo
  - Query parameters:
    - `isCompleted` - Filter by completion status (true/false)
- `GET /api/items/:id` - Get a single Item by ID
- `POST /api/items` - Create a new Item
  - Request body:
    ```json
    {
      "content": "Required content",
      "isCompleted": false,
      "todoId": 1
    }
    ```
- `PUT /api/items/:id` - Update an Item
- `DELETE /api/items/:id` - Delete an Item (hard delete)

## Data Models

### Todo
- `id` - Auto-incremented primary key
- `title` - Required string
- `subtitle` - Optional string
- `status` - ENUM ('ACTIVE', 'INACTIVE', 'DELETED'), default 'ACTIVE'
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Item
- `id` - Auto-incremented primary key
- `content` - Required text
- `isCompleted` - Boolean, default false
- `completedAt` - Timestamp, null if not completed
- `todoId` - Foreign key to Todo
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

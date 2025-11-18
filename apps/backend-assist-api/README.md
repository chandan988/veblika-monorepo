# Backend Assist API

A well-structured Express + MongoDB + Mongoose API backend following industry best practices.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **MongoDB & Mongoose** - NoSQL database with elegant ODM
- **TypeScript** - Type-safe code
- **Zod** - Schema validation
- **Clean Architecture** - Separation of concerns (Controllers, Services, Models)
- **Error Handling** - Centralized error handling
- **Security** - Helmet, CORS configured
- **Logging** - Morgan for HTTP logging
- **Health Check** - API health endpoint

## 📁 Project Structure

```
src/
├── config/         # App configuration (env, db, logger)
├── loaders/        # Startup steps (express, database, routes)
├── api/
│   ├── routes/     # Route definitions
│   ├── controllers/# Request handlers
│   ├── services/   # Business logic
│   ├── models/     # Mongoose schemas
│   └── validators/ # Zod validation schemas
├── middleware/     # Custom middlewares
├── utils/          # Helpers and utilities
├── core/           # Core system (errors, responses)
├── interfaces/     # TypeScript interfaces
├── jobs/           # Cron jobs, workers
├── app.ts          # Express initialization
└── server.ts       # Server entry point
```

## 🛠️ Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- pnpm (or npm/yarn)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/backend-assist
   API_PREFIX=/api/v1
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the development server:**
   ```bash
   pnpm dev
   ```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Users API
```
POST   /api/v1/users          # Create user
GET    /api/v1/users          # Get all users (with pagination)
GET    /api/v1/users/:id      # Get user by ID
PATCH  /api/v1/users/:id      # Update user
DELETE /api/v1/users/:id      # Delete user
```

### Example Request

**Create User:**
```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get All Users (with pagination):**
```bash
curl "http://localhost:3001/api/v1/users?page=1&limit=10&sortBy=createdAt&sortOrder=desc"
```

## 📦 Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm typecheck    # Run TypeScript type checking
```

## 🏗️ Adding New Features

### Creating a New Module

1. **Create Model** (`src/api/models/`)
   ```typescript
   import mongoose, { Schema } from 'mongoose';
   
   const schema = new Schema({ /* ... */ });
   export const Model = mongoose.model('Model', schema);
   ```

2. **Create Validator** (`src/api/validators/`)
   ```typescript
   import { z } from 'zod';
   
   export const createSchema = z.object({
     body: z.object({ /* ... */ })
   });
   ```

3. **Create Service** (`src/api/services/`)
   ```typescript
   export class MyService {
     async create(data: any) { /* ... */ }
   }
   ```

4. **Create Controller** (`src/api/controllers/`)
   ```typescript
   import { asyncHandler } from '../../utils/async-handler.js';
   
   export class MyController {
     create = asyncHandler(async (req, res) => { /* ... */ });
   }
   ```

5. **Create Routes** (`src/api/routes/`)
   ```typescript
   import { Router } from 'express';
   
   const router = Router();
   router.post('/', controller.create);
   export default router;
   ```

6. **Register Routes** (`src/loaders/routes.ts`)
   ```typescript
   import myRoutes from '../api/routes/my.routes.js';
   router.use('/my-resource', myRoutes);
   ```

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/backend-assist` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## 🧪 Error Handling

The API uses centralized error handling with custom error classes:

```typescript
throw new NotFoundError('User not found');
throw new ValidationError('Invalid input');
throw new UnauthorizedError('Authentication required');
```

All errors are caught and formatted consistently:

```json
{
  "success": false,
  "error": "Error message",
  "errors": []
}
```

## 📝 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

Paginated responses include metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Configurable cross-origin requests
- **Input Validation** - Zod schema validation
- **MongoDB Injection Protection** - Mongoose sanitization

## 📚 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Language**: TypeScript
- **Validation**: Zod
- **Dev Tools**: tsx, Morgan

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT

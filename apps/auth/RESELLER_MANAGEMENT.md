# Reseller Management System

## Overview
Complete CRUD implementation for managing resellers and their apps in the auth application.

## Database Collections

### 1. `reseller`
Stores reseller information.

**Fields:**
- `_id`: ObjectId (auto-generated)
- `name`: string (required)
- `contactEmail`: string (optional)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
```javascript
db.reseller.createIndex({ name: 1 })
```

### 2. `reseller_apps`
Stores apps assigned to resellers. One reseller can have multiple apps.

**Fields:**
- `_id`: ObjectId (auto-generated)
- `resellerId`: string (required, references reseller._id)
- `appType`: enum ['hrms', 'social-media', 'backend-assist'] (required)
- `host`: string (required, unique)
- `settings`: object (optional)
- `isActive`: boolean (default: true)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
```javascript
db.reseller_apps.createIndex({ resellerId: 1 })
db.reseller_apps.createIndex({ host: 1 }, { unique: true })
db.reseller_apps.createIndex({ resellerId: 1, appType: 1 })
```

## API Routes

### Resellers

#### GET `/api/resellers`
List all resellers with their apps.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Reseller Name",
      "contactEmail": "contact@example.com",
      "apps": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### POST `/api/resellers`
Create a new reseller.

**Request Body:**
```json
{
  "name": "Reseller Name",
  "contactEmail": "contact@example.com"
}
```

#### GET `/api/resellers/[id]`
Get a single reseller with their apps.

#### PUT `/api/resellers/[id]`
Update reseller information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "contactEmail": "new@example.com"
}
```

#### DELETE `/api/resellers/[id]`
Delete a reseller and all associated apps.

### Reseller Apps

#### GET `/api/resellers/[id]/apps`
Get all apps for a reseller.

#### POST `/api/resellers/[id]/apps`
Add a new app to a reseller.

**Request Body:**
```json
{
  "appType": "hrms",
  "host": "example.com",
  "settings": {},
  "isActive": true
}
```

#### PUT `/api/resellers/[id]/apps/[appId]`
Update an app.

**Request Body:**
```json
{
  "appType": "social-media",
  "host": "newhost.com",
  "settings": {},
  "isActive": false
}
```

#### DELETE `/api/resellers/[id]/apps/[appId]`
Delete an app.

## UI Pages

### `/master`
Dashboard with navigation to reseller management.

### `/master/resellers`
**Features:**
- List all resellers in a table
- Show app count and types for each reseller
- Create new reseller (dialog)
- Delete reseller (with confirmation)
- Navigate to reseller detail page

### `/master/resellers/[id]`
**Features:**
- View and edit reseller information
- List all apps for the reseller
- Add new app (dialog)
- Edit app inline
- Delete app (with confirmation)
- Toggle app active status

## UI Components Used
- Table (for listing data)
- Dialog (for create/delete confirmations)
- Badge (for app types and status)
- Switch (for active/inactive toggle)
- Card (for layout)
- Button (for actions)
- Input (for forms)
- Select (for dropdowns)

## Features
- ✅ Full CRUD operations for resellers
- ✅ Full CRUD operations for apps
- ✅ One reseller can have multiple apps
- ✅ Unique host validation
- ✅ Industry-standard UI with shadcn/ui components
- ✅ Small text sizes throughout
- ✅ Proper API route naming
- ✅ TypeScript types
- ✅ Error handling
- ✅ Toast notifications
- ✅ Loading states
- ✅ Confirmation dialogs for destructive actions

## Database Setup (if needed)

Run these commands in MongoDB to create indexes:

```javascript
use your_database_name;

// Create indexes for reseller collection
db.reseller.createIndex({ name: 1 });

// Create indexes for reseller_apps collection
db.reseller_apps.createIndex({ resellerId: 1 });
db.reseller_apps.createIndex({ host: 1 }, { unique: true });
db.reseller_apps.createIndex({ resellerId: 1, appType: 1 });
```

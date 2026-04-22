# CMS Builder — Backend Integration Schema

This document outlines the API endpoints, authentication, and data structures required for the **FoodCity Backend** (or any new CMS backend) to perfectly connect with the new **CMS Builder** dashboard in Super Admin.

---

## 1. Authentication

The CMS Builder connects securely to each individual backend instance using a standard JWT-based login mechanism.

### `POST /api/v1/admin/auth/login`

Authenticates the CMS admin and returns a session token.

**Request Body:**

```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
// OR inside a data object:
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "error": "Буруу нэвтрэх нэр эсвэл нууц үг"
}
```

---

## 2. Page Content Management

The Builder fetches and saves page "sections" as a single JSON object. The backend should ideally store this data in a MongoDB collection (e.g., `SitePage` model) mapped by `pageId` and `lang`.

**Important Parameters:**

- `pageId`: The ID of the page (e.g., `home`, `about`, `services`, `contact`, `properties-page`, `sales-page`, `jobs-page`, `team`, `footer`).
- `lang`: Passed as a query parameter (`?lang=mn` or `?lang=en`).

### `GET /api/v1/admin/site-pages/:pageId?lang={lang}`

Retrieves the saved sections for a given page and language.

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200 OK):**

```json
{
  "data": {
    "sections": {
      "hero": {
        "titleLine1": "Welcome",
        "desc": "Site description"
      },
      "stats": [{ "value": "100+", "label": "Clients" }]
    }
  }
}
```

_(If no data exists, the backend should return `{ "data": { "sections": {} } }` or just a 200 OK with no sections, and the builder will handle it)._

### `PUT /api/v1/admin/site-pages/:pageId?lang={lang}`

Saves the modified sections back to the database.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "sections": {
    "hero": {
      "titleLine1": "Updated Welcome",
      "desc": "Updated description"
    }
    // ... all other sections for the page
  }
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Амжилттай хадгалагдлаа"
}
```

---

## 3. Database Schema Concept (Mongoose Example)

To support this structure flexibly without strictly typing every single field on the backend, you can use a mixed-type JSON field for `sections`, allowing the frontend CMS Builder to control the structure.

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface ISitePage extends Document {
  pageId: string; // e.g., 'home', 'about', 'footer'
  lang: string; // 'mn' or 'en'
  sections: any; // Flexible JSON object populated by CMS Builder
  updatedAt: Date;
}

const sitePageSchema: Schema = new Schema(
  {
    pageId: { type: String, required: true },
    lang: { type: String, required: true, enum: ["mn", "en"] },
    sections: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Ensure unique combination of page and language
sitePageSchema.index({ pageId: 1, lang: 1 }, { unique: true });

export default mongoose.model<ISitePage>("SitePage", sitePageSchema);
```

## Summary for the Backend Engineer

1. Ensure `POST /api/v1/admin/auth/login` accepts JSON and returns a JWT in `token` or `data.token`.
2. Ensure you have parameterized routes for `GET` and `PUT` on `/api/v1/admin/site-pages/:pageId`.
3. Read the `?lang=mn` query param.
4. Allow the `sections` object in the JSON body to be saved flexibly (using `Schema.Types.Mixed` in MongoDB) so that changes to the frontend structure do not break the backend schema.

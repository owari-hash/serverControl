# Backend API Documentation - Component & Placeholder Storage

## Overview

This document describes how the SuperAdmin system saves components with placeholders/sections to the backend, and how the backend should store and retrieve this data.

## Component Types

### 1. Header Component

```json
{
  "instanceId": "uuid",
  "projectName": "my-project",
  "pageRoute": "/",
  "componentType": "header",
  "props": {
    "title": "Company Name",
    "logoUrl": "https://example.com/logo.png",
    "pages": [
      { "route": "/", "title": "Home" },
      { "route": "/about", "title": "About" }
    ]
  }
}
```

### 2. Footer Component

```json
{
  "instanceId": "uuid",
  "projectName": "my-project",
  "pageRoute": "/",
  "componentType": "footer",
  "props": {
    "title": "Company Name",
    "description": "Company description",
    "email": "info@company.com",
    "phone": "+976 0000 0000",
    "address": "Ulaanbaatar, Mongolia",
    "copyright": "© 2026 Company Name. All rights reserved."
  }
}
```

### 3. Multi-Section Components (home, about, service, contact, text)

These components contain draggable sections/placeholders:

```json
{
  "instanceId": "uuid",
  "projectName": "my-project",
  "pageRoute": "/",
  "componentType": "home",
  "props": {
    "sections": [
      {
        "id": "section-1",
        "type": "text",
        "position": { "x": 20, "y": 20 },
        "size": { "width": 300, "height": 100 },
        "content": "Welcome to our website"
      },
      {
        "id": "section-2",
        "type": "image",
        "position": { "x": 20, "y": 140 },
        "size": { "width": 200, "height": 200 },
        "content": "https://example.com/image.jpg"
      },
      {
        "id": "section-3",
        "type": "button",
        "position": { "x": 240, "y": 140 },
        "size": { "width": 120, "height": 45 },
        "content": "Learn More"
      }
    ],
    "images": [],
    "title": "Home Page"
  }
}
```

### 4. Card Component

```json
{
  "instanceId": "uuid",
  "projectName": "my-project",
  "pageRoute": "/services",
  "componentType": "card",
  "props": {
    "cards": [
      {
        "id": "card-1",
        "title": "Service 1",
        "description": "Description here",
        "imageUrl": "https://example.com/image1.jpg"
      }
    ],
    "gridColumns": 3,
    "gridGap": 16
  }
}
```

### 5. Slideshow/Album Component

```json
{
  "instanceId": "uuid",
  "projectName": "my-project",
  "pageRoute": "/gallery",
  "componentType": "slideshow",
  "props": {
    "images": [
      {
        "id": "img-1",
        "url": "https://example.com/slide1.jpg",
        "caption": "Slide 1 description",
        "link": "https://example.com/page1"
      },
      {
        "id": "img-2",
        "url": "https://example.com/slide2.jpg",
        "caption": "Slide 2 description"
      }
    ],
    "autoplay": true,
    "interval": 5000,
    "showDots": true,
    "showArrows": true,
    "transition": "slide"
  }
}
```

## Section/Placeholder Structure

Each section in a multi-section component has:

- `id`: Unique identifier
- `type`: "text" | "image" | "button" | "container"
- `position`: `{x, y}` coordinates in pixels
- `size`: `{width, height}` in pixels
- `content`: String content (text, image URL, button label)
- `style`: Optional CSS styles object

## API Endpoints

### Save Component (POST)

```
POST /api/v2/core/components
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "projectId": "my-project",
  "componentType": "home",
  "pageRoute": "/",
  "props": { ... }
}
```

### Get Components (GET)

```
GET /api/v2/core/components?projectId=my-project
Headers:
  Authorization: Bearer <token>

Response:
{
  "version": "2.0.0",
  "data": {
    "success": true,
    "components": [
      {
        "instanceId": "uuid",
        "projectName": "my-project",
        "pageRoute": "/",
        "componentType": "header",
        "props": { ... },
        "createdAt": "2026-04-09T16:06:38.759Z",
        "updatedAt": "2026-04-09T16:06:38.759Z"
      }
    ]
  }
}
```

## Database Schema

### Components Collection

```javascript
{
  _id: ObjectId,
  instanceId: String,  // UUID
  projectName: String,
  pageRoute: String,   // e.g., "/", "/about"
  componentType: String, // "header", "footer", "home", "slideshow", etc.
  props: {
    // Component-specific data
    sections: [  // For multi-section components
      {
        id: String,
        type: String,
        position: { x: Number, y: Number },
        size: { width: Number, height: Number },
        content: String,
        style: Object
      }
    ],
    images: [String],  // For image galleries
    title: String,
    description: String,
    // ... other component properties
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Important Notes for Backend Developers

1. **Flexible Props Structure**: The `props` field should accept any JSON structure as different component types have different requirements.

2. **Position & Size**: Always store position and size as numbers (pixels). The frontend uses absolute positioning.

3. **Content Field**: The `content` field in sections can be:
   - Text content for text sections
   - Image URL for image sections
   - Button label for button sections
   - Empty string for empty placeholders

4. **Update Strategy**: When saving, either:
   - Delete all components for the project and recreate them (current implementation)
   - OR implement upsert logic using instanceId to update existing components

5. **Query by Project**: Components must be filterable by projectName/projectId.

6. **Query by Page Route**: Components should be filterable by pageRoute for multi-page websites.

## Example: Complete Project Structure

```json
{
  "projectName": "real-estate-website",
  "pages": [
    {
      "route": "/",
      "components": [
        {
          "type": "header",
          "props": { "title": "Real Estate Co", "pages": [...] }
        },
        {
          "type": "slideshow",
          "props": {
            "images": [
              {"url": "/slide1.jpg", "caption": "Luxury Homes"},
              {"url": "/slide2.jpg", "caption": "Modern Apartments"}
            ],
            "autoplay": true
          }
        },
        {
          "type": "home",
          "props": {
            "sections": [
              {"id": "1", "type": "text", "position": {"x": 20, "y": 20}, "size": {"width": 400, "height": 80}, "content": "Find your dream home"},
              {"id": "2", "type": "button", "position": {"x": 20, "y": 120}, "size": {"width": 150, "height": 45}, "content": "Browse Listings"}
            ]
          }
        },
        {
          "type": "footer",
          "props": { "title": "Real Estate Co", "copyright": "© 2026" }
        }
      ]
    }
  ]
}
```

# Backend Component Storage & Generation Guide

## Problem Summary
The generated site is showing different content than the website builder, with issues like:
- Background video not displaying
- Components out of order
- Missing content
- Different styling

## Root Causes

### 1. Component Order Not Preserved
When saving page components, the `order` field must be respected during site generation.

### 2. Props Not Passed Correctly
Background video and other page-level properties must be passed to child components.

### 3. Missing Component Templates
Each component type needs a working React component template on the backend.

---

## Data Structure Specification

### Design Object Structure

```json
{
  "projectName": "my-project",
  "theme": {
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1f2937",
    "fontFamily": "Inter",
    "darkMode": false
  },
  "pages": [
    {
      "route": "/",
      "title": "Home",
      "description": "Home page",
      "backgroundVideo": "https://youtube.com/watch?v=...",
      "backgroundImage": "https://example.com/bg.jpg",
      "components": [
        {
          "type": "Header",
          "props": {
            "title": "My Company",
            "pages": [
              { "route": "/", "title": "Home" },
              { "route": "/about", "title": "About" }
            ],
            "currentRoute": "/"
          },
          "order": 0
        },
        {
          "type": "Home",
          "props": {
            "title": "Welcome",
            "subtitle": "Hello",
            "backgroundVideo": "https://youtube.com/watch?v=..."
          },
          "order": 1
        },
        {
          "type": "Pagination",
          "props": {
            "pages": [
              { "route": "/", "title": "Home" },
              { "route": "/about", "title": "About" }
            ],
            "currentRoute": "/"
          },
          "order": 2
        }
      ]
    }
  ]
}
```

---

## Component Storage Requirements

### Component Templates Storage

Each component type must be stored with:

```json
{
  "type": "Home",
  "category": "Hero",
  "code": "export default function Home({ title, subtitle, backgroundVideo }) { ... }",
  "description": "Hero component for projects",
  "defaultProps": {},
  "projectName": "my-project"
}
```

### Component Categories

| Type | Category | File Name |
|------|----------|-----------|
| Header | Navbar | `Header.tsx` |
| Home | Hero | `Home.tsx` |
| About | Content | `About.tsx` |
| Service | Services | `Service.tsx` |
| Contact | Contact | `Contact.tsx` |
| Footer | Footer | `Footer.tsx` |
| Card | Cards | `Card.tsx` |
| Text | Content | `Text.tsx` |
| Grid | Layout | `Grid.tsx` |
| Contactform | Forms | `Contactform.tsx` |
| Pagination | Navigation | `Pagination.tsx` |
| Jobs | Jobs | `Jobs.tsx` |
| News | News | `News.tsx` |
| Rental | Rental | `Rental.tsx` |
| Chatbot | Chatbot | `Chatbot.tsx` |

---

## Critical Rules for Site Generation

### 1. Sort Components by Order

**WRONG:**
```javascript
page.components.forEach(comp => render(comp))
```

**RIGHT:**
```javascript
page.components
  .sort((a, b) => a.order - b.order)
  .forEach(comp => render(comp))
```

### 2. Pass Page-Level Props to Components

Background video MUST be passed from page to Home component:

```javascript
// Page has backgroundVideo
const page = {
  backgroundVideo: "https://...",
  components: [...]
}

// When rendering Home component
if (comp.type === 'Home' && page.backgroundVideo) {
  comp.props.backgroundVideo = page.backgroundVideo
}
```

### 3. Generate Navigation Links in Header

Header must receive all pages for navigation:

```javascript
if (comp.type === 'Header') {
  comp.props.pages = design.pages.map(p => ({
    route: p.route,
    title: p.title
  }))
  comp.props.currentRoute = page.route
}
```

### 4. Auto-Generate Pagination for Multi-Page Sites

If more than 1 page exists, add Pagination component at the end:

```javascript
if (design.pages.length > 1) {
  page.components.push({
    type: 'Pagination',
    props: {
      pages: design.pages.map(p => ({ route: p.route, title: p.title })),
      currentRoute: page.route
    },
    order: page.components.length
  })
}
```

### 5. Preserve Component Content Props

Don't drop any props - pass ALL content to component:

```javascript
// WRONG - dropping unknown props
const props = {
  title: comp.content.title,
  description: comp.content.description
}

// RIGHT - preserve all props
const props = { ...comp.content }
```

---

## Background Video Implementation

### YouTube Videos

```javascript
// Extract video ID
const getYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Embed URL
const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${videoId}&start=0&enablejsapi=0&rel=0&modestbranding=1&playsinline=1`
```

### Direct Video Files

```javascript
<video 
  src={backgroundVideo}
  autoPlay 
  muted 
  loop 
  playsInline 
  className="absolute inset-0 w-full h-full object-cover"
/>
```

### Page Background Rendering

Page-level background video should be rendered BEFORE components:

```jsx
<div className="relative min-h-screen">
  {/* Background layer */}
  {page.backgroundVideo && (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-black/40 z-10" />
      <VideoComponent url={page.backgroundVideo} />
    </div>
  )}
  
  {/* Components layer */}
  <div className="relative z-20">
    {sortedComponents.map(comp => <Component {...comp.props} />)}
  </div>
</div>
```

---

## Component Code Templates

### Header Component

```jsx
export default function Header({ title, logoUrl, pages, currentRoute }) {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      {logoUrl && <img src={logoUrl} alt="Logo" className="h-10" />}
      <h1 className="text-xl font-bold">{title}</h1>
      <nav className="space-x-4">
        {pages?.map((page) => (
          <a 
            key={page.route} 
            href={page.route}
            className={currentRoute === page.route 
              ? 'font-bold text-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
            }
          >
            {page.title}
          </a>
        ))}
      </nav>
    </header>
  )
}
```

### Home Component

```jsx
export default function Home({ title, subtitle, buttonText, backgroundVideo }) {
  return (
    <div className="relative min-h-[500px] p-8">
      {backgroundVideo && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <VideoPlayer url={backgroundVideo} />
        </div>
      )}
      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl mb-6">{subtitle}</p>
        {buttonText && (
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
```

### Pagination Component

```jsx
export default function Pagination({ pages, currentRoute }) {
  if (!pages || pages.length <= 1) return null
  
  return (
    <div className="flex justify-center items-center gap-2 p-4 bg-gray-100">
      {pages.map((page) => (
        <a
          key={page.route}
          href={page.route}
          className={`px-4 py-2 rounded-lg ${
            currentRoute === page.route 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          {page.title}
        </a>
      ))}
    </div>
  )
}
```

---

## Site Generation Algorithm

```javascript
async function generateSite(design) {
  const { projectName, pages, theme } = design
  
  for (const page of pages) {
    // 1. Sort components by order
    const sortedComponents = [...page.components]
      .sort((a, b) => a.order - b.order)
    
    // 2. Enrich component props
    const enrichedComponents = sortedComponents.map(comp => {
      const props = { ...comp.props }
      
      // Add page navigation to header
      if (comp.type === 'Header') {
        props.pages = pages.map(p => ({ route: p.route, title: p.title }))
        props.currentRoute = page.route
      }
      
      // Add background video to home
      if (comp.type === 'Home' && page.backgroundVideo) {
        props.backgroundVideo = page.backgroundVideo
      }
      
      return { ...comp, props }
    })
    
    // 3. Auto-add pagination if multiple pages
    if (pages.length > 1) {
      enrichedComponents.push({
        type: 'Pagination',
        props: {
          pages: pages.map(p => ({ route: p.route, title: p.title })),
          currentRoute: page.route
        },
        order: enrichedComponents.length
      })
    }
    
    // 4. Generate page file
    const pageContent = `
      export default function Page() {
        return (
          <div className="relative min-h-screen" style={page.backgroundImage ? { backgroundImage: \`url(\${page.backgroundImage})\` } : {}}>
            ${page.backgroundVideo ? '<PageBackgroundVideo url={page.backgroundVideo} />' : ''}
            <div className="relative z-10">
              ${enrichedComponents.map(comp => `<${comp.type} {...${JSON.stringify(comp.props)}} />`).join('\\n')}
            </div>
          </div>
        )
      }
    `
    
    // 5. Write page file
    await writeFile(`src/app${page.route}/page.tsx`, pageContent)
  }
}
```

---

## Validation Checklist

Before considering site generation complete, verify:

- [ ] All components sorted by `order` field
- [ ] Header has `pages` and `currentRoute` props
- [ ] Home has `backgroundVideo` if page has one
- [ ] Pagination added if multiple pages
- [ ] Page background video rendered at page level
- [ ] Page background image applied
- [ ] All component props preserved (no data loss)
- [ ] Component templates exist for all used types
- [ ] Generated file names are valid (no hyphens)

---

## Common Issues & Fixes

### Issue: Background video not showing
**Fix:** Pass `backgroundVideo` from page props to Home component props

### Issue: Components in wrong order
**Fix:** Sort by `order` field before rendering

### Issue: Navigation not working
**Fix:** Pass `pages` array to Header component

### Issue: Missing content
**Fix:** Use spread operator: `{ ...comp.content }` not individual fields

### Issue: Export name error with hyphens
**Fix:** Rename component types: `contact-form` → `contactform`

### Issue: Component code leaking into other components
**Fix:** Store each component template separately, don't concatenate code strings. Each component must have its own clean file.

---

## Component Code Isolation (CRITICAL)

Each component MUST be stored in a separate file. Never concatenate component codes together.

**WRONG - Code leaking:**
```javascript
// NEVER do this
const allCode = headerCode + footerCode + paginationCode
// This creates: export function Header()...export function Footer()...{!pages.length > 1
```

**RIGHT - Separate files:**
```javascript
// src/components/Header.tsx
export default function Header({...}) { ... }

// src/components/Footer.tsx  
export default function Footer({...}) { ... }

// src/components/Pagination.tsx
export default function Pagination({ pages }) {
  if (!pages || pages.length <= 1) return null
  ...
}
```

### Database Storage

Store each component as a separate document:

```javascript
// Component 1
{
  type: "Header",
  code: "export default function Header(...)"
}

// Component 2  
{
  type: "Footer",
  code: "export default function Footer(...)"
}

// Component 3
{
  type: "Pagination", 
  code: "export default function Pagination(...)"
}
```

**NOT as a single concatenated string!**

---

## File: src/components/index.ts

Must export ALL components with valid JavaScript identifiers:

```typescript
export { default as Header } from './Header'
export { default as Home } from './Home'
export { default as About } from './About'
export { default as Service } from './Service'
export { default as Contact } from './Contact'
export { default as Footer } from './Footer'
export { default as Card } from './Card'
export { default as Text } from './Text'
export { default as Grid } from './Grid'
export { default as Contactform } from './Contactform'  // NOT Contact-form
export { default as Pagination } from './Pagination'
export { default as Jobs } from './Jobs'
export { default as News } from './News'
export { default as Rental } from './Rental'
export { default as Chatbot } from './Chatbot'
```

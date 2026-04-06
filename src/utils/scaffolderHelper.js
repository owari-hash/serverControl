const fs = require('fs');
const path = require('path');

class ScaffolderEngine {
  constructor() {}

  _sanitizeType(type) {
    return type.replace(/-/g, '');
  }

  async generateSiteCode(design, projectPath) {
    console.log(`[Scaffolder] Generating schema-driven code for ${design.projectName}...`);

    this._ensureDirectories(projectPath);

    // 1. Write the entire design payload into a local JSON file so the client can import it statically.
    const designPath = path.join(projectPath, 'src', 'lib', 'design.json');
    fs.writeFileSync(designPath, JSON.stringify(design, null, 2));

    // 2. Always generate base route entrypoints
    this._generateRootPage(projectPath);
    this._generateCatchAllPage(projectPath);

    // 3. Generate static pages when explicit routes are present
    await this._generatePages(design, projectPath);

    // 4. Generate Layout & Styles
    this._generateLayout(design, projectPath);
    this._generateGlobalsCss(design, projectPath);

    console.log(`[Scaffolder] Schema-driven generation complete.`);
  }

  _ensureDirectories(projectPath) {
    const dirs = [
      path.join(projectPath, 'src', 'app'),
      path.join(projectPath, 'src', 'lib'),
      path.join(projectPath, 'src', 'components')
    ];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  async _generatePages(design, projectPath) {
    if (!design) {
      console.log('[Scaffolder] No design provided, using default generated entrypoints');
      return;
    }
    
    const { pages = [] } = design;
    
    if (!Array.isArray(pages) || pages.length === 0) {
      console.log('[Scaffolder] No pages defined in design, using generated root/catch-all pages');
      return;
    }
    
    for (const page of pages) {
      let routeDir = path.join(projectPath, 'src', 'app');
      if (page.route && page.route !== '/') {
        const subRoute = page.route.startsWith('/') ? page.route.slice(1) : page.route;
        routeDir = path.join(routeDir, subRoute);
      }
      if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });

      // In the new schema-driven engine, we just delegate parsing to CMSPage.
      // We no longer build deep nested React trees here in strings.
      
      const pageContent = `
import { CMSPage } from '@cms-builder/core';
import design from '@/lib/design.json';

export default function Page() {
  return <CMSPage design={design as any} route="${page.route}" />
}
`.trim();
      
      fs.writeFileSync(path.join(routeDir, 'page.tsx'), pageContent);
    }
  }

  _generateRootPage(projectPath) {
    const rootPagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    const rootPageContent = `
import { CMSPage } from '@cms-builder/core';
import design from '@/lib/design.json';

export default function Page() {
  return <CMSPage design={design as any} route="/" />
}
`.trim();
    fs.writeFileSync(rootPagePath, rootPageContent);
  }

  _generateCatchAllPage(projectPath) {
    const catchAllDir = path.join(projectPath, 'src', 'app', '[...slug]');
    if (!fs.existsSync(catchAllDir)) fs.mkdirSync(catchAllDir, { recursive: true });

    const catchAllPath = path.join(catchAllDir, 'page.tsx');
    const catchAllContent = `
import { CMSPage } from '@cms-builder/core';
import design from '@/lib/design.json';

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = '/' + (slug || []).join('/');
  return <CMSPage design={design as any} route={route} />
}
`.trim();
    fs.writeFileSync(catchAllPath, catchAllContent);
  }

  _generateLayout(design, projectPath) {
    const layoutPath = path.join(projectPath, 'src', 'app', 'layout.tsx');
    const layoutContent = "import './globals.css';\n\n" +
      "export default function RootLayout({ children }: { children: React.ReactNode }) {\n" +
      "  return (\n" +
      "    <html lang='en'>\n" +
      "      <body className='antialiased min-h-screen'>\n" +
      "        {children}\n" +
      "      </body>\n" +
      "    </html>\n" +
      "  );\n" +
      "}";
    fs.writeFileSync(layoutPath, layoutContent);
  }

  _generateGlobalsCss(design, projectPath) {
    const cssPath = path.join(projectPath, 'src', 'app', 'globals.css');
    const cssContent = "@import \"tailwindcss\";\n" +
      "\n@theme {\n" +
      "  --color-primary: var(--primary-color);\n" +
      "  --color-secondary: var(--secondary-color);\n" +
      "}\n";
    fs.writeFileSync(cssPath, cssContent);
  }
}

module.exports = new ScaffolderEngine();

const fs = require('fs');
const path = require('path');

class ScaffolderEngine {
  constructor() {}

  _sanitizeType(type) {
    return type.replace(/-/g, '');
  }

  _normalizeDesign(design) {
    const projectName = design?.projectName || 'generated-project';
    const theme = design?.theme || {
      primaryColor: '#3b82f6',
      secondaryColor: '#1f2937',
      fontFamily: 'Inter',
      darkMode: false
    };

    const pages = Array.isArray(design?.pages) && design.pages.length > 0
      ? design.pages
      : [
          {
            route: '/',
            title: 'Home',
            description: `${projectName} home page`,
            components: []
          }
        ];

    return {
      ...design,
      projectName,
      theme,
      pages
    };
  }

  async generateSiteCode(design, projectPath) {
    const normalizedDesign = this._normalizeDesign(design);
    console.log(`[Scaffolder] Generating schema-driven code for ${normalizedDesign.projectName}...`);

    this._ensureDirectories(projectPath);

    // 1. Write the entire design payload into a local JSON file so the client can import it statically.
    const designPath = path.join(projectPath, 'src', 'lib', 'design.json');
    fs.writeFileSync(designPath, JSON.stringify(normalizedDesign, null, 2));

    // 2. Always generate base route entrypoints
    this._generateRootPage(projectPath, normalizedDesign.projectName);
    this._generateCatchAllPage(projectPath, normalizedDesign.projectName);

    // 3. Generate static pages when explicit routes are present
    await this._generatePages(normalizedDesign, projectPath);

    // 4. Generate Layout & Styles
    this._generateLayout(normalizedDesign, projectPath);
    this._generateGlobalsCss(normalizedDesign, projectPath);

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
import { CMSPage, cmsApi } from '@cms-builder/core';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${design.projectName}';

export default async function Page() {
  const route = "${page.route}";
  const [design, instances] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold">CMS data unavailable</h1>
          <p className="mt-3 text-gray-600">
            The project exists, but design data could not be loaded yet. Check API connectivity and project naming configuration.
          </p>
        </div>
      </main>
    );
  }

  return <CMSPage design={design as any} route={route} componentInstances={instances as any} />
}
`.trim();
      
      fs.writeFileSync(path.join(routeDir, 'page.tsx'), pageContent);
    }
  }

  _generateRootPage(projectPath, projectName) {
    const rootPagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    const rootPageContent = `
import { CMSPage, cmsApi } from '@cms-builder/core';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${projectName}';

export default async function Page() {
  const route = '/';
  const [design, instances] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold">CMS data unavailable</h1>
          <p className="mt-3 text-gray-600">
            The project exists, but design data could not be loaded yet. Check API connectivity and project naming configuration.
          </p>
        </div>
      </main>
    );
  }

  return <CMSPage design={design as any} route={route} componentInstances={instances as any} />
}
`.trim();
    fs.writeFileSync(rootPagePath, rootPageContent);
  }

  _generateCatchAllPage(projectPath, projectName) {
    const catchAllDir = path.join(projectPath, 'src', 'app', '[...slug]');
    if (!fs.existsSync(catchAllDir)) fs.mkdirSync(catchAllDir, { recursive: true });

    const catchAllPath = path.join(catchAllDir, 'page.tsx');
    const catchAllContent = `
import { CMSPage, cmsApi } from '@cms-builder/core';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${projectName}';

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = '/' + (slug || []).join('/');
  const [design, instances] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold">CMS data unavailable</h1>
          <p className="mt-3 text-gray-600">
            The project exists, but design data could not be loaded yet. Check API connectivity and project naming configuration.
          </p>
        </div>
      </main>
    );
  }

  return <CMSPage design={design as any} route={route} componentInstances={instances as any} />
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
      "@source \"../node_modules/@cms-builder/core/src/**/*.{js,ts,jsx,tsx,mdx}\";\n" +
      "@source \"../node_modules/@cms-builder/core/dist/**/*.{js,ts,jsx,tsx,mjs}\";\n" +
      "\n@theme {\n" +
      "  --color-primary: var(--primary-color);\n" +
      "  --color-secondary: var(--secondary-color);\n" +
      "}\n";
    fs.writeFileSync(cssPath, cssContent);
  }
}

module.exports = new ScaffolderEngine();

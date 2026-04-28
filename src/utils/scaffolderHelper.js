const fs = require('fs');
const path = require('path');
const { BLOCK_PREVIEW_TSX } = require('./rendererTemplate');

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

    // 2. Write Local Renderer
    const componentsDir = path.join(projectPath, 'src', 'components');
    if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });
    fs.writeFileSync(path.join(componentsDir, 'BlockPreview.tsx'), BLOCK_PREVIEW_TSX);

    // 3. Always generate base route entrypoints
    this._generateRootPage(projectPath, normalizedDesign.projectName);
    this._generateCatchAllPage(projectPath, normalizedDesign.projectName);

    // 4. Generate static pages when explicit routes are present
    await this._generatePages(normalizedDesign, projectPath);

    // 5. Generate Layout & Styles
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
import { cmsApi } from '@cms-builder/core';
import { BlockPreview } from '@/components/BlockPreview';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${design.projectName}';

export default async function Page() {
  const route = "${page.route}";
  const [design, all] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) return null;

  // Reconstruct tree: children with slot='free' go into parent's props._elements
  const parents = all.filter((c: any) => !c.parentId);
  const children = all.filter((c: any) => c.parentId && c.slot === 'free');
  
  const reconstructed = parents.map((p: any) => {
    const myChildren = children
      .filter((c: any) => c.parentId === p.instanceId)
      .sort((a: any, b: any) => a.order - b.order)
      .map((c: any) => ({
        id: c.instanceId,
        type: c.componentType.replace(/^free_/, ''),
        ...c.props
      }));
      
    return {
      ...p,
      props: {
        ...p.props,
        _elements: myChildren
      }
    };
  });

  const sorted = reconstructed.sort((a: any, b: any) => a.order - b.order);

  return (
    <main>
      {sorted.map((block: any) => (
        <BlockPreview key={block.instanceId} block={block} />
      ))}
    </main>
  );
}
`.trim();
      
      fs.writeFileSync(path.join(routeDir, 'page.tsx'), pageContent);
    }
  }

  _generateRootPage(projectPath, projectName) {
    const rootPagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    const rootPageContent = `
import { cmsApi } from '@cms-builder/core';
import { BlockPreview } from '@/components/BlockPreview';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${projectName}';

export default async function Page() {
  const route = '/';
  const [design, all] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) return null;

  // Reconstruct tree: children with slot='free' go into parent's props._elements
  const parents = all.filter((c: any) => !c.parentId);
  const children = all.filter((c: any) => c.parentId && c.slot === 'free');
  
  const reconstructed = parents.map((p: any) => {
    const myChildren = children
      .filter((c: any) => c.parentId === p.instanceId)
      .sort((a: any, b: any) => a.order - b.order)
      .map((c: any) => ({
        id: c.instanceId,
        type: c.componentType.replace(/^free_/, ''),
        ...c.props
      }));
      
    return {
      ...p,
      props: {
        ...p.props,
        _elements: myChildren
      }
    };
  });

  const sorted = reconstructed.sort((a: any, b: any) => a.order - b.order);

  return (
    <main>
      {sorted.map((block: any) => (
        <BlockPreview key={block.instanceId} block={block} />
      ))}
    </main>
  );
}
`.trim();
    fs.writeFileSync(rootPagePath, rootPageContent);
  }

  _generateCatchAllPage(projectPath, projectName) {
    const catchAllDir = path.join(projectPath, 'src', 'app', '[...slug]');
    if (!fs.existsSync(catchAllDir)) fs.mkdirSync(catchAllDir, { recursive: true });

    const catchAllPath = path.join(catchAllDir, 'page.tsx');
    const catchAllContent = `
import { cmsApi } from '@cms-builder/core';
import { BlockPreview } from '@/components/BlockPreview';

const PROJECT = process.env.NEXT_PUBLIC_PROJECT_NAME || process.env.PROJECT_NAME || '${projectName}';

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = '/' + (slug || []).join('/');
  const [design, all] = await Promise.all([
    cmsApi.getSiteContent(PROJECT).catch(() => null),
    cmsApi.getPageComponents(PROJECT, route).catch(() => []),
  ]);

  if (!design) return null;

  // Reconstruct tree: children with slot='free' go into parent's props._elements
  const parents = all.filter((c: any) => !c.parentId);
  const children = all.filter((c: any) => c.parentId && c.slot === 'free');
  
  const reconstructed = parents.map((p: any) => {
    const myChildren = children
      .filter((c: any) => c.parentId === p.instanceId)
      .sort((a: any, b: any) => a.order - b.order)
      .map((c: any) => ({
        id: c.instanceId,
        type: c.componentType.replace(/^free_/, ''),
        ...c.props
      }));
      
    return {
      ...p,
      props: {
        ...p.props,
        _elements: myChildren
      }
    };
  });

  const sorted = reconstructed.sort((a: any, b: any) => a.order - b.order);

  return (
    <main>
      {sorted.map((block: any) => (
        <BlockPreview key={block.instanceId} block={block} />
      ))}
    </main>
  );
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
      "@source \"../**/*.{ts,tsx,js,jsx,mdx}\";\n" +
      "\n@theme {\n" +
      "  --color-primary: var(--primary-color);\n" +
      "  --color-secondary: var(--secondary-color);\n" +
      "}\n\n" +
      "@layer base {\n" +
      "  :root {\n" +
      "    --primary-color: #3b82f6;\n" +
      "    --secondary-color: #1f2937;\n" +
      "  }\n" +
      "}\n\n" +
      "@layer utilities {\n" +
      "  .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }\n" +
      "  .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }\n" +
      "  .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }\n" +
      "}\n\n" +
      "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n" +
      "@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }\n" +
      "@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }\n\n" +
      "html,\n" +
      "body {\n" +
      "  height: 100%;\n" +
      "  margin: 0;\n" +
      "  padding: 0;\n" +
      "  scroll-behavior: smooth;\n" +
      "}\n";
    fs.writeFileSync(cssPath, cssContent);
  }
}

module.exports = new ScaffolderEngine();

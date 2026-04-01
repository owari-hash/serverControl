const fs = require('fs');
const path = require('path');
const { ComponentLibrary } = require('./db');

class ScaffolderEngine {
  constructor() {}

  async generateSiteCode(design, projectPath) {
    console.log(`[Scaffolder] Generating dynamic code for ${design.projectName}...`);
    
    this._ensureDirectories(projectPath);

    // 1. Fetch all required components from DB
    const componentTypes = new Set(['Navbar']); // Always include Navbar
    design.pages.forEach(page => {
      page.components.forEach(comp => componentTypes.add(comp.type));
    });

    const components = await ComponentLibrary.find({ type: { $in: Array.from(componentTypes) } });
    const componentMap = new Map(components.map(c => [c.type, c.code]));

    // 2. Generate Components from DB templates
    this._generateGlobalComponents(componentMap, projectPath);

    // 3. Generate Data Fetching Library (The Dynamic Link)
    this._generateDataLib(design, projectPath);

    // 4. Generate Pages
    this._generatePages(design, projectPath);

    // 5. Generate Layout & Styles
    this._generateLayout(design, projectPath);
    this._generateGlobalsCss(design, projectPath);

    console.log(`[Scaffolder] Dynamic generation complete.`);
  }

  _ensureDirectories(projectPath) {
    const dirs = [
      path.join(projectPath, 'src', 'components'),
      path.join(projectPath, 'src', 'app'),
      path.join(projectPath, 'src', 'lib')
    ];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  _generateGlobalComponents(componentMap, projectPath) {
    const componentsDir = path.join(projectPath, 'src', 'components');
    
    for (const [type, code] of componentMap.entries()) {
      fs.writeFileSync(path.join(componentsDir, type + '.tsx'), code);
    }
  }

  _generateDataLib(design, projectPath) {
    const libDir = path.join(projectPath, 'src', 'lib');
    const content = "export async function getSiteData() {\n" +
      "  const res = await fetch('http://localhost:4000/api/sites/" + design.projectName + "/content', { cache: 'no-store' });\n" +
      "  if (!res.ok) throw new Error('Failed to fetch site data');\n" +
      "  return res.json();\n" +
      "}";
    fs.writeFileSync(path.join(libDir, 'data.ts'), content);
  }

  _generatePages(design, projectPath) {
    const appDir = path.join(projectPath, 'src', 'app');

    design.pages.forEach((page) => {
      const pageDir = page.route === '/' ? appDir : path.join(appDir, page.route);
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });

      // Identify which components this page actually needs
      const usedTypes = new Set(page.components.map(c => c.type));
      
      const imports = [
        "import Navbar from '@/components/Navbar';",
        "import { getSiteData } from '@/lib/data';"
      ];
      usedTypes.forEach(type => {
        imports.push("import " + type + " from '@/components/" + type + "';");
      });

      const pageContent = imports.join('\n') + "\n\n" +
        "export default async function Page() {\n" +
        "  const data = await getSiteData();\n" +
        "  const pageData = data.pages.find((p: any) => p.route === '" + page.route + "');\n\n" +
        "  // Map of component types to their imported React components\n" +
        "  const ComponentMap: Record<string, any> = {\n" +
        Array.from(usedTypes).map(t => "    " + t + ": " + t).join(',\n') + "\n" +
        "  };\n\n" +
        "  return (\n" +
        "    <main>\n" +
        "      <Navbar projectName={data.projectName} pages={data.pages} />\n" +
        "      {pageData.components.map((comp: any, i: number) => {\n" +
        "        const Component = ComponentMap[comp.type];\n" +
        "        return <Component key={i} {...comp.props} />;\n" +
        "      })}\n" +
        "    </main>\n" +
        "  );\n" +
        "}";

      fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageContent);
    });
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
    const cssContent = "@tailwind base;\n" +
      "@tailwind components;\n" +
      "@tailwind utilities;";
    fs.writeFileSync(cssPath, cssContent);
  }
}

module.exports = new ScaffolderEngine();

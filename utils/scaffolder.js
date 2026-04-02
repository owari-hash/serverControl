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

    // 4. Generate Master Catch-all Page
    this._generateMasterPage(design, projectPath);

    // 5. Generate Layout & Styles
    this._generateLayout(design, projectPath);
    this._generateGlobalsCss(design, projectPath);

    console.log(`[Scaffolder] Dynamic generation complete.`);
  }

  _ensureDirectories(projectPath) {
    const dirs = [
      path.join(projectPath, 'src', 'components'),
      path.join(projectPath, 'src', 'app'),
      path.join(projectPath, 'src', 'app', '[[...slug]]'),
      path.join(projectPath, 'src', 'lib')
    ];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  _generateGlobalComponents(componentMap, projectPath) {
    const componentsDir = path.join(projectPath, 'src', 'components');
    
    // Create an index file to export all components for the framework
    let indexContent = '';
    for (const [type, code] of componentMap.entries()) {
      fs.writeFileSync(path.join(componentsDir, type + '.tsx'), code);
      indexContent += `export { default as ${type} } from './${type}';\n`;
    }
    fs.writeFileSync(path.join(componentsDir, 'index.ts'), indexContent);
  }

  _generateDataLib(design, projectPath) {
    const libDir = path.join(projectPath, 'src', 'lib');
    // Content fetching is now handled by the framework service
    // but we can generate a simple re-export or config file if needed.
    // For now, we'll rely on NEXT_PUBLIC_PROJECT_NAME env variable.
  }

  _generateMasterPage(design, projectPath) {
    const pageDir = path.join(projectPath, 'src', 'app', '[[...slug]]');
    
    const pageContent = `
import { CMSPage, cms } from '@cms-builder/core';
import * as Components from '@/components';

export default async function Page({ params }: { params: { slug?: string[] } }) {
  const route = params.slug ? '/' + params.slug.join('/') : '/';
  const design = await cms.getDesign();

  return (
    <CMSPage 
      design={design} 
      componentMap={Components} 
      route={route} 
    />
  );
}
`.trim();

    fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageContent);
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

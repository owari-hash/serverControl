const { ComponentLibrary } = require('./utils/db');
const mongoose = require('mongoose');

async function seedComponents() {
  const components = [
    {
      type: 'Navbar',
      description: 'A dynamic navigation bar with theme support',
      code: `
import Link from 'next/link';

export default function Navbar({ projectName, pages, togglePosition = 'right', theme }: { projectName: string, pages: any[], togglePosition?: 'left' | 'right', theme?: any }) {
  const isDark = theme?.darkMode;
  
  return (
    <nav className={"flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors " + (togglePosition === 'left' ? 'flex-row-reverse' : 'flex-row')}>
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">{projectName}</Link>
        <div className="hidden md:flex space-x-4">
          {pages.map((page: any, i: number) => (
            <Link key={i} href={page.route} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              {page.title}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400">
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>
    </nav>
  );
}
      `
    },
    {
      type: 'Hero',
      description: 'A large hero section with theme-aware colors',
      code: `
export default function Hero({ title, subtitle, ctaText, theme }: { title: string, subtitle: string, ctaText?: string, theme?: any }) {
  return (
    <section className="py-24 text-center bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800 transition-colors">
      <h1 className="mb-6 text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
        {title}
      </h1>
      <p className="mb-10 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {subtitle}
      </p>
      {ctaText && (
        <button style={{ backgroundColor: 'var(--primary-color)' }} className="px-8 py-4 font-bold text-white rounded-xl hover:opacity-90 transition-all shadow-lg">
          {ctaText}
        </button>
      )}
    </section>
  );
}
      `
    }
  ];

  try {
    for (const comp of components) {
      await ComponentLibrary.findOneAndUpdate(
        { type: comp.type },
        comp,
        { upsert: true, new: true }
      );
    }
    console.log('Component Library with Theme support seeded successfully.');
  } catch (error) {
    console.error('Error seeding component library:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedComponents();

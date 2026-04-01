const { ComponentLibrary } = require('./utils/db');
const mongoose = require('mongoose');

async function seedComponents() {
  const components = [
    {
      type: 'Navbar',
      description: 'A dynamic navigation bar linked to site pages',
      code: `
import Link from 'next/link';

export default function Navbar({ projectName, pages }: { projectName: string, pages: any[] }) {
  return (
    <nav className="flex items-center justify-between p-6 bg-white border-b">
      <Link href="/" className="text-xl font-bold">{projectName}</Link>
      <div className="space-x-4">
        {pages.map((page, i) => (
          <Link key={i} href={page.route} className="hover:text-blue-600">
            {page.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
      `
    },
    {
      type: 'Hero',
      description: 'A large hero section with a title and CTA',
      code: `
export default function Hero({ title, subtitle, ctaText }: { title: string, subtitle: string, ctaText?: string }) {
  return (
    <section className="py-24 text-center bg-gray-50 border-b">
      <h1 className="mb-6 text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
        {title}
      </h1>
      <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto">
        {subtitle}
      </p>
      {ctaText && (
        <button className="px-8 py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
          {ctaText}
        </button>
      )}
    </section>
  );
}
      `
    },
    {
      type: 'Features',
      description: 'A grid of features with titles and descriptions',
      code: `
export default function Features({ features }: { features: any[] }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((feature, i) => (
          <div key={i} className="group p-8 border border-gray-100 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-2xl transition-all duration-300">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
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
    console.log('Component Library seeded successfully.');
  } catch (error) {
    console.error('Error seeding component library:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedComponents();

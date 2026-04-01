const { WebsiteDesign } = require('./utils/db');
const mongoose = require('mongoose');

async function seed() {
  const sampleDesign = {
    projectName: 'my-new-app7',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e293b',
      fontFamily: 'Inter',
      darkMode: false
    },
    pages: [
      {
        route: '/',
        title: 'Home',
        components: [
          {
            type: 'Hero',
            props: {
              title: 'Build Faster with AI',
              subtitle: 'Our platform generates production-ready Next.js sites from your data.',
              ctaText: 'Get Started'
            }
          },
          {
            type: 'Features',
            props: {
              features: [
                { title: 'AI Powered', description: 'Leverage modern AI to build your frontend.' },
                { title: 'Next.js 15', description: 'Built on the latest React framework.' },
                { title: 'Tailwind CSS', description: 'Beautifully styled components out of the box.' }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    await WebsiteDesign.findOneAndUpdate(
      { projectName: sampleDesign.projectName },
      sampleDesign,
      { upsert: true, new: true }
    );
    console.log('Sample design seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
}

seed();

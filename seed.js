const mongoose = require('mongoose');
const { WebsiteDesign } = require('./utils/db');
const config = require('./config');

async function seedData() {
  const projectName = 'shineapp4';
  
  const sampleDesign = {
    projectName: projectName,
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1f2937',
      fontFamily: 'Inter',
      darkMode: false
    },
    pages: [
      {
        route: '/',
        title: 'Home',
        description: 'Welcome to our CMS site',
        components: [
          { 
            type: 'Navbar', 
            props: { togglePosition: 'right' }, 
            order: 0 
          },
          { 
            type: 'Hero', 
            props: { 
              title: 'Welcome to ShineApp4', 
              subtitle: 'This content is coming live from your MongoDB database!',
              ctaText: 'Get Started'
            }, 
            order: 1 
          }
        ]
      }
    ]
  };

  try {
    await WebsiteDesign.findOneAndUpdate(
      { projectName: projectName },
      sampleDesign,
      { upsert: true, new: true }
    );
    console.log(`Database seeded successfully for project: ${projectName}`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedData();

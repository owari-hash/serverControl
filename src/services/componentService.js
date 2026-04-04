const ComponentLibrary = require('../models/ComponentLibrary');

class ComponentService {
  async getAllComponents(category, projectName) {
    const query = {
      $or: [
        { scope: 'GLOBAL' },
        { scope: 'PROJECT', projectName: projectName }
      ]
    };
    if (category) query.category = category;
    
    return await ComponentLibrary.find(query, 'type category scope projectName description updatedAt');
  }

  async getComponentByType(type, projectName) {
    const query = { type, projectName: projectName || null };
    const component = await ComponentLibrary.findOne(query);
    if (!component) throw new Error('Component not found');
    return component;
  }

  async createOrUpdateComponent(type, componentData) {
    const scope = componentData.projectName ? 'PROJECT' : 'GLOBAL';
    const component = await ComponentLibrary.findOneAndUpdate(
      { type, projectName: componentData.projectName || null },
      { ...componentData, type, scope },
      { upsert: true, new: true }
    );
    return component;
  }

  async deleteComponent(type, projectName) {
    const result = await ComponentLibrary.deleteOne({ type, projectName: projectName || null });
    if (result.deletedCount === 0) throw new Error('Component not found');
    return true;
  }
}

module.exports = new ComponentService();

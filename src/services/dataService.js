const ProjectData = require('../models/ProjectData');

class DataService {
  async getDataByProject(projectName) {
    const data = await ProjectData.find({ projectName });
    const dataObj = {};
    data.forEach(item => dataObj[item.key] = item.value);
    return dataObj;
  }

  async getSpecificData(projectName, key) {
    const data = await ProjectData.findOne({ projectName, key });
    if (!data) throw new Error('Data key not found');
    return data;
  }

  async setProjectData(projectName, key, value) {
    const data = await ProjectData.findOneAndUpdate(
      { projectName, key },
      { projectName, key, value, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    return data;
  }

  async deleteProjectData(projectName, key) {
    const result = await ProjectData.deleteOne({ projectName, key });
    if (result.deletedCount === 0) throw new Error('Data key not found');
    return true;
  }

  async clearAllProjectData(projectName) {
    return await ProjectData.deleteMany({ projectName });
  }
}

module.exports = new DataService();

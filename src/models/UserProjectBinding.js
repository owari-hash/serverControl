const mongoose = require('mongoose');

const UserProjectBindingSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  projectName: { type: String, required: true, index: true },
  roles: {
    type: [String],
    default: ['editor'],
    validate: (roles) => roles.every((r) => ['client-admin', 'editor'].includes(r))
  },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' }
}, { timestamps: true });

UserProjectBindingSchema.index({ userEmail: 1, projectName: 1 }, { unique: true });

module.exports = mongoose.model('UserProjectBinding', UserProjectBindingSchema);

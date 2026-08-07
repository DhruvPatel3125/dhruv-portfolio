import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  demo: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: ''
  },
  highlights: [{
    type: String
  }],
  imageSrc: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;

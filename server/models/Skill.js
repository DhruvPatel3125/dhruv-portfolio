import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['languages', 'frontend', 'backend', 'tools'],
    default: 'frontend'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
export default Skill;

import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true
  },
  organisation: {
    type: String,
    default: ''
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  experiences: [{
    type: String
  }],
  type: {
    type: String,
    enum: ['experience', 'education'],
    default: 'experience'
  },
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

const History = mongoose.models.History || mongoose.model('History', historySchema);
export default History;

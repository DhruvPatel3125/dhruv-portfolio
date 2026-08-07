import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema({
  about: {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    email: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    resumeUrl: { type: String, default: '' }
  },
  certifications: [{
    title: String,
    issuer: String,
    year: String,
    details: String
  }],
  accomplishments: [{
    type: String
  }]
}, {
  timestamps: true
});

const About = mongoose.models.About || mongoose.model('About', aboutSchema);
export default About;

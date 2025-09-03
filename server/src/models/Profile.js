const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema(
  {
    label: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    skills: [{ type: String, index: true }],
    links: [LinkSchema],
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    school: String,
    degree: String,
    field: String,
    startDate: String,
    endDate: String,
  },
  { _id: false }
);

const WorkSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    description: String,
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    github: String,
    linkedin: String,
    portfolio: String,
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    slug: { type: String, default: 'me', unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    education: [EducationSchema],
    skills: [{ type: String, index: true }],
    projects: [ProjectSchema],
    work: [WorkSchema],
    links: SocialLinksSchema,
  },
  { timestamps: true }
);

// Helpful text index for search
ProfileSchema.index({
  name: 'text',
  email: 'text',
  'projects.title': 'text',
  'projects.description': 'text',
  'work.company': 'text',
  'work.role': 'text',
  skills: 'text',
});

const Profile = mongoose.model('Profile', ProfileSchema);

module.exports = { Profile };


const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  gpa: { type: Number, min: 0, max: 4 },
  isCurrentlyEnrolled: { type: Boolean, default: false }
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isCurrentJob: { type: Boolean, default: false },
  technologies: [{ type: String }],
  achievements: [{ type: String }]
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['technical', 'soft', 'language', 'certification'],
    required: true 
  },
  proficiencyLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true 
  },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified'],
    default: 'unverified' 
  },
  endorsements: { type: Number, default: 0 }
});

const learningProgressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String, required: true },
  provider: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'paused'],
    default: 'not_started' 
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  startDate: { type: Date },
  completionDate: { type: Date },
  certificateUrl: { type: String },
  skillsGained: [{ type: String }]
});

const userSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, trim: true },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String }
  },
  
  // Authentication
  password: { type: String, required: true },
  
  // Professional Information
  headline: { type: String, trim: true },
  summary: { type: String, trim: true },
  careerObjective: { type: String, trim: true },
  targetJobTitle: { type: String, trim: true },
  targetIndustry: { type: String, trim: true },
  experienceLevel: { 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'entry' 
  },
  
  // Resume Data
  skills: [skillSchema],
  education: [educationSchema],
  experience: [experienceSchema],
  
  // Learning & Certifications
  learningProgress: [learningProgressSchema],
  verifiedCertifications: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Certification' 
  }],
  
  // Career Preferences
  desiredSalaryRange: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' }
  },
  workPreferences: {
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
    onsite: { type: Boolean, default: true },
    partTime: { type: Boolean, default: false },
    fullTime: { type: Boolean, default: true },
    contract: { type: Boolean, default: false }
  },
  
  // AI Analysis Results
  skillGaps: [{
    skill: { type: String },
    importance: { type: String, enum: ['low', 'medium', 'high'] },
    recommendedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
  }],
  careerPathRecommendations: [{
    title: { type: String },
    description: { type: String },
    requiredSkills: [{ type: String }],
    timeToAchieve: { type: String },
    confidence: { type: Number, min: 0, max: 1 }
  }],

  // Career Goals (used by Career Guide)
  careerGoals: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'learning' },
    targetDate: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'paused'], default: 'not_started' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    createdAt: { type: Date, default: Date.now },
    milestones: [{ type: String }],
    relatedSkills: [{ type: String }],
    measurableOutcome: { type: String }
  }],
  
  // Resume Versions
  resumeVersions: [{
    version: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    template: { type: String, default: 'modern' },
    isActive: { type: Boolean, default: false },
    customizations: {
      colors: { primary: String, secondary: String },
      fonts: { heading: String, body: String },
      layout: { type: String, enum: ['single-column', 'two-column'], default: 'single-column' }
    }
  }],
  
  // System Fields
  profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },
  lastProfileUpdate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  
  // Analytics
  analytics: {
    profileViews: { type: Number, default: 0 },
    resumeDownloads: { type: Number, default: 0 },
    jobApplications: { type: Number, default: 0 },
    courseCompletions: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to calculate profile completeness
userSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const maxScore = 100;
  
  // Basic info (30 points)
  if (this.firstName && this.lastName) score += 10;
  if (this.email) score += 5;
  if (this.phone) score += 5;
  if (this.headline) score += 5;
  if (this.summary) score += 5;
  
  // Education (20 points)
  if (this.education.length > 0) score += 20;
  
  // Experience (25 points)
  if (this.experience.length > 0) score += 25;
  
  // Skills (15 points)
  if (this.skills.length >= 5) score += 15;
  else if (this.skills.length > 0) score += 10;
  
  // Career objectives (10 points)
  if (this.targetJobTitle && this.targetIndustry) score += 10;
  
  this.profileCompleteness = Math.min(score, maxScore);
  return this.profileCompleteness;
};

// Method to get current resume version
userSchema.methods.getCurrentResumeVersion = function() {
  return this.resumeVersions.find(version => version.isActive) || this.resumeVersions[0];
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ targetJobTitle: 1, targetIndustry: 1 });
userSchema.index({ 'skills.name': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);

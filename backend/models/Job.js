const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job Basic Information
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  summary: { type: String },
  
  // Location
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    isHybrid: { type: Boolean, default: false }
  },
  
  // Job Details
  employmentType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship'],
    required: true 
  },
  experienceLevel: { 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true 
  },
  industry: { type: String, required: true },
  department: { type: String },
  
  // Compensation
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['hourly', 'daily', 'monthly', 'yearly'], default: 'yearly' },
    isNegotiable: { type: Boolean, default: true }
  },
  
  // Requirements
  requiredSkills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    isRequired: { type: Boolean, default: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  preferredSkills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] }
  }],
  
  // Education & Experience
  educationRequirements: {
    minimumDegree: { 
      type: String, 
      enum: ['none', 'high_school', 'associate', 'bachelor', 'master', 'doctorate'] 
    },
    preferredFields: [{ type: String }],
    isEducationRequired: { type: Boolean, default: true }
  },
  experienceRequirements: {
    minimumYears: { type: Number, required: true },
    preferredYears: { type: Number },
    relevantIndustries: [{ type: String }],
    specificExperience: [{ type: String }]
  },
  
  // Certifications
  requiredCertifications: [{ type: String }],
  preferredCertifications: [{ type: String }],
  
  // Company Information
  companyInfo: {
    size: { type: String, enum: ['startup', 'small', 'medium', 'large', 'enterprise'] },
    founded: { type: Number },
    website: { type: String },
    description: { type: String },
    benefits: [{ type: String }],
    culture: [{ type: String }],
    ratings: {
      glassdoor: { type: Number, min: 0, max: 5 },
      indeed: { type: Number, min: 0, max: 5 },
      linkedin: { type: Number, min: 0, max: 5 }
    }
  },
  
  // Application Details
  applicationDeadline: { type: Date },
  applicationUrl: { type: String },
  applicationInstructions: { type: String },
  contactPerson: {
    name: { type: String },
    email: { type: String },
    title: { type: String }
  },
  
  // AI-Generated Insights
  aiInsights: {
    matchScore: { type: Number, min: 0, max: 100 },
    skillMatchPercentage: { type: Number, min: 0, max: 100 },
    missingSkills: [{ type: String }],
    salaryPrediction: {
      predicted: { type: Number },
      confidence: { type: Number, min: 0, max: 1 },
      factors: [{ type: String }]
    },
    applicationTips: [{ type: String }],
    interviewPrep: [{ type: String }]
  },
  
  // Data Source
  source: {
    platform: { 
      type: String, 
      enum: ['Indeed', 'LinkedIn', 'Glassdoor', 'Monster', 'ZipRecruiter', 'Company Website', 'Other'],
      required: true 
    },
    externalId: { type: String },
    url: { type: String },
    scrapedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date }
  },
  
  // Job Status
  status: { 
    type: String, 
    enum: ['active', 'filled', 'expired', 'paused'],
    default: 'active' 
  },
  postedDate: { type: Date, required: true },
  expiryDate: { type: Date },
  
  // Engagement Metrics
  views: { type: Number, default: 0 },
  applications: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  
  // Tags and Categories
  tags: [{ type: String }],
  jobFunction: { type: String },
  workEnvironment: [{ type: String }],
  
  // Recommendation Factors
  recommendationFactors: {
    titleMatch: { type: Number, min: 0, max: 1 },
    skillsMatch: { type: Number, min: 0, max: 1 },
    locationMatch: { type: Number, min: 0, max: 1 },
    salaryMatch: { type: Number, min: 0, max: 1 },
    companyMatch: { type: Number, min: 0, max: 1 },
    overallScore: { type: Number, min: 0, max: 1 }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for job age
jobSchema.virtual('jobAge').get(function() {
  const today = new Date();
  const posted = new Date(this.postedDate);
  const diffTime = today - posted;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for salary range display
jobSchema.virtual('salaryDisplay').get(function() {
  if (!this.salary.min && !this.salary.max) return 'Not specified';
  
  const format = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };
  
  if (this.salary.min && this.salary.max) {
    return `${this.salary.currency} ${format(this.salary.min)} - ${format(this.salary.max)}`;
  }
  
  const amount = this.salary.min || this.salary.max;
  return `${this.salary.currency} ${format(amount)}+`;
});

// Method to calculate match score for a user
jobSchema.methods.calculateMatchScore = function(userProfile) {
  let totalScore = 0;
  let weights = {
    skills: 0.35,
    experience: 0.25,
    location: 0.15,
    salary: 0.15,
    education: 0.10
  };
  
  // Skills matching
  const userSkillNames = userProfile.skills.map(s => s.name.toLowerCase());
  const requiredSkillMatches = this.requiredSkills.filter(skill => 
    userSkillNames.includes(skill.name.toLowerCase())
  ).length;
  const skillsScore = Math.min(requiredSkillMatches / this.requiredSkills.length, 1);
  
  // Experience matching
  const userYears = userProfile.experience.reduce((sum, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    return sum + ((end - start) / (365 * 24 * 60 * 60 * 1000));
  }, 0);
  const experienceScore = Math.min(userYears / this.experienceRequirements.minimumYears, 1);
  
  // Location matching (simplified)
  let locationScore = 1; // Default if remote or no location preference
  if (!this.location.isRemote && userProfile.location) {
    locationScore = userProfile.location.city === this.location.city ? 1 : 0.3;
  }
  
  // Salary matching (if user has salary expectations)
  let salaryScore = 0.8; // Default neutral score
  if (userProfile.desiredSalaryRange && this.salary.min) {
    const userMin = userProfile.desiredSalaryRange.min;
    const jobMin = this.salary.min;
    salaryScore = jobMin >= userMin ? 1 : (jobMin / userMin);
  }
  
  // Education matching
  const educationLevels = {
    'none': 0, 'high_school': 1, 'associate': 2, 
    'bachelor': 3, 'master': 4, 'doctorate': 5
  };
  const userEducationLevel = Math.max(...userProfile.education.map(ed => {
    // Simplified degree mapping
    if (ed.degree.toLowerCase().includes('phd') || ed.degree.toLowerCase().includes('doctorate')) return 5;
    if (ed.degree.toLowerCase().includes('master')) return 4;
    if (ed.degree.toLowerCase().includes('bachelor')) return 3;
    if (ed.degree.toLowerCase().includes('associate')) return 2;
    return 1;
  }), 0);
  
  const requiredEducationLevel = educationLevels[this.educationRequirements.minimumDegree] || 0;
  const educationScore = userEducationLevel >= requiredEducationLevel ? 1 : 0.5;
  
  // Calculate weighted total
  totalScore = (skillsScore * weights.skills) +
               (experienceScore * weights.experience) +
               (locationScore * weights.location) +
               (salaryScore * weights.salary) +
               (educationScore * weights.education);
  
  return Math.round(totalScore * 100);
};

// Method to identify missing skills for a user
jobSchema.methods.getMissingSkills = function(userProfile) {
  const userSkillNames = userProfile.skills.map(s => s.name.toLowerCase());
  return this.requiredSkills
    .filter(skill => !userSkillNames.includes(skill.name.toLowerCase()))
    .map(skill => skill.name);
};

// Method to check if job is still active
jobSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  if (this.applicationDeadline && new Date() > this.applicationDeadline) return false;
  return true;
};

// Indexes for performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ 'location.city': 1, 'location.isRemote': 1 });
jobSchema.index({ industry: 1, experienceLevel: 1 });
jobSchema.index({ 'requiredSkills.name': 1 });
jobSchema.index({ postedDate: -1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
jobSchema.index({ 'aiInsights.matchScore': -1 });

module.exports = mongoose.model('Job', jobSchema);

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Basic Course Information
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  provider: { 
    type: String, 
    required: true,
    enum: ['Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Pluralsight', 'Khan Academy', 'FreeCodeCamp', 'Other']
  },
  providerCourseId: { type: String, required: true },
  url: { type: String, required: true },
  
  // Course Details
  category: { 
    type: String, 
    required: true,
    enum: ['Technology', 'Business', 'Design', 'Marketing', 'Data Science', 'Engineering', 'Healthcare', 'Education', 'Arts', 'Other']
  },
  subcategory: { type: String },
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true 
  },
  
  // Course Metrics
  duration: {
    hours: { type: Number, required: true },
    weeks: { type: Number }
  },
  rating: { 
    average: { type: Number, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  enrollmentCount: { type: Number, default: 0 },
  
  // Skills and Learning Outcomes
  skillsTaught: [{ 
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
  }],
  learningOutcomes: [{ type: String }],
  prerequisites: [{ type: String }],
  
  // Certification
  offersCertificate: { type: Boolean, default: false },
  certificateType: { 
    type: String, 
    enum: ['completion', 'verified', 'professional'],
    default: 'completion'
  },
  
  // Pricing
  pricing: {
    type: { type: String, enum: ['free', 'paid', 'subscription'], required: true },
    amount: { type: Number },
    currency: { type: String, default: 'USD' },
    subscriptionProvider: { type: String }
  },
  
  // Career Relevance
  careerPaths: [{ type: String }],
  jobRoles: [{ type: String }],
  industries: [{ type: String }],
  
  // Content Structure
  modules: [{
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: Number }, // in hours
    topics: [{ type: String }]
  }],
  
  // AI Recommendation Factors
  aiMetrics: {
    relevanceScore: { type: Number, min: 0, max: 1 },
    demandScore: { type: Number, min: 0, max: 1 },
    completionRate: { type: Number, min: 0, max: 1 },
    careerImpactScore: { type: Number, min: 0, max: 1 }
  },
  
  // Tracking and Analytics
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  tags: [{ type: String }],
  
  // User Interactions
  bookmarks: { type: Number, default: 0 },
  completions: { type: Number, default: 0 },
  
  // Quality Metrics
  qualityScore: { type: Number, min: 0, max: 10 },
  instructorRating: { type: Number, min: 0, max: 5 },
  contentFreshness: { type: Date },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for course popularity
courseSchema.virtual('popularityScore').get(function() {
  const enrollmentWeight = 0.4;
  const ratingWeight = 0.3;
  const completionWeight = 0.3;
  
  const normalizedEnrollment = Math.min(this.enrollmentCount / 10000, 1);
  const normalizedRating = (this.rating.average || 0) / 5;
  const normalizedCompletion = this.aiMetrics.completionRate || 0;
  
  return (normalizedEnrollment * enrollmentWeight) + 
         (normalizedRating * ratingWeight) + 
         (normalizedCompletion * completionWeight);
});

// Method to check if course is suitable for user skill level
courseSchema.methods.isSuitableForUser = function(userSkills, userExperienceLevel) {
  // Check if user has prerequisites
  const hasPrerequisites = this.prerequisites.every(prereq => 
    userSkills.some(skill => 
      skill.name.toLowerCase().includes(prereq.toLowerCase()) && 
      ['intermediate', 'advanced', 'expert'].includes(skill.proficiencyLevel)
    )
  );
  
  // Check difficulty alignment
  const difficultyMatch = {
    'entry': ['Beginner', 'Intermediate'],
    'mid': ['Intermediate', 'Advanced'],
    'senior': ['Advanced'],
    'executive': ['Advanced']
  };
  
  const isDifficultyAppropriate = difficultyMatch[userExperienceLevel]?.includes(this.difficulty);
  
  return !this.prerequisites.length || hasPrerequisites && isDifficultyAppropriate;
};

// Method to calculate recommendation score for a user
courseSchema.methods.calculateRecommendationScore = function(userProfile) {
  let score = 0;
  
  // Skills alignment (40%)
  const skillsMatch = this.skillsTaught.filter(courseSkill =>
    userProfile.skills.some(userSkill => 
      userSkill.name.toLowerCase() === courseSkill.name.toLowerCase()
    )
  ).length;
  const skillsScore = Math.min(skillsMatch / this.skillsTaught.length, 1) * 0.4;
  
  // Career path alignment (30%)
  const careerMatch = this.careerPaths.includes(userProfile.targetJobTitle) ||
                     this.jobRoles.includes(userProfile.targetJobTitle) ? 0.3 : 0;
  
  // Quality metrics (20%)
  const qualityScore = (this.qualityScore / 10) * 0.2;
  
  // Popularity (10%)
  const popularityScore = this.popularityScore * 0.1;
  
  return skillsScore + careerMatch + qualityScore + popularityScore;
};

// Indexes for performance
courseSchema.index({ provider: 1, category: 1 });
courseSchema.index({ 'skillsTaught.name': 1 });
courseSchema.index({ careerPaths: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ 'pricing.type': 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);

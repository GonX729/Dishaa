const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  // User Reference
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Certification Details
  name: { type: String, required: true, trim: true },
  provider: { 
    type: String, 
    required: true,
    enum: [
      'Microsoft', 'Google', 'Amazon', 'Cisco', 'Oracle', 'IBM', 'Salesforce',
      'Adobe', 'CompTIA', 'PMI', 'Scrum.org', 'HubSpot', 'Facebook',
      'Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Other'
    ]
  },
  certificationId: { type: String, required: true, trim: true },
  
  // Verification Details
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'failed', 'expired'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['api', 'manual', 'document_upload', 'email_verification'],
    required: true
  },
  verificationDate: { type: Date },
  verificationNotes: { type: String },
  
  // Certificate Information
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  isLifetime: { type: Boolean, default: false },
  certificateUrl: { type: String },
  credentialUrl: { type: String },
  
  // Skills and Competencies
  skillsValidated: [{
    name: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['foundational', 'associate', 'professional', 'expert'],
      required: true 
    }
  }],
  
  // Category and Type
  category: { 
    type: String, 
    required: true,
    enum: [
      'Technology', 'Project Management', 'Marketing', 'Sales', 
      'Design', 'Data Science', 'Cybersecurity', 'Cloud Computing',
      'AI/ML', 'DevOps', 'Business Analysis', 'Quality Assurance',
      'Other'
    ]
  },
  certificationType: {
    type: String,
    enum: ['professional', 'associate', 'specialist', 'expert', 'foundational'],
    required: true
  },
  
  // Exam/Assessment Details
  examDetails: {
    examCode: { type: String },
    examName: { type: String },
    passingScore: { type: Number },
    achievedScore: { type: Number },
    maxScore: { type: Number },
    examDate: { type: Date },
    examLocation: { type: String },
    proctor: { type: String }
  },
  
  // Industry Recognition
  industryRecognition: {
    isIndustryStandard: { type: Boolean, default: false },
    recognizedBy: [{ type: String }],
    marketValue: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'very_high'] 
    },
    demandLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'very_high'] 
    }
  },
  
  // Continuing Education
  requiresRenewal: { type: Boolean, default: false },
  renewalPeriod: { type: Number }, // in months
  ceuRequired: { type: Number }, // Continuing Education Units
  ceuCompleted: { type: Number, default: 0 },
  
  // Verification API Response
  apiVerificationData: {
    provider: { type: String },
    endpoint: { type: String },
    response: { type: mongoose.Schema.Types.Mixed },
    lastChecked: { type: Date },
    nextCheck: { type: Date }
  },
  
  // Badge and Display
  badgeUrl: { type: String },
  displayOnProfile: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  
  // Document Uploads (for manual verification)
  uploadedDocuments: [{
    filename: { type: String },
    originalName: { type: String },
    path: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // AI Enhancement
  aiAnalysis: {
    relevanceScore: { type: Number, min: 0, max: 1 },
    careerImpact: { type: String, enum: ['low', 'medium', 'high'] },
    skillGapsCovered: [{ type: String }],
    recommendedRoles: [{ type: String }],
    salaryImpact: { type: Number } // percentage increase
  },
  
  // Social Proof
  endorsements: [{
    endorserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endorserName: { type: String },
    relationship: { type: String },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  
  // Tracking
  isActive: { type: Boolean, default: true },
  lastModified: { type: Date, default: Date.now },
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for certification status
certificationSchema.virtual('isValid').get(function() {
  if (this.isLifetime) return true;
  if (!this.expiryDate) return true;
  return new Date() < this.expiryDate;
});

// Virtual for days until expiry
certificationSchema.virtual('daysUntilExpiry').get(function() {
  if (this.isLifetime || !this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if certification needs renewal
certificationSchema.methods.needsRenewal = function(warningDays = 90) {
  if (this.isLifetime || !this.expiryDate) return false;
  const daysUntilExpiry = this.daysUntilExpiry;
  return daysUntilExpiry !== null && daysUntilExpiry <= warningDays;
};

// Method to calculate certification value score
certificationSchema.methods.calculateValueScore = function() {
  let score = 0;
  
  // Base score from industry recognition
  const recognitionScores = {
    'very_high': 40,
    'high': 30,
    'medium': 20,
    'low': 10
  };
  score += recognitionScores[this.industryRecognition.marketValue] || 10;
  
  // Verification status bonus
  if (this.verificationStatus === 'verified') score += 20;
  
  // Provider reputation (simplified)
  const topProviders = ['Microsoft', 'Google', 'Amazon', 'Cisco', 'Oracle', 'IBM'];
  if (topProviders.includes(this.provider)) score += 15;
  
  // Recency bonus (newer certifications are more valuable)
  const monthsOld = (new Date() - new Date(this.issueDate)) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld < 12) score += 15;
  else if (monthsOld < 24) score += 10;
  else if (monthsOld < 36) score += 5;
  
  // Validity bonus
  if (this.isValid) score += 10;
  
  return Math.min(score, 100);
};

// Pre-save middleware to update lastModified
certificationSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Indexes for performance
certificationSchema.index({ userId: 1 });
certificationSchema.index({ provider: 1, certificationId: 1 });
certificationSchema.index({ verificationStatus: 1 });
certificationSchema.index({ category: 1 });
certificationSchema.index({ expiryDate: 1 });
certificationSchema.index({ isActive: 1 });
certificationSchema.index({ 'skillsValidated.name': 1 });

module.exports = mongoose.model('Certification', certificationSchema);

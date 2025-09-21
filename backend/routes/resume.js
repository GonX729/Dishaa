const express = require('express');
const User = require('../models/User');
const aiService = require('../services/aiService');
const router = express.Router();

/**
 * GET /api/resume/:userId
 * Get the latest, dynamically built resume data
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { template = 'modern', format = 'json' } = req.query;

    const user = await User.findById(userId)
      .populate('verifiedCertifications')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get current resume version or create default
    let currentVersion = user.getCurrentResumeVersion();
    if (!currentVersion) {
      currentVersion = {
        version: 'v1.0',
        createdAt: new Date(),
        template: template,
        isActive: true,
        customizations: {
          colors: { primary: '#2563eb', secondary: '#64748b' },
          fonts: { heading: 'Inter', body: 'Inter' },
          layout: 'single-column'
        }
      };
      user.resumeVersions.push(currentVersion);
      await user.save();
    }

    // Build dynamic resume data
    const resumeData = {
      metadata: {
        version: currentVersion.version,
        template: currentVersion.template,
        generatedAt: new Date().toISOString(),
        lastUpdated: user.lastProfileUpdate,
        completeness: user.profileCompleteness
      },
      personalInfo: {
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        headline: user.headline,
        summary: user.summary,
        careerObjective: user.careerObjective
      },
      professionalSummary: generateProfessionalSummary(user),
      skills: {
        technical: user.skills.filter(s => s.category === 'technical'),
        soft: user.skills.filter(s => s.category === 'soft'),
        languages: user.skills.filter(s => s.category === 'language'),
        certifications: user.skills.filter(s => s.category === 'certification'),
        verified: user.skills.filter(s => s.verificationStatus === 'verified')
      },
      experience: user.experience.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
      education: user.education.sort((a, b) => new Date(b.endDate || new Date()) - new Date(a.endDate || new Date())),
      certifications: user.verifiedCertifications.map(cert => ({
        name: cert.name,
        provider: cert.provider,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        isLifetime: cert.isLifetime,
        credentialUrl: cert.credentialUrl,
        skills: cert.skillsValidated
      })),
      projects: generateProjectsSection(user),
      achievements: generateAchievements(user),
      customizations: currentVersion.customizations,
      analytics: {
        profileViews: user.analytics.profileViews,
        resumeDownloads: user.analytics.resumeDownloads,
        jobApplications: user.analytics.jobApplications
      }
    };

    // Apply template-specific formatting if requested
    if (format === 'formatted') {
      resumeData.formatted = applyTemplateFormatting(resumeData, template);
    }

    // Update analytics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'analytics.profileViews': 1 }
    });

    res.status(200).json({
      success: true,
      data: resumeData
    });

  } catch (error) {
    console.error('Resume retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resume data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/resume/export/:userId
 * Trigger a PDF/DOCX export of the resume
 */
router.get('/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'pdf', template = 'modern' } = req.query;

    if (!['pdf', 'docx', 'html'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export format. Supported: pdf, docx, html'
      });
    }

    const user = await User.findById(userId)
      .populate('verifiedCertifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // For this implementation, we'll return a download URL
    // In production, this would generate actual PDF/DOCX files
    const exportData = {
      downloadUrl: `/api/resume/download/${userId}?format=${format}&template=${template}`,
      fileName: `${user.firstName}_${user.lastName}_Resume.${format}`,
      fileSize: '245 KB', // Mock file size
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      template: template,
      format: format
    };

    // Update analytics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'analytics.resumeDownloads': 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Resume export prepared successfully',
      data: exportData
    });

  } catch (error) {
    console.error('Resume export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/resume/:userId/optimize
 * Optimize resume for ATS using AI service
 */
router.post('/:userId/optimize', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetJob, jobDescription } = req.body;

    if (!targetJob) {
      return res.status(400).json({
        success: false,
        error: 'Target job title is required for optimization'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Use AI service to optimize resume
    const optimizationResults = await aiService.optimizeResumeForATS(
      {
        personalInfo: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          location: user.location
        },
        summary: user.summary,
        skills: user.skills,
        experience: user.experience,
        education: user.education
      },
      jobDescription || `Position: ${targetJob}`
    );

    // Generate skill gap analysis
    const skillGapAnalysis = await aiService.analyzeSkillGaps(
      user.skills,
      targetJob
    );

    const optimizationReport = {
      targetJob,
      atsScore: optimizationResults.atsScore,
      overallReadiness: skillGapAnalysis.overallReadiness,
      optimizations: optimizationResults.optimizations,
      keywordSuggestions: optimizationResults.keywordSuggestions,
      formatRecommendations: optimizationResults.formatRecommendations,
      skillGaps: skillGapAnalysis.skillGaps,
      prioritySkills: skillGapAnalysis.prioritySkills,
      estimatedTimeToReadiness: skillGapAnalysis.estimatedTimeToReadiness,
      recommendedActions: [
        ...generateATSRecommendations(optimizationResults),
        ...generateSkillRecommendations(skillGapAnalysis)
      ],
      generatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Resume optimization completed',
      data: optimizationReport
    });

  } catch (error) {
    console.error('Resume optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/resume/:userId/template
 * Update resume template and customizations
 */
router.put('/:userId/template', async (req, res) => {
  try {
    const { userId } = req.params;
    const { template, customizations } = req.body;

    const availableTemplates = ['modern', 'classic', 'minimal', 'creative', 'executive'];
    if (template && !availableTemplates.includes(template)) {
      return res.status(400).json({
        success: false,
        error: `Invalid template. Available: ${availableTemplates.join(', ')}`
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Deactivate current active version
    user.resumeVersions.forEach(version => {
      version.isActive = false;
    });

    // Create new version
    const newVersion = {
      version: `v${user.resumeVersions.length + 1}.0`,
      createdAt: new Date(),
      template: template || 'modern',
      isActive: true,
      customizations: {
        colors: customizations?.colors || { primary: '#2563eb', secondary: '#64748b' },
        fonts: customizations?.fonts || { heading: 'Inter', body: 'Inter' },
        layout: customizations?.layout || 'single-column'
      }
    };

    user.resumeVersions.push(newVersion);
    user.lastProfileUpdate = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Resume template updated successfully',
      data: {
        newVersion,
        totalVersions: user.resumeVersions.length
      }
    });

  } catch (error) {
    console.error('Resume template update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resume template',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/resume/:userId/versions
 * Get all resume versions for a user
 */
router.get('/:userId/versions', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('resumeVersions');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const versions = user.resumeVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: {
        versions,
        totalVersions: versions.length,
        activeVersion: versions.find(v => v.isActive)
      }
    });

  } catch (error) {
    console.error('Resume versions retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resume versions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/resume/templates
 * Get available resume templates
 */
router.get('/templates/available', async (req, res) => {
  try {
    const templates = [
      {
        id: 'modern',
        name: 'Modern',
        description: 'Clean, contemporary design with subtle colors',
        preview: '/templates/modern-preview.png',
        features: ['ATS-friendly', 'Clean layout', 'Professional'],
        colors: { primary: '#2563eb', secondary: '#64748b' },
        suitableFor: ['Technology', 'Startup', 'Creative']
      },
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional, professional layout',
        preview: '/templates/classic-preview.png',
        features: ['Conservative design', 'High compatibility', 'Traditional'],
        colors: { primary: '#1f2937', secondary: '#6b7280' },
        suitableFor: ['Finance', 'Law', 'Government']
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple, clean design focusing on content',
        preview: '/templates/minimal-preview.png',
        features: ['Minimalist', 'Content-focused', 'Easy to read'],
        colors: { primary: '#000000', secondary: '#666666' },
        suitableFor: ['Design', 'Research', 'Academia']
      },
      {
        id: 'creative',
        name: 'Creative',
        description: 'Unique design with creative elements',
        preview: '/templates/creative-preview.png',
        features: ['Creative layout', 'Visual elements', 'Stand out'],
        colors: { primary: '#7c3aed', secondary: '#a855f7' },
        suitableFor: ['Creative', 'Marketing', 'Design']
      },
      {
        id: 'executive',
        name: 'Executive',
        description: 'Sophisticated design for senior positions',
        preview: '/templates/executive-preview.png',
        features: ['Executive style', 'Professional', 'Leadership'],
        colors: { primary: '#dc2626', secondary: '#991b1b' },
        suitableFor: ['Executive', 'Management', 'Leadership']
      }
    ];

    res.status(200).json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    console.error('Templates retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions

function generateProfessionalSummary(user) {
  if (user.summary) return user.summary;

  const experience = user.experience.length;
  const topSkills = user.skills
    .filter(s => s.category === 'technical')
    .slice(0, 3)
    .map(s => s.name);

  const industries = [...new Set(user.experience.map(exp => exp.company))];

  return `${user.experienceLevel} professional with ${experience}+ years of experience in ${topSkills.join(', ')}. Proven track record in ${industries.slice(0, 2).join(' and ')} with strong focus on ${user.targetJobTitle || 'software development'}.`;
}

function generateProjectsSection(user) {
  // Extract projects from experience descriptions
  const projects = user.experience.flatMap(exp => 
    exp.achievements?.map(achievement => ({
      title: `${exp.company} Project`,
      description: achievement,
      technologies: exp.technologies || [],
      company: exp.company,
      period: `${exp.startDate} - ${exp.endDate || 'Present'}`
    })) || []
  );

  return projects.slice(0, 5); // Top 5 projects
}

function generateAchievements(user) {
  const achievements = [];

  // From certifications
  const verifiedCerts = user.verifiedCertifications?.length || 0;
  if (verifiedCerts > 0) {
    achievements.push(`${verifiedCerts} verified professional certifications`);
  }

  // From course completions
  const completedCourses = user.analytics.courseCompletions || 0;
  if (completedCourses > 0) {
    achievements.push(`Completed ${completedCourses} professional development courses`);
  }

  // From skills
  const expertSkills = user.skills.filter(s => s.proficiencyLevel === 'expert').length;
  if (expertSkills > 0) {
    achievements.push(`Expert-level proficiency in ${expertSkills} technologies`);
  }

  return achievements;
}

function applyTemplateFormatting(resumeData, template) {
  // This would apply template-specific formatting
  // For now, return a simple formatted structure
  return {
    header: {
      name: resumeData.personalInfo.fullName,
      contact: [
        resumeData.personalInfo.email,
        resumeData.personalInfo.phone,
        `${resumeData.personalInfo.location.city}, ${resumeData.personalInfo.location.state}`
      ].filter(Boolean)
    },
    sections: [
      {
        title: 'Professional Summary',
        content: resumeData.professionalSummary
      },
      {
        title: 'Skills',
        content: resumeData.skills.technical.map(s => s.name).join(', ')
      },
      {
        title: 'Experience',
        content: resumeData.experience.map(exp => ({
          title: exp.position,
          company: exp.company,
          period: `${exp.startDate} - ${exp.endDate || 'Present'}`,
          description: exp.description
        }))
      }
    ]
  };
}

function generateATSRecommendations(optimizationResults) {
  return optimizationResults.optimizations.map(opt => ({
    type: 'ats_optimization',
    section: opt.section,
    priority: 'medium',
    action: opt.reason,
    original: opt.original,
    suggested: opt.suggested
  }));
}

function generateSkillRecommendations(skillGapAnalysis) {
  return skillGapAnalysis.prioritySkills.map(skill => ({
    type: 'skill_development',
    priority: skill.priority,
    action: `Learn ${skill.name} to improve job readiness`,
    estimatedTime: skill.estimatedTime || '4-6 weeks',
    impact: 'high'
  }));
}

module.exports = router;

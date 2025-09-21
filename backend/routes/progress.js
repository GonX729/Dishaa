const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Certification = require('../models/Certification');
const aiService = require('../services/aiService');
const router = express.Router();

/**
 * GET /api/progress/:userId
 * Provide a comprehensive progress dashboard overview
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('verifiedCertifications')
      .populate('learningProgress.courseId');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate overall progress metrics
    const progressMetrics = calculateProgressMetrics(user);
    
    // Get learning progress details
    const learningProgress = await calculateLearningProgress(user);
    
    // Get skill development progress
    const skillProgress = calculateSkillProgress(user);
    
    // Get career readiness score
    const careerReadiness = await calculateCareerReadiness(user);
    
    // Get recent achievements
    const recentAchievements = getRecentAchievements(user);
    
    // Get upcoming deadlines and reminders
    const upcomingItems = getUpcomingItems(user);
    
    // Generate recommendations for next steps
    const recommendations = await generateProgressRecommendations(user);

    const dashboardData = {
      overview: {
        profileCompleteness: user.profileCompleteness,
        careerReadinessScore: careerReadiness.overallScore,
        totalSkills: user.skills.length,
        verifiedCertifications: user.verifiedCertifications.length,
        coursesCompleted: user.analytics.courseCompletions,
        coursesInProgress: learningProgress.coursesInProgress,
        lastActivity: user.lastProfileUpdate
      },
      progressMetrics,
      learningProgress,
      skillProgress,
      careerReadiness,
      recentAchievements,
      upcomingItems,
      recommendations,
      analytics: {
        profileViews: user.analytics.profileViews,
        resumeDownloads: user.analytics.resumeDownloads,
        jobApplications: user.analytics.jobApplications,
        weeklyProgress: generateWeeklyProgress(user)
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Progress dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve progress dashboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/progress/:userId/skills
 * Get detailed skill progression analysis
 */
router.get('/:userId/skills', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, timeframe = '6months' } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Filter skills by category if specified
    let skills = user.skills;
    if (category) {
      skills = skills.filter(skill => skill.category === category);
    }

    // Group skills by proficiency level
    const skillsByLevel = {
      beginner: skills.filter(s => s.proficiencyLevel === 'beginner'),
      intermediate: skills.filter(s => s.proficiencyLevel === 'intermediate'),
      advanced: skills.filter(s => s.proficiencyLevel === 'advanced'),
      expert: skills.filter(s => s.proficiencyLevel === 'expert')
    };

    // Calculate skill progression trends
    const progressionTrends = calculateSkillProgressionTrends(user, timeframe);

    // Get skill gaps analysis
    const targetRole = user.targetJobTitle || 'Software Developer';
    const skillGapAnalysis = await aiService.analyzeSkillGaps(user.skills, targetRole);

    // Generate skill development roadmap
    const developmentRoadmap = generateSkillDevelopmentRoadmap(skillGapAnalysis);

    res.status(200).json({
      success: true,
      data: {
        skillsByLevel,
        progressionTrends,
        skillGapAnalysis,
        developmentRoadmap,
        statistics: {
          totalSkills: skills.length,
          verifiedSkills: skills.filter(s => s.verificationStatus === 'verified').length,
          skillsWithEndorsements: skills.filter(s => s.endorsements > 0).length,
          averageEndorsements: skills.reduce((sum, s) => sum + s.endorsements, 0) / skills.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Skill progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve skill progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/progress/:userId/learning
 * Get detailed learning progress and course analytics
 */
router.get('/:userId/learning', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get detailed learning progress
    const learningStats = {
      coursesCompleted: user.learningProgress.filter(p => p.status === 'completed').length,
      coursesInProgress: user.learningProgress.filter(p => p.status === 'in_progress').length,
      coursesNotStarted: user.learningProgress.filter(p => p.status === 'not_started').length,
      totalEnrolled: user.learningProgress.length,
      averageProgress: user.learningProgress.reduce((sum, p) => sum + p.progress, 0) / user.learningProgress.length || 0
    };

    // Calculate learning velocity
    const learningVelocity = calculateLearningVelocity(user);

    // Get course completion timeline
    const completionTimeline = user.learningProgress
      .filter(p => p.completionDate)
      .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))
      .map(p => ({
        courseName: p.courseName,
        provider: p.provider,
        completionDate: p.completionDate,
        skillsGained: p.skillsGained,
        timeToComplete: calculateTimeToComplete(p.startDate, p.completionDate)
      }));

    // Get learning streaks and patterns
    const learningPatterns = analyzeLearningPatterns(user);

    // Get recommended next courses
    const nextCourseRecommendations = await aiService.recommendCourses(
      user.skills,
      user.targetJobTitle || 'Software Developer',
      { limit: 5 }
    );

    res.status(200).json({
      success: true,
      data: {
        learningStats,
        learningVelocity,
        completionTimeline,
        learningPatterns,
        nextCourseRecommendations,
        currentProgress: user.learningProgress.filter(p => p.status === 'in_progress')
      }
    });

  } catch (error) {
    console.error('Learning progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve learning progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/progress/:userId/goals
 * Set learning and career goals
 */
router.post('/:userId/goals', async (req, res) => {
  try {
    const { userId } = req.params;
    const { goals } = req.body;

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Goals array is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate and format goals
    const formattedGoals = goals.map(goal => ({
      id: goal.id || Date.now().toString(),
      title: goal.title,
      description: goal.description,
      category: goal.category || 'skill',
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
      priority: goal.priority || 'medium',
      status: goal.status || 'not_started',
      progress: goal.progress || 0,
      createdAt: new Date(),
      milestones: goal.milestones || [],
      relatedSkills: goal.relatedSkills || [],
      measurableOutcome: goal.measurableOutcome
    }));

    // Add goals to user profile (extending the schema conceptually)
    user.careerGoals = formattedGoals;
    user.lastProfileUpdate = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Goals set successfully',
      data: {
        goals: formattedGoals,
        totalGoals: formattedGoals.length
      }
    });

  } catch (error) {
    console.error('Set goals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set goals',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/progress/:userId/timeline
 * Get career development timeline
 */
router.get('/:userId/timeline', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'all' } = req.query;

    const user = await User.findById(userId)
      .populate('verifiedCertifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build comprehensive timeline
    const timelineEvents = [];

    // Add profile creation
    timelineEvents.push({
      date: user.createdAt,
      type: 'profile_created',
      title: 'Profile Created',
      description: 'Started career development journey',
      category: 'milestone'
    });

    // Add work experience
    user.experience.forEach(exp => {
      timelineEvents.push({
        date: exp.startDate,
        type: 'job_started',
        title: `Started at ${exp.company}`,
        description: `${exp.position} - ${exp.company}`,
        category: 'experience',
        details: {
          company: exp.company,
          position: exp.position,
          technologies: exp.technologies
        }
      });

      if (exp.endDate) {
        timelineEvents.push({
          date: exp.endDate,
          type: 'job_ended',
          title: `Left ${exp.company}`,
          description: `Completed role as ${exp.position}`,
          category: 'experience'
        });
      }
    });

    // Add education
    user.education.forEach(edu => {
      timelineEvents.push({
        date: edu.startDate,
        type: 'education_started',
        title: `Started ${edu.degree}`,
        description: `${edu.degree} in ${edu.field} at ${edu.institution}`,
        category: 'education'
      });

      if (edu.endDate) {
        timelineEvents.push({
          date: edu.endDate,
          type: 'education_completed',
          title: `Graduated`,
          description: `Completed ${edu.degree} in ${edu.field}`,
          category: 'education'
        });
      }
    });

    // Add certifications
    user.verifiedCertifications.forEach(cert => {
      timelineEvents.push({
        date: cert.issueDate,
        type: 'certification_earned',
        title: `Earned ${cert.name}`,
        description: `${cert.name} certification from ${cert.provider}`,
        category: 'certification',
        details: {
          provider: cert.provider,
          skills: cert.skillsValidated
        }
      });
    });

    // Add course completions
    user.learningProgress
      .filter(p => p.completionDate)
      .forEach(course => {
        timelineEvents.push({
          date: course.completionDate,
          type: 'course_completed',
          title: `Completed ${course.courseName}`,
          description: `Finished course from ${course.provider}`,
          category: 'learning',
          details: {
            provider: course.provider,
            skillsGained: course.skillsGained
          }
        });
      });

    // Sort timeline by date (most recent first)
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by timeframe if specified
    let filteredEvents = timelineEvents;
    if (timeframe !== 'all') {
      const cutoffDate = new Date();
      switch (timeframe) {
        case '1year':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
        case '6months':
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
          break;
        case '3months':
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
      }
      filteredEvents = timelineEvents.filter(event => new Date(event.date) >= cutoffDate);
    }

    res.status(200).json({
      success: true,
      data: {
        timeline: filteredEvents,
        statistics: {
          totalEvents: filteredEvents.length,
          byCategory: filteredEvents.reduce((acc, event) => {
            acc[event.category] = (acc[event.category] || 0) + 1;
            return acc;
          }, {})
        },
        timeframe
      }
    });

  } catch (error) {
    console.error('Timeline retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve timeline',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions

function calculateProgressMetrics(user) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    profileCompleteness: {
      current: user.profileCompleteness,
      target: 100,
      change: '+5%' // Mock change
    },
    skillsDeveloped: {
      current: user.skills.length,
      target: user.targetJobTitle ? getTargetSkillsCount(user.targetJobTitle) : 20,
      recentlyAdded: user.skills.filter(s => new Date(s.createdAt || user.createdAt) > thirtyDaysAgo).length
    },
    certificationsEarned: {
      current: user.verifiedCertifications.length,
      target: 3,
      recentlyEarned: 0 // Would need to track certification dates
    },
    coursesProgress: {
      completed: user.analytics.courseCompletions,
      inProgress: user.learningProgress.filter(p => p.status === 'in_progress').length,
      averageProgress: user.learningProgress.reduce((sum, p) => sum + p.progress, 0) / user.learningProgress.length || 0
    }
  };
}

async function calculateLearningProgress(user) {
  const coursesInProgress = user.learningProgress.filter(p => p.status === 'in_progress');
  const coursesCompleted = user.learningProgress.filter(p => p.status === 'completed');

  return {
    coursesInProgress: coursesInProgress.length,
    coursesCompleted: coursesCompleted.length,
    totalHoursLearned: coursesCompleted.length * 25, // Estimate 25 hours per course
    currentCourses: coursesInProgress.map(course => ({
      name: course.courseName,
      provider: course.provider,
      progress: course.progress,
      startDate: course.startDate,
      estimatedCompletion: estimateCompletionDate(course)
    })),
    recentCompletions: coursesCompleted
      .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))
      .slice(0, 3)
  };
}

function calculateSkillProgress(user) {
  const skillsByCategory = user.skills.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const skillLevelCounts = user.skills.reduce((acc, skill) => {
    acc[skill.proficiencyLevel] = (acc[skill.proficiencyLevel] || 0) + 1;
    return acc;
  }, {});

  return {
    totalSkills: user.skills.length,
    skillsByCategory,
    skillLevelDistribution: skillLevelCounts,
    verifiedSkills: user.skills.filter(s => s.verificationStatus === 'verified').length,
    topSkills: user.skills
      .filter(s => s.proficiencyLevel === 'expert' || s.proficiencyLevel === 'advanced')
      .slice(0, 5)
  };
}

async function calculateCareerReadiness(user) {
  const targetRole = user.targetJobTitle || 'Software Developer';
  const skillGapAnalysis = await aiService.analyzeSkillGaps(user.skills, targetRole);

  return {
    overallScore: skillGapAnalysis.overallReadiness,
    skillAlignment: Math.max(100 - (skillGapAnalysis.skillGaps.length * 10), 0),
    experienceLevel: calculateExperienceScore(user.experience),
    profileCompleteness: user.profileCompleteness,
    certificationStrength: user.verifiedCertifications.length * 20,
    areas: {
      strong: ['Technical Skills', 'Education'],
      needsImprovement: skillGapAnalysis.prioritySkills.map(s => s.name).slice(0, 3)
    }
  };
}

function getRecentAchievements(user) {
  const achievements = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Recent course completions
  const recentCompletions = user.learningProgress.filter(p => 
    p.completionDate && new Date(p.completionDate) > thirtyDaysAgo
  );

  recentCompletions.forEach(course => {
    achievements.push({
      type: 'course_completion',
      title: `Completed ${course.courseName}`,
      date: course.completionDate,
      details: `Finished course from ${course.provider}`
    });
  });

  // Profile updates
  if (new Date(user.lastProfileUpdate) > thirtyDaysAgo) {
    achievements.push({
      type: 'profile_update',
      title: 'Updated Profile',
      date: user.lastProfileUpdate,
      details: 'Enhanced profile information'
    });
  }

  return achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getUpcomingItems(user) {
  const upcoming = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Certification renewals
  user.verifiedCertifications.forEach(cert => {
    if (cert.expiryDate && new Date(cert.expiryDate) <= thirtyDaysFromNow) {
      upcoming.push({
        type: 'certification_renewal',
        title: `${cert.name} Renewal`,
        dueDate: cert.expiryDate,
        priority: 'high',
        action: 'Schedule renewal'
      });
    }
  });

  // Course deadlines (mock data)
  user.learningProgress
    .filter(p => p.status === 'in_progress')
    .forEach(course => {
      const estimatedCompletion = estimateCompletionDate(course);
      if (estimatedCompletion <= thirtyDaysFromNow) {
        upcoming.push({
          type: 'course_deadline',
          title: `Complete ${course.courseName}`,
          dueDate: estimatedCompletion,
          priority: 'medium',
          action: 'Continue learning'
        });
      }
    });

  return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

async function generateProgressRecommendations(user) {
  const recommendations = [];

  // Profile completeness
  if (user.profileCompleteness < 80) {
    recommendations.push({
      type: 'profile_improvement',
      priority: 'high',
      title: 'Complete Your Profile',
      description: 'Add missing information to reach 80% completeness',
      estimatedTime: '15 minutes',
      impact: 'Increases visibility to employers'
    });
  }

  // Skill gaps
  try {
    const skillGapAnalysis = await aiService.analyzeSkillGaps(
      user.skills,
      user.targetJobTitle || 'Software Developer'
    );

    if (skillGapAnalysis.prioritySkills.length > 0) {
      recommendations.push({
        type: 'skill_development',
        priority: 'high',
        title: `Learn ${skillGapAnalysis.prioritySkills[0].name}`,
        description: `Essential skill for ${user.targetJobTitle || 'your target role'}`,
        estimatedTime: '4-6 weeks',
        impact: 'Improves job readiness significantly'
      });
    }
  } catch (error) {
    console.warn('Failed to generate skill recommendations:', error);
  }

  // Learning momentum
  const activeCourses = user.learningProgress.filter(p => p.status === 'in_progress');
  if (activeCourses.length === 0) {
    recommendations.push({
      type: 'learning_momentum',
      priority: 'medium',
      title: 'Start a New Course',
      description: 'Maintain learning momentum with a new course',
      estimatedTime: '2-4 weeks',
      impact: 'Continuous skill development'
    });
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

function calculateLearningVelocity(user) {
  const completedCourses = user.learningProgress.filter(p => p.completionDate);
  const last90Days = completedCourses.filter(p => 
    new Date(p.completionDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );

  return {
    coursesCompletedLast90Days: last90Days.length,
    averageTimeToComplete: '3.5 weeks', // Mock calculation
    learningStreak: calculateLearningStreak(user),
    velocity: last90Days.length > 0 ? 'High' : 'Low'
  };
}

function analyzeLearningPatterns(user) {
  // Mock learning pattern analysis
  return {
    preferredDays: ['Monday', 'Wednesday', 'Saturday'],
    averageSessionLength: '45 minutes',
    completionRate: 85,
    dropoffStage: 'Mid-course',
    preferredProviders: ['Coursera', 'edX'],
    learningStyle: 'Visual learner'
  };
}

function generateWeeklyProgress(user) {
  // Generate mock weekly progress data
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    
    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      coursesCompleted: Math.floor(Math.random() * 2),
      skillsAdded: Math.floor(Math.random() * 3),
      hoursLearned: Math.floor(Math.random() * 10 + 5),
      profileViews: Math.floor(Math.random() * 20 + 5)
    });
  }
  return weeks;
}

// Additional helper functions
function getTargetSkillsCount(jobTitle) {
  const skillCounts = {
    'Software Developer': 15,
    'Data Scientist': 18,
    'DevOps Engineer': 20,
    'Product Manager': 12
  };
  return skillCounts[jobTitle] || 15;
}

function estimateCompletionDate(course) {
  const startDate = new Date(course.startDate);
  const daysToComplete = Math.ceil((100 - course.progress) / 100 * 30); // Estimate 30 days for 100%
  const estimatedDate = new Date(startDate.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
  return estimatedDate;
}

function calculateExperienceScore(experience) {
  const totalYears = experience.reduce((sum, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    return sum + ((end - start) / (365 * 24 * 60 * 60 * 1000));
  }, 0);

  return Math.min(totalYears * 20, 100); // Max 100 for 5+ years
}

function calculateTimeToComplete(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
}

function calculateLearningStreak(user) {
  // Mock calculation - in real implementation, track daily learning activities
  return Math.floor(Math.random() * 30) + 1;
}

function generateSkillDevelopmentRoadmap(skillGapAnalysis) {
  return skillGapAnalysis.prioritySkills.map((skill, index) => ({
    step: index + 1,
    skill: skill.name,
    priority: skill.priority,
    estimatedTime: `${2 + index} weeks`,
    resources: ['Online Course', 'Practice Projects', 'Certification'],
    prerequisites: index > 0 ? [skillGapAnalysis.prioritySkills[index - 1].name] : [],
    difficulty: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)]
  }));
}

function calculateSkillProgressionTrends(user, timeframe) {
  // Mock trend calculation
  const trends = [];
  const categories = ['technical', 'soft', 'language'];
  
  categories.forEach(category => {
    const skillsInCategory = user.skills.filter(s => s.category === category);
    trends.push({
      category,
      skillCount: skillsInCategory.length,
      growth: '+' + Math.floor(Math.random() * 5 + 1),
      trend: ['up', 'stable', 'down'][Math.floor(Math.random() * 3)]
    });
  });
  
  return trends;
}

module.exports = router;

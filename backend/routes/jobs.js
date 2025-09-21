const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const aiService = require('../services/aiService');
const router = express.Router();

/**
 * GET /api/jobs/recommendations/:userId
 * Get personalized job recommendations based on user profile
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      location, 
      remote = false, 
      salaryMin, 
      salaryMax,
      employmentType,
      experienceLevel,
      industry,
      limit = 20,
      page = 1
    } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build search criteria based on user profile and filters
    const searchCriteria = { status: 'active' };

    // Apply filters
    if (location && remote !== 'true') {
      searchCriteria.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') },
        { 'location.isRemote': true }
      ];
    } else if (remote === 'true') {
      searchCriteria['location.isRemote'] = true;
    }

    if (employmentType) {
      searchCriteria.employmentType = employmentType;
    }

    if (experienceLevel) {
      searchCriteria.experienceLevel = experienceLevel;
    } else {
      // Use user's experience level
      searchCriteria.experienceLevel = user.experienceLevel;
    }

    if (industry) {
      searchCriteria.industry = industry;
    } else if (user.targetIndustry) {
      searchCriteria.industry = user.targetIndustry;
    }

    if (salaryMin || salaryMax || user.desiredSalaryRange) {
      const minSalary = salaryMin || user.desiredSalaryRange?.min;
      const maxSalary = salaryMax || user.desiredSalaryRange?.max;
      
      if (minSalary) {
        searchCriteria['salary.min'] = { $gte: parseInt(minSalary) };
      }
      if (maxSalary) {
        searchCriteria['salary.max'] = { $lte: parseInt(maxSalary) };
      }
    }

    // Find matching jobs
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let jobs = await Job.find(searchCriteria)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ postedDate: -1 });

    // Use AI service to enhance recommendations
    const resumeData = {
      personalInfo: {
        fullName: user.fullName,
        location: user.location
      },
      skills: user.skills,
      experience: user.experience,
      education: user.education
    };

    const aiRecommendations = await aiService.recommendJobs(resumeData, {
      location: location || user.location?.city,
      salaryMin: salaryMin || user.desiredSalaryRange?.min,
      remote: remote === 'true'
    });

    // Enhance database jobs with AI insights
    const enhancedJobs = jobs.map(job => {
      const aiJob = aiRecommendations.find(ai => 
        ai.title.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])
      ) || aiRecommendations[0]; // Fallback to first AI recommendation

      const matchScore = job.calculateMatchScore(user);
      const missingSkills = job.getMissingSkills(user);

      return {
        id: job._id,
        title: job.title,
        company: job.company,
        location: {
          city: job.location.city,
          state: job.location.state,
          country: job.location.country,
          isRemote: job.location.isRemote,
          isHybrid: job.location.isHybrid
        },
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        industry: job.industry,
        salary: job.salaryDisplay,
        salaryRange: {
          min: job.salary.min,
          max: job.salary.max,
          currency: job.salary.currency
        },
        description: job.description.substring(0, 300) + '...',
        requiredSkills: job.requiredSkills.slice(0, 5),
        preferredSkills: job.preferredSkills.slice(0, 3),
        postedDate: job.postedDate,
        applicationDeadline: job.applicationDeadline,
        applicationUrl: job.applicationUrl,
        
        // AI-enhanced insights
        matchScore,
        matchReasons: aiJob?.matchReasons || [`Skills match: ${Math.floor(matchScore * 0.8)}%`],
        missingSkills,
        applicationTips: aiJob?.applicationTips || [
          'Highlight relevant experience in your application',
          'Customize your resume for this specific role'
        ],
        salaryInsights: aiJob?.salaryInsights || {
          comparison: 'Competitive salary for this role',
          negotiationTips: ['Research market rates', 'Highlight unique skills']
        },
        companyInsights: aiJob?.companyInsights || {
          size: job.companyInfo?.size || 'Unknown',
          rating: job.companyInfo?.ratings?.glassdoor || 0,
          benefits: job.companyInfo?.benefits || []
        },
        
        // Job metadata
        isActive: job.isActive(),
        jobAge: job.jobAge,
        applicationCount: job.applications,
        source: job.source.platform
      };
    });

    // Sort by match score
    enhancedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Calculate recommendation statistics
    const stats = {
      totalJobs: await Job.countDocuments(searchCriteria),
      averageMatchScore: enhancedJobs.reduce((sum, job) => sum + job.matchScore, 0) / enhancedJobs.length || 0,
      highMatchJobs: enhancedJobs.filter(job => job.matchScore >= 80).length,
      remoteJobs: enhancedJobs.filter(job => job.location.isRemote).length,
      newJobs: enhancedJobs.filter(job => job.jobAge <= 7).length
    };

    // Generate job search insights
    const insights = generateJobSearchInsights(user, enhancedJobs);

    res.status(200).json({
      success: true,
      data: {
        jobs: enhancedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(stats.totalJobs / parseInt(limit)),
          totalJobs: stats.totalJobs,
          hasNextPage: parseInt(page) * parseInt(limit) < stats.totalJobs
        },
        statistics: stats,
        insights,
        filters: {
          location,
          remote: remote === 'true',
          salaryMin,
          salaryMax,
          employmentType,
          experienceLevel,
          industry
        }
      }
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job recommendations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/jobs/search
 * Search jobs with advanced filters
 */
router.get('/search', async (req, res) => {
  try {
    const {
      query,
      location,
      remote,
      salaryMin,
      salaryMax,
      employmentType,
      experienceLevel,
      industry,
      company,
      skills,
      postedSince,
      page = 1,
      limit = 20,
      sortBy = 'postedDate'
    } = req.query;

    // Build search criteria
    const searchCriteria = { status: 'active' };

    // Text search
    if (query) {
      searchCriteria.$text = { $search: query };
    }

    // Location filter
    if (location) {
      if (remote === 'true') {
        searchCriteria['location.isRemote'] = true;
      } else {
        searchCriteria.$or = [
          { 'location.city': new RegExp(location, 'i') },
          { 'location.state': new RegExp(location, 'i') },
          { 'location.isRemote': true }
        ];
      }
    }

    // Salary range
    if (salaryMin) {
      searchCriteria['salary.min'] = { $gte: parseInt(salaryMin) };
    }
    if (salaryMax) {
      searchCriteria['salary.max'] = { $lte: parseInt(salaryMax) };
    }

    // Employment type
    if (employmentType) {
      searchCriteria.employmentType = employmentType;
    }

    // Experience level
    if (experienceLevel) {
      searchCriteria.experienceLevel = experienceLevel;
    }

    // Industry
    if (industry) {
      searchCriteria.industry = industry;
    }

    // Company
    if (company) {
      searchCriteria.company = new RegExp(company, 'i');
    }

    // Skills
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      searchCriteria['requiredSkills.name'] = { $in: skillArray };
    }

    // Posted date filter
    if (postedSince) {
      const daysAgo = parseInt(postedSince);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      searchCriteria.postedDate = { $gte: cutoffDate };
    }

    // Sorting
    let sortCriteria = {};
    switch (sortBy) {
      case 'postedDate':
        sortCriteria = { postedDate: -1 };
        break;
      case 'salary':
        sortCriteria = { 'salary.min': -1 };
        break;
      case 'title':
        sortCriteria = { title: 1 };
        break;
      case 'company':
        sortCriteria = { company: 1 };
        break;
      default:
        sortCriteria = { postedDate: -1 };
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.find(searchCriteria)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortCriteria);

    const totalJobs = await Job.countDocuments(searchCriteria);

    // Format job results
    const formattedJobs = jobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: {
        city: job.location.city,
        state: job.location.state,
        isRemote: job.location.isRemote,
        isHybrid: job.location.isHybrid
      },
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      industry: job.industry,
      salary: job.salaryDisplay,
      postedDate: job.postedDate,
      jobAge: job.jobAge,
      requiredSkills: job.requiredSkills.slice(0, 5),
      applicationUrl: job.applicationUrl,
      source: job.source.platform
    }));

    res.status(200).json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalJobs / parseInt(limit)),
          totalJobs,
          hasNextPage: parseInt(page) * parseInt(limit) < totalJobs,
          hasPrevPage: parseInt(page) > 1
        },
        searchCriteria: {
          query,
          location,
          remote: remote === 'true',
          salaryRange: { min: salaryMin, max: salaryMax },
          filters: { employmentType, experienceLevel, industry, company }
        }
      }
    });

  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search jobs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get detailed information about a specific job
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    let jobDetails = {
      id: job._id,
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      industry: job.industry,
      salary: job.salary,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      educationRequirements: job.educationRequirements,
      experienceRequirements: job.experienceRequirements,
      requiredCertifications: job.requiredCertifications,
      preferredCertifications: job.preferredCertifications,
      companyInfo: job.companyInfo,
      applicationDeadline: job.applicationDeadline,
      applicationUrl: job.applicationUrl,
      applicationInstructions: job.applicationInstructions,
      contactPerson: job.contactPerson,
      postedDate: job.postedDate,
      source: job.source,
      isActive: job.isActive(),
      jobAge: job.jobAge
    };

    // If userId provided, add personalized insights
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const matchScore = job.calculateMatchScore(user);
        const missingSkills = job.getMissingSkills(user);
        
        jobDetails.personalizedInsights = {
          matchScore,
          missingSkills,
          skillsMatch: job.requiredSkills.filter(required =>
            user.skills.some(userSkill => 
              userSkill.name.toLowerCase() === required.name.toLowerCase()
            )
          ),
          recommendedActions: generatePersonalizedActions(job, user, matchScore),
          salaryComparison: compareSalaryToExpectations(job.salary, user.desiredSalaryRange),
          applicationTips: generateApplicationTips(job, user)
        };
      }
    }

    // Update view count
    await Job.findByIdAndUpdate(jobId, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: jobDetails
    });

  } catch (error) {
    console.error('Job detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve job details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/jobs/:jobId/apply/:userId
 * Track job application (doesn't actually apply, just records intent)
 */
router.post('/:jobId/apply/:userId', async (req, res) => {
  try {
    const { jobId, userId } = req.params;
    const { applicationNotes } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update analytics
    await Job.findByIdAndUpdate(jobId, { $inc: { applications: 1 } });
    await User.findByIdAndUpdate(userId, { $inc: { 'analytics.jobApplications': 1 } });

    // In a real application, you might store application history
    const applicationRecord = {
      jobId,
      userId,
      appliedAt: new Date(),
      applicationNotes,
      jobTitle: job.title,
      company: job.company,
      applicationUrl: job.applicationUrl
    };

    res.status(200).json({
      success: true,
      message: 'Application tracked successfully',
      data: {
        applicationRecord,
        redirectUrl: job.applicationUrl,
        nextSteps: [
          'Complete the application on the company website',
          'Follow up within a week',
          'Update your application status in the dashboard'
        ]
      }
    });

  } catch (error) {
    console.error('Job application tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track job application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/jobs/:jobId/save/:userId
 * Save job for later viewing
 */
router.post('/:jobId/save/:userId', async (req, res) => {
  try {
    const { jobId, userId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add to saved jobs (conceptually extending user schema)
    // In a real implementation, you'd have a savedJobs array in the user schema
    
    // Update job saves count
    await Job.findByIdAndUpdate(jobId, { $inc: { saves: 1 } });

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: {
        jobId,
        title: job.title,
        company: job.company,
        savedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/jobs/market/insights
 * Get job market insights and trends
 */
router.get('/market/insights', async (req, res) => {
  try {
    const { industry, location, experienceLevel } = req.query;

    // Build aggregation pipeline for market insights
    const matchCriteria = { status: 'active' };
    if (industry) matchCriteria.industry = industry;
    if (location) {
      matchCriteria.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') }
      ];
    }
    if (experienceLevel) matchCriteria.experienceLevel = experienceLevel;

    // Salary insights
    const salaryInsights = await Job.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$experienceLevel',
          avgSalaryMin: { $avg: '$salary.min' },
          avgSalaryMax: { $avg: '$salary.max' },
          jobCount: { $sum: 1 }
        }
      },
      { $sort: { avgSalaryMin: -1 } }
    ]);

    // Skills demand
    const skillsDemand = await Job.aggregate([
      { $match: matchCriteria },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          demand: { $sum: 1 },
          avgSalary: { $avg: '$salary.min' }
        }
      },
      { $sort: { demand: -1 } },
      { $limit: 20 }
    ]);

    // Industry trends
    const industryTrends = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$industry',
          jobCount: { $sum: 1 },
          avgSalary: { $avg: '$salary.min' },
          companiesHiring: { $addToSet: '$company' }
        }
      },
      {
        $project: {
          industry: '$_id',
          jobCount: 1,
          avgSalary: 1,
          companiesCount: { $size: '$companiesHiring' }
        }
      },
      { $sort: { jobCount: -1 } },
      { $limit: 10 }
    ]);

    // Remote work trends
    const remoteStats = await Job.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          remoteJobs: {
            $sum: { $cond: ['$location.isRemote', 1, 0] }
          },
          hybridJobs: {
            $sum: { $cond: ['$location.isHybrid', 1, 0] }
          }
        }
      }
    ]);

    const remotePercentage = remoteStats[0] ? 
      (remoteStats[0].remoteJobs / remoteStats[0].totalJobs * 100).toFixed(1) : 0;

    // Recent job postings trend
    const recentTrend = await Job.aggregate([
      {
        $match: {
          status: 'active',
          postedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$postedDate' }
          },
          jobsPosted: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const insights = {
      salaryInsights,
      topSkills: skillsDemand,
      industryTrends,
      remoteWorkStats: {
        remotePercentage: parseFloat(remotePercentage),
        totalJobs: remoteStats[0]?.totalJobs || 0,
        remoteJobs: remoteStats[0]?.remoteJobs || 0,
        hybridJobs: remoteStats[0]?.hybridJobs || 0
      },
      marketTrends: {
        jobPostingTrend: recentTrend,
        growth: 'Stable', // Mock calculation
        competitiveness: 'Moderate', // Mock calculation
        outlook: 'Positive' // Mock calculation
      },
      recommendations: generateMarketRecommendations(skillsDemand, salaryInsights)
    };

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve market insights',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions

function generateJobSearchInsights(user, jobs) {
  const insights = [];

  // Match score insights
  const avgMatchScore = jobs.reduce((sum, job) => sum + job.matchScore, 0) / jobs.length;
  if (avgMatchScore < 70) {
    insights.push({
      type: 'skill_gap',
      message: 'Consider developing additional skills to improve job matches',
      priority: 'high'
    });
  }

  // Location insights
  const remoteJobs = jobs.filter(job => job.location.isRemote).length;
  if (remoteJobs > jobs.length * 0.5) {
    insights.push({
      type: 'remote_opportunity',
      message: `${remoteJobs} remote positions available in your field`,
      priority: 'medium'
    });
  }

  // Salary insights
  const jobsWithSalary = jobs.filter(job => job.salaryRange.min);
  if (jobsWithSalary.length > 0) {
    const avgSalary = jobsWithSalary.reduce((sum, job) => sum + job.salaryRange.min, 0) / jobsWithSalary.length;
    const userMin = user.desiredSalaryRange?.min;
    
    if (userMin && avgSalary > userMin * 1.1) {
      insights.push({
        type: 'salary_opportunity',
        message: `Market salaries are ${Math.round((avgSalary / userMin - 1) * 100)}% higher than your target`,
        priority: 'medium'
      });
    }
  }

  return insights;
}

function generatePersonalizedActions(job, user, matchScore) {
  const actions = [];

  if (matchScore < 60) {
    actions.push({
      type: 'skill_development',
      action: 'Develop missing skills before applying',
      priority: 'high'
    });
  } else if (matchScore < 80) {
    actions.push({
      type: 'skill_enhancement',
      action: 'Strengthen existing skills to improve match',
      priority: 'medium'
    });
  }

  if (!user.verifiedCertifications?.length && job.requiredCertifications?.length > 0) {
    actions.push({
      type: 'certification',
      action: 'Consider getting relevant certifications',
      priority: 'medium'
    });
  }

  actions.push({
    type: 'application',
    action: 'Tailor your resume to highlight relevant experience',
    priority: 'high'
  });

  return actions;
}

function compareSalaryToExpectations(jobSalary, userExpectations) {
  if (!userExpectations || !jobSalary.min) return null;

  const jobMin = jobSalary.min;
  const userMin = userExpectations.min;
  const userMax = userExpectations.max;

  if (jobMin >= userMin && (!userMax || jobMin <= userMax)) {
    return { status: 'matches', message: 'Salary aligns with your expectations' };
  } else if (jobMin < userMin) {
    const diff = Math.round(((userMin - jobMin) / userMin) * 100);
    return { 
      status: 'below', 
      message: `Salary is ${diff}% below your minimum expectation`,
      suggestion: 'Consider negotiating or look for additional benefits'
    };
  } else {
    const diff = Math.round(((jobMin - userMax) / userMax) * 100);
    return { 
      status: 'above', 
      message: `Salary is ${diff}% above your maximum expectation`,
      suggestion: 'Great opportunity for salary growth'
    };
  }
}

function generateApplicationTips(job, user) {
  const tips = [];

  // Skill-based tips
  const matchingSkills = job.requiredSkills.filter(required =>
    user.skills.some(userSkill => 
      userSkill.name.toLowerCase() === required.name.toLowerCase()
    )
  );

  if (matchingSkills.length > 0) {
    tips.push(`Highlight your experience with ${matchingSkills.slice(0, 3).map(s => s.name).join(', ')}`);
  }

  // Experience-based tips
  const relevantExperience = user.experience.filter(exp =>
    exp.position.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])
  );

  if (relevantExperience.length > 0) {
    tips.push(`Emphasize your ${relevantExperience[0].position} experience at ${relevantExperience[0].company}`);
  }

  // General tips
  tips.push('Customize your cover letter to address the specific job requirements');
  tips.push('Research the company culture and mention relevant aspects in your application');

  return tips;
}

function generateMarketRecommendations(skillsDemand, salaryInsights) {
  const recommendations = [];

  // Top skills recommendation
  if (skillsDemand.length > 0) {
    recommendations.push({
      type: 'skill_demand',
      title: `Learn ${skillsDemand[0]._id}`,
      description: `High demand skill with ${skillsDemand[0].demand} job openings`,
      impact: 'high'
    });
  }

  // Salary optimization
  const highestPayingLevel = salaryInsights.reduce((max, level) => 
    level.avgSalaryMin > max.avgSalaryMin ? level : max, 
    salaryInsights[0] || {}
  );

  if (highestPayingLevel._id) {
    recommendations.push({
      type: 'career_level',
      title: `Target ${highestPayingLevel._id} positions`,
      description: `Average salary: $${Math.round(highestPayingLevel.avgSalaryMin / 1000)}K`,
      impact: 'medium'
    });
  }

  return recommendations;
}

module.exports = router;

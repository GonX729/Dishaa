const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const aiService = require('../services/aiService');
const router = express.Router();

/**
 * GET /api/courses/recommendations/:userId
 * Get personalized course recommendations based on user's skills and career goals
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      careerPath, 
      difficulty, 
      limit = 10, 
      provider,
      category,
      freeOnly 
    } = req.query;

    // Fetch user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Use AI service to get course recommendations
    const targetCareerPath = careerPath || user.targetJobTitle || 'Software Developer';
    const recommendations = await aiService.recommendCourses(
      user.skills,
      targetCareerPath,
      { 
        limit: parseInt(limit),
        difficulty,
        provider,
        category,
        freeOnly: freeOnly === 'true'
      }
    );

    // Analyze skill gaps for better recommendations
    const skillGapAnalysis = await aiService.analyzeSkillGaps(
      user.skills,
      targetCareerPath
    );

    // Filter courses from database that match AI recommendations
    const courseQuery = {};
    if (provider) courseQuery.provider = provider;
    if (category) courseQuery.category = category;
    if (difficulty) courseQuery.difficulty = difficulty;
    if (freeOnly === 'true') courseQuery['pricing.type'] = 'free';

    const dbCourses = await Course.find(courseQuery)
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, enrollmentCount: -1 });

    // Combine AI recommendations with database courses
    const combinedRecommendations = recommendations.map((aiRec, index) => {
      const dbCourse = dbCourses[index];
      return {
        id: dbCourse?._id || `ai-rec-${index}`,
        title: aiRec.title,
        provider: aiRec.provider,
        description: dbCourse?.description || `Learn ${aiRec.title} to advance your career in ${targetCareerPath}`,
        duration: aiRec.duration || dbCourse?.duration?.hours,
        rating: aiRec.rating || dbCourse?.rating?.average,
        url: dbCourse?.url || '#',
        difficulty: aiRec.difficulty || dbCourse?.difficulty,
        pricing: dbCourse?.pricing || { type: 'paid', amount: 49, currency: 'USD' },
        relevanceScore: aiRec.relevanceScore,
        reason: aiRec.reason,
        estimatedImpact: aiRec.estimatedImpact,
        skillsGained: aiRec.skillsGained,
        timeToComplete: aiRec.timeToComplete,
        isRecommendedForGaps: skillGapAnalysis.prioritySkills.some(gap => 
          aiRec.skillsGained.some(skill => 
            skill.toLowerCase().includes(gap.name.toLowerCase())
          )
        )
      };
    });

    // Track recommendation generation for analytics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'analytics.profileViews': 1 }
    });

    res.status(200).json({
      success: true,
      data: {
        recommendations: combinedRecommendations,
        skillGapAnalysis,
        filters: {
          careerPath: targetCareerPath,
          difficulty,
          provider,
          category,
          freeOnly
        },
        metadata: {
          totalRecommendations: combinedRecommendations.length,
          avgRelevanceScore: (combinedRecommendations.reduce((sum, rec) => 
            sum + rec.relevanceScore, 0) / combinedRecommendations.length).toFixed(2),
          userSkillsCount: user.skills.length,
          prioritySkillGaps: skillGapAnalysis.prioritySkills.length
        }
      }
    });

  } catch (error) {
    console.error('Course recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate course recommendations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/courses/search
 * Search courses with filters
 */
router.get('/search', async (req, res) => {
  try {
    const {
      query,
      provider,
      category,
      difficulty,
      minRating,
      maxPrice,
      freeOnly,
      page = 1,
      limit = 20
    } = req.query;

    // Build search criteria
    const searchCriteria = { isActive: true };

    if (query) {
      searchCriteria.$text = { $search: query };
    }

    if (provider) {
      searchCriteria.provider = provider;
    }

    if (category) {
      searchCriteria.category = category;
    }

    if (difficulty) {
      searchCriteria.difficulty = difficulty;
    }

    if (minRating) {
      searchCriteria['rating.average'] = { $gte: parseFloat(minRating) };
    }

    if (freeOnly === 'true') {
      searchCriteria['pricing.type'] = 'free';
    } else if (maxPrice) {
      searchCriteria['pricing.amount'] = { $lte: parseFloat(maxPrice) };
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const courses = await Course.find(searchCriteria)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, enrollmentCount: -1 });

    const totalCourses = await Course.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalCourses / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCourses,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          query,
          provider,
          category,
          difficulty,
          minRating,
          maxPrice,
          freeOnly
        }
      }
    });

  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search courses',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/courses/:courseId
 * Get detailed information about a specific course
 */
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { course }
    });

  } catch (error) {
    console.error('Course retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve course',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/courses/:courseId/enroll/:userId
 * Enroll user in a course (track learning progress)
 */
router.post('/:courseId/enroll/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = user.learningProgress.find(
      progress => progress.courseId.toString() === courseId
    );

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'User already enrolled in this course'
      });
    }

    // Add course to user's learning progress
    const newProgress = {
      courseId: course._id,
      courseName: course.title,
      provider: course.provider,
      status: 'not_started',
      progress: 0,
      startDate: new Date(),
      skillsGained: []
    };

    user.learningProgress.push(newProgress);
    await user.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        enrollment: newProgress,
        totalEnrollments: user.learningProgress.length
      }
    });

  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in course',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/courses/:courseId/progress/:userId
 * Update course progress for a user
 */
router.put('/:courseId/progress/:userId', async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const { progress, status, skillsGained } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be between 0 and 100'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find the course progress entry
    const progressEntry = user.learningProgress.find(
      p => p.courseId.toString() === courseId
    );

    if (!progressEntry) {
      return res.status(404).json({
        success: false,
        error: 'Course enrollment not found'
      });
    }

    // Update progress
    progressEntry.progress = progress;
    if (status) progressEntry.status = status;
    if (skillsGained) progressEntry.skillsGained = skillsGained;

    // Mark as completed if progress is 100%
    if (progress === 100) {
      progressEntry.status = 'completed';
      progressEntry.completionDate = new Date();
      
      // Update analytics
      user.analytics.courseCompletions += 1;
    }

    await user.save();

    // Update course completion count if course is completed
    if (progress === 100) {
      await Course.findByIdAndUpdate(courseId, {
        $inc: { completions: 1 }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course progress updated successfully',
      data: {
        progress: progressEntry,
        isCompleted: progress === 100
      }
    });

  } catch (error) {
    console.error('Course progress update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update course progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/courses/categories
 * Get available course categories and providers
 */
router.get('/metadata/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category');
    const providers = await Course.distinct('provider');
    const difficulties = await Course.distinct('difficulty');

    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
          totalEnrollments: { $sum: '$enrollmentCount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories: categories.sort(),
        providers: providers.sort(),
        difficulties: difficulties.sort(),
        statistics: stats[0] || {
          totalCourses: 0,
          avgRating: 0,
          totalEnrollments: 0
        }
      }
    });

  } catch (error) {
    console.error('Course metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve course metadata',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

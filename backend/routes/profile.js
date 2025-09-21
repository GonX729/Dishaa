const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log(`File upload attempt: ${file.originalname}, mimetype: ${file.mimetype}, extname: ${path.extname(file.originalname)}`);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    console.log(`File rejected: ${file.originalname} - Invalid file type`);
    cb(new Error(`Invalid file type. Only PDF, DOC, and DOCX files are allowed. Received: ${file.mimetype}`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

/**
 * POST /api/profile/upload
 * Handle resume upload and parse it using AI service
 */
router.post('/upload', auth, (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.'
        });
      }
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }

    console.log(`Processing resume upload: ${req.file.filename}`);

    // Parse the resume using AI service
    const parsedData = await aiService.parseResume(req.file);

    // Get the authenticated user
    const userId = req.user.userId;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user profile with parsed data
    user = await User.findByIdAndUpdate(
      userId,
      {
        firstName: parsedData.personalInfo.name.split(' ')[0] || user.firstName,
        lastName: parsedData.personalInfo.name.split(' ').slice(1).join(' ') || user.lastName,
        phone: parsedData.personalInfo.phone || user.phone,
        location: parsedData.personalInfo.location ? {
          city: parsedData.personalInfo.location.split(',')[0]?.trim(),
          state: parsedData.personalInfo.location.split(',')[1]?.trim(),
          country: 'USA'
        } : user.location,
        summary: parsedData.summary || user.summary,
        skills: parsedData.skills ? parsedData.skills.map(skill => ({
          name: skill.name,
          category: skill.category,
          proficiencyLevel: skill.level,
          verificationStatus: 'unverified'
        })) : user.skills,
        experience: parsedData.experience ? parsedData.experience.map(exp => ({
          company: exp.company,
          position: exp.position,
          description: exp.description,
          startDate: new Date(exp.startDate),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          isCurrentJob: !exp.endDate,
          technologies: exp.technologies || []
        })) : user.experience,
        education: parsedData.education ? parsedData.education.map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: new Date(edu.startDate),
          endDate: new Date(edu.endDate),
          isCurrentlyEnrolled: false
        })) : user.education,
        lastProfileUpdate: new Date()
      },
      { new: true, runValidators: true }
    );

    // Calculate profile completeness
    user.calculateCompleteness();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: {
        userId: user._id,
        profileCompleteness: user.profileCompleteness,
        parsedData: {
          ...parsedData,
          userId: user._id
        },
        warnings: parsedData.warnings || []
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process resume upload',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/profile/:userId
 * Retrieve a user's complete profile
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findById(userId)
      .populate('verifiedCertifications')
      .select('-__v');

    if (!user) {
      // Return empty profile structure for new users
      return res.status(200).json({
        success: true,
        data: {
          profile: {
            _id: userId,
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: { city: '', state: '', country: '' },
            headline: '',
            summary: '',
            targetJobTitle: '',
            targetIndustry: '',
            experienceLevel: 'entry',
            skills: [],
            experience: [],
            education: [],
            profileCompleteness: 0,
            lastProfileUpdate: new Date()
          },
          profileCompleteness: 0,
          lastUpdated: new Date()
        }
      });
    }

    // Update profile completeness
    user.calculateCompleteness();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        profileCompleteness: user.profileCompleteness,
        lastUpdated: user.lastProfileUpdate
      }
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/profile/:userId
 * Update user profile information
 */
router.put('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    let user = await User.findById(userId);
    
    if (!user) {
      // Create new user if it doesn't exist
      user = new User({
        _id: userId,
        ...updateData,
        lastProfileUpdate: new Date()
      });
      await user.save();
    } else {
      // Update existing user
      user = await User.findByIdAndUpdate(
        userId,
        {
          ...updateData,
          lastProfileUpdate: new Date()
        },
        { new: true, runValidators: true }
      );
    }

    // Recalculate profile completeness
    user.calculateCompleteness();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: user,
        profileCompleteness: user.profileCompleteness
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/profile/:userId/skills
 * Add new skills to user profile
 */
router.post('/:userId/skills', async (req, res) => {
  try {
    const { userId } = req.params;
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Skills array is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Add new skills, avoiding duplicates
    const existingSkillNames = user.skills.map(s => s.name.toLowerCase());
    const newSkills = skills.filter(skill => 
      !existingSkillNames.includes(skill.name.toLowerCase())
    );

    user.skills.push(...newSkills);
    user.lastProfileUpdate = new Date();
    
    // Recalculate profile completeness
    user.calculateCompleteness();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Added ${newSkills.length} new skills`,
      data: {
        addedSkills: newSkills,
        totalSkills: user.skills.length,
        profileCompleteness: user.profileCompleteness
      }
    });

  } catch (error) {
    console.error('Add skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add skills',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/profile/:userId
 * Delete user profile (soft delete)
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deactivated successfully'
    });

  } catch (error) {
    console.error('Profile deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

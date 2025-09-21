const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Certification = require('../models/Certification');
const aiService = require('../services/aiService');
const router = express.Router();

// Configure multer for certification document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certifications/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * POST /api/certifications/verify
 * Submit a certification for verification
 */
router.post('/verify', upload.array('documents', 3), async (req, res) => {
  try {
    const {
      userId,
      name,
      provider,
      certificationId,
      issueDate,
      expiryDate,
      isLifetime,
      verificationMethod,
      credentialUrl,
      category,
      certificationType,
      skillsValidated
    } = req.body;

    // Validate required fields
    if (!userId || !name || !provider || !certificationId || !issueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, name, provider, certificationId, issueDate'
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

    // Check if certification already exists for this user
    const existingCert = await Certification.findOne({
      userId,
      provider,
      certificationId
    });

    if (existingCert) {
      return res.status(400).json({
        success: false,
        error: 'Certification already exists for this user'
      });
    }

    // Process uploaded documents
    const uploadedDocuments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date()
    })) : [];

    // Parse skills validated from JSON string if provided
    let parsedSkillsValidated = [];
    if (skillsValidated) {
      try {
        parsedSkillsValidated = JSON.parse(skillsValidated);
      } catch (error) {
        console.warn('Failed to parse skillsValidated JSON:', error);
      }
    }

    // Create certification record
    const certification = new Certification({
      userId,
      name,
      provider,
      certificationId,
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isLifetime: isLifetime === 'true',
      verificationMethod: verificationMethod || 'document_upload',
      credentialUrl,
      category: category || 'Technology',
      certificationType: certificationType || 'professional',
      skillsValidated: parsedSkillsValidated,
      uploadedDocuments,
      verificationStatus: 'pending'
    });

    await certification.save();

    // Attempt automatic verification using AI service
    try {
      const verificationResult = await aiService.verifyCertification(
        provider,
        certificationId,
        {
          holderName: user.fullName,
          issueDate,
          expiryDate
        }
      );

      // Update certification with verification result
      certification.verificationStatus = verificationResult.status;
      certification.verificationDate = new Date();
      certification.verificationNotes = verificationResult.error?.message || 'Automated verification completed';
      certification.apiVerificationData = {
        provider: verificationResult.provider,
        response: verificationResult,
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      await certification.save();

      // If verified, add to user's verified certifications
      if (verificationResult.status === 'verified') {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { verifiedCertifications: certification._id }
        });
      }

    } catch (verificationError) {
      console.warn('Automated verification failed:', verificationError);
      certification.verificationNotes = 'Automated verification failed, manual review required';
      await certification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Certification submitted for verification',
      data: {
        certification,
        verificationStatus: certification.verificationStatus,
        estimatedReviewTime: certification.verificationStatus === 'pending' ? '2-3 business days' : 'Completed'
      }
    });

  } catch (error) {
    console.error('Certification verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit certification for verification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/certifications/user/:userId
 * Get all certifications for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, provider, category } = req.query;

    // Build query filters
    const query = { userId };
    if (status) query.verificationStatus = status;
    if (provider) query.provider = provider;
    if (category) query.category = category;

    const certifications = await Certification.find(query)
      .sort({ verificationDate: -1, createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: certifications.length,
      verified: certifications.filter(c => c.verificationStatus === 'verified').length,
      pending: certifications.filter(c => c.verificationStatus === 'pending').length,
      failed: certifications.filter(c => c.verificationStatus === 'failed').length,
      expired: certifications.filter(c => !c.isValid).length
    };

    // Group by provider
    const byProvider = certifications.reduce((acc, cert) => {
      acc[cert.provider] = (acc[cert.provider] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        certifications,
        statistics: stats,
        byProvider
      }
    });

  } catch (error) {
    console.error('Certification retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve certifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/certifications/:certificationId
 * Get detailed information about a specific certification
 */
router.get('/:certificationId', async (req, res) => {
  try {
    const { certificationId } = req.params;

    const certification = await Certification.findById(certificationId)
      .populate('userId', 'firstName lastName email');

    if (!certification) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found'
      });
    }

    // Calculate additional insights
    const valueScore = certification.calculateValueScore();
    const needsRenewal = certification.needsRenewal();
    const daysUntilExpiry = certification.daysUntilExpiry;

    res.status(200).json({
      success: true,
      data: {
        certification,
        insights: {
          valueScore,
          needsRenewal,
          daysUntilExpiry,
          isValid: certification.isValid,
          recommendedActions: generateRecommendedActions(certification)
        }
      }
    });

  } catch (error) {
    console.error('Certification detail retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve certification details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/certifications/:certificationId/status
 * Update certification verification status (admin endpoint)
 */
router.put('/:certificationId/status', async (req, res) => {
  try {
    const { certificationId } = req.params;
    const { status, notes, reviewerId } = req.body;

    if (!['pending', 'verified', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, verified, or failed'
      });
    }

    const certification = await Certification.findById(certificationId);
    if (!certification) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found'
      });
    }

    // Update certification status
    certification.verificationStatus = status;
    certification.verificationDate = new Date();
    certification.verificationNotes = notes || '';

    await certification.save();

    // If verified, add to user's verified certifications
    if (status === 'verified') {
      await User.findByIdAndUpdate(certification.userId, {
        $addToSet: { verifiedCertifications: certification._id }
      });
    } else if (status === 'failed') {
      // Remove from verified certifications if previously verified
      await User.findByIdAndUpdate(certification.userId, {
        $pull: { verifiedCertifications: certification._id }
      });
    }

    res.status(200).json({
      success: true,
      message: `Certification status updated to ${status}`,
      data: { certification }
    });

  } catch (error) {
    console.error('Certification status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update certification status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/certifications/:certificationId/reverify
 * Re-run verification for a certification
 */
router.post('/:certificationId/reverify', async (req, res) => {
  try {
    const { certificationId } = req.params;

    const certification = await Certification.findById(certificationId)
      .populate('userId', 'firstName lastName');

    if (!certification) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found'
      });
    }

    // Re-run verification using AI service
    const verificationResult = await aiService.verifyCertification(
      certification.provider,
      certification.certificationId,
      {
        holderName: certification.userId.firstName + ' ' + certification.userId.lastName,
        issueDate: certification.issueDate,
        expiryDate: certification.expiryDate
      }
    );

    // Update certification with new verification result
    certification.verificationStatus = verificationResult.status;
    certification.verificationDate = new Date();
    certification.verificationNotes = `Re-verification: ${verificationResult.error?.message || 'Completed successfully'}`;
    certification.apiVerificationData = {
      provider: verificationResult.provider,
      response: verificationResult,
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    await certification.save();

    res.status(200).json({
      success: true,
      message: 'Certification re-verification completed',
      data: {
        certification,
        verificationResult
      }
    });

  } catch (error) {
    console.error('Certification re-verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-verify certification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/certifications/providers/supported
 * Get list of supported certification providers
 */
router.get('/providers/supported', async (req, res) => {
  try {
    const providers = [
      {
        name: 'Microsoft',
        categories: ['Technology', 'Cloud Computing', 'AI/ML'],
        apiSupported: true,
        verificationMethods: ['api', 'document_upload']
      },
      {
        name: 'Google',
        categories: ['Technology', 'Cloud Computing', 'AI/ML', 'Marketing'],
        apiSupported: true,
        verificationMethods: ['api', 'document_upload']
      },
      {
        name: 'Amazon',
        categories: ['Cloud Computing', 'Technology'],
        apiSupported: true,
        verificationMethods: ['api', 'document_upload']
      },
      {
        name: 'Cisco',
        categories: ['Networking', 'Cybersecurity'],
        apiSupported: false,
        verificationMethods: ['document_upload', 'manual']
      },
      {
        name: 'CompTIA',
        categories: ['Cybersecurity', 'Technology'],
        apiSupported: false,
        verificationMethods: ['document_upload', 'manual']
      }
    ];

    // Get statistics from database
    const stats = await Certification.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        supportedProviders: providers,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Provider list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supported providers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate recommended actions
function generateRecommendedActions(certification) {
  const actions = [];

  if (!certification.isValid && !certification.isLifetime) {
    actions.push({
      type: 'renew',
      priority: 'high',
      message: 'This certification has expired. Consider renewing to maintain its value.'
    });
  } else if (certification.needsRenewal(90)) {
    actions.push({
      type: 'prepare_renewal',
      priority: 'medium',
      message: `This certification expires in ${certification.daysUntilExpiry} days. Start preparing for renewal.`
    });
  }

  if (certification.verificationStatus === 'pending') {
    actions.push({
      type: 'verification_pending',
      priority: 'medium',
      message: 'Verification is in progress. You will be notified once completed.'
    });
  }

  if (certification.verificationStatus === 'failed') {
    actions.push({
      type: 'retry_verification',
      priority: 'high',
      message: 'Verification failed. Please check your certification details and retry.'
    });
  }

  if (!certification.displayOnProfile) {
    actions.push({
      type: 'add_to_profile',
      priority: 'low',
      message: 'Consider adding this certification to your profile to increase visibility.'
    });
  }

  return actions;
}

module.exports = router;

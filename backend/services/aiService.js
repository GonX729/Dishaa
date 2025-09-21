/**
 * AI Service - Placeholder implementations for AI-powered career building features
 * 
 * This service contains stub functions that simulate AI/NLP capabilities.
 * In a production environment, these would connect to actual AI services,
 * machine learning models, or external APIs.
 */

// Dummy data for realistic responses
const DUMMY_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
  'MongoDB', 'PostgreSQL', 'Git', 'Agile', 'Scrum', 'Leadership', 'Communication',
  'Project Management', 'Data Analysis', 'Machine Learning', 'DevOps', 'CI/CD'
];

const DUMMY_COURSES = [
  {
    id: '1',
    title: 'Advanced React Development',
    provider: 'Coursera',
    duration: 40,
    rating: 4.7,
    relevanceScore: 0.9
  },
  {
    id: '2', 
    title: 'AWS Cloud Practitioner',
    provider: 'edX',
    duration: 25,
    rating: 4.5,
    relevanceScore: 0.8
  },
  {
    id: '3',
    title: 'Python for Data Science',
    provider: 'Udemy',
    duration: 35,
    rating: 4.6,
    relevanceScore: 0.85
  }
];

const DUMMY_JOBS = [
  {
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000',
    matchScore: 92,
    requiredSkills: ['React', 'JavaScript', 'TypeScript']
  },
  {
    title: 'Full Stack Engineer',
    company: 'Innovation Labs',
    location: 'Remote',
    salary: '$100,000 - $130,000',
    matchScore: 88,
    requiredSkills: ['Node.js', 'React', 'MongoDB']
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    location: 'Austin, TX',
    salary: '$110,000 - $140,000',
    matchScore: 85,
    requiredSkills: ['AWS', 'Docker', 'Kubernetes']
  }
];

/**
 * Simulates NLP parsing of a resume file
 * In production, this would use OCR and NLP models to extract structured data
 * 
 * @param {Object} file - Uploaded resume file object
 * @returns {Promise<Object>} Parsed resume data
 */
const parseResume = async (file) => {
  console.log(`[AI Service] Parsing resume: ${file.originalname}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock parsed data - in production, this would be extracted from the actual file
  const parsedData = {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0123',
      location: 'San Francisco, CA'
    },
    summary: 'Experienced software developer with 5+ years in full-stack development, specializing in React and Node.js applications.',
    skills: [
      { name: 'JavaScript', level: 'advanced', category: 'technical' },
      { name: 'React', level: 'advanced', category: 'technical' },
      { name: 'Node.js', level: 'intermediate', category: 'technical' },
      { name: 'Python', level: 'intermediate', category: 'technical' },
      { name: 'Leadership', level: 'intermediate', category: 'soft' }
    ],
    experience: [
      {
        company: 'Tech Innovations Ltd.',
        position: 'Senior Frontend Developer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        description: 'Led frontend development team, built responsive web applications using React and TypeScript.',
        technologies: ['React', 'TypeScript', 'Redux', 'CSS3']
      },
      {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        startDate: '2018-06-01',
        endDate: '2019-12-31',
        description: 'Developed full-stack applications using MERN stack, implemented RESTful APIs.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express']
      }
    ],
    education: [
      {
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2014-09-01',
        endDate: '2018-05-31'
      }
    ],
    confidence: 0.87,
    warnings: [
      'Some text sections were unclear and may need manual review',
      'Work experience dates should be verified'
    ]
  };
  
  console.log(`[AI Service] Resume parsing completed with ${parsedData.confidence * 100}% confidence`);
  return parsedData;
};

/**
 * Recommends courses based on user skills and career path
 * In production, this would use ML models trained on career progression data
 * 
 * @param {Array} userSkills - User's current skills
 * @param {String} careerPath - Target career path
 * @param {Object} options - Additional options like difficulty preference
 * @returns {Promise<Array>} Array of recommended courses
 */
const recommendCourses = async (userSkills, careerPath, options = {}) => {
  console.log(`[AI Service] Generating course recommendations for career path: ${careerPath}`);
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const userSkillNames = userSkills.map(skill => skill.name.toLowerCase());
  
  // Mock recommendation algorithm
  const recommendations = DUMMY_COURSES.map(course => {
    // Calculate relevance based on missing skills and career path
    let relevanceScore = Math.random() * 0.4 + 0.6; // Base score 0.6-1.0
    
    // Boost score if course fills skill gaps
    const courseSkills = ['react', 'aws', 'python', 'javascript', 'node.js'];
    const hasRelevantSkills = courseSkills.some(skill => 
      userSkillNames.includes(skill) || course.title.toLowerCase().includes(skill)
    );
    
    if (hasRelevantSkills) {
      relevanceScore = Math.min(relevanceScore + 0.2, 1.0);
    }
    
    return {
      ...course,
      relevanceScore: parseFloat(relevanceScore.toFixed(2)),
      reason: generateRecommendationReason(course, userSkills, careerPath),
      estimatedImpact: calculateEstimatedImpact(course, careerPath),
      difficulty: assignDifficulty(course, userSkills),
      timeToComplete: `${course.duration} hours`,
      skillsGained: generateSkillsGained(course)
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log(`[AI Service] Generated ${recommendations.length} course recommendations`);
  return recommendations.slice(0, options.limit || 10);
};

/**
 * Simulates verification of a certification through external APIs
 * In production, this would make actual API calls to certification providers
 * 
 * @param {String} provider - Certification provider (e.g., 'Microsoft', 'Google')
 * @param {String} certId - Certification ID
 * @param {Object} additionalData - Additional verification data
 * @returns {Promise<Object>} Verification result
 */
const verifyCertification = async (provider, certId, additionalData = {}) => {
  console.log(`[AI Service] Verifying certification: ${provider} - ${certId}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Mock verification logic - in production, this would make real API calls
  const isValid = Math.random() > 0.15; // 85% success rate
  const verificationResult = {
    isValid,
    provider,
    certificationId: certId,
    status: isValid ? 'verified' : 'failed',
    verifiedAt: new Date().toISOString(),
    details: {
      holderName: additionalData.holderName || 'John Doe',
      issueDate: additionalData.issueDate || '2023-06-15',
      expiryDate: additionalData.expiryDate || '2026-06-15',
      credentialUrl: `https://${provider.toLowerCase()}.com/credentials/${certId}`,
      skills: generateCertificationSkills(provider),
      level: determineCertificationLevel(provider, certId)
    },
    apiResponse: {
      responseTime: Math.floor(Math.random() * 2000 + 500),
      endpoint: `https://api.${provider.toLowerCase()}.com/verify`,
      statusCode: isValid ? 200 : 404
    }
  };
  
  if (!isValid) {
    verificationResult.error = {
      code: 'CERT_NOT_FOUND',
      message: 'Certification not found in provider database',
      suggestions: [
        'Verify the certification ID is correct',
        'Check if the certification has expired',
        'Contact the certification provider directly'
      ]
    };
  }
  
  console.log(`[AI Service] Certification verification ${isValid ? 'successful' : 'failed'}`);
  return verificationResult;
};

/**
 * Recommends job opportunities based on user's resume and preferences
 * In production, this would use ML models and real job market data
 * 
 * @param {Object} resumeData - User's parsed resume data
 * @param {Object} preferences - Job search preferences
 * @returns {Promise<Array>} Array of recommended jobs
 */
const recommendJobs = async (resumeData, preferences = {}) => {
  console.log('[AI Service] Generating job recommendations based on resume data');
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const userSkills = resumeData.skills || [];
  const userExperience = resumeData.experience || [];
  const userLocation = resumeData.personalInfo?.location || '';
  
  // Mock job recommendation algorithm
  const recommendations = DUMMY_JOBS.map(job => {
    // Calculate match score based on skills, experience, and preferences
    let matchScore = calculateJobMatchScore(job, userSkills, userExperience);
    
    // Apply location preference
    if (preferences.location && !job.location.toLowerCase().includes('remote')) {
      const locationMatch = job.location.toLowerCase().includes(preferences.location.toLowerCase());
      matchScore = locationMatch ? matchScore : Math.max(matchScore - 15, 0);
    }
    
    // Apply salary preference
    if (preferences.salaryMin) {
      const jobSalaryMin = parseInt(job.salary.match(/\$(\d+),?(\d+)?/)?.[1] + (job.salary.match(/\$(\d+),?(\d+)?/)?.[2] || '')) * 1000;
      if (jobSalaryMin < preferences.salaryMin) {
        matchScore = Math.max(matchScore - 10, 0);
      }
    }
    
    return {
      ...job,
      matchScore,
      matchReasons: generateMatchReasons(job, userSkills, userExperience),
      missingSkills: findMissingSkills(job.requiredSkills, userSkills),
      applicationTips: generateApplicationTips(job, resumeData),
      salaryInsights: generateSalaryInsights(job, resumeData),
      companyInsights: generateCompanyInsights(job.company),
      applicationDeadline: generateApplicationDeadline(),
      postedDate: generatePostedDate()
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  console.log(`[AI Service] Generated ${recommendations.length} job recommendations`);
  return recommendations;
};

/**
 * Analyzes skill gaps based on target career path
 * 
 * @param {Array} currentSkills - User's current skills
 * @param {String} targetRole - Target job role
 * @returns {Promise<Object>} Skill gap analysis
 */
const analyzeSkillGaps = async (currentSkills, targetRole) => {
  console.log(`[AI Service] Analyzing skill gaps for target role: ${targetRole}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock skill gap analysis
  const requiredSkills = getRequiredSkillsForRole(targetRole);
  const currentSkillNames = currentSkills.map(s => s.name.toLowerCase());
  
  const gaps = requiredSkills.filter(required => 
    !currentSkillNames.includes(required.name.toLowerCase())
  );
  
  const strengths = requiredSkills.filter(required =>
    currentSkillNames.includes(required.name.toLowerCase())
  );
  
  return {
    targetRole,
    overallReadiness: Math.max(100 - (gaps.length * 15), 0),
    skillGaps: gaps,
    existingStrengths: strengths,
    recommendedLearningPath: generateLearningPath(gaps),
    estimatedTimeToReadiness: `${gaps.length * 2}-${gaps.length * 3} months`,
    prioritySkills: gaps.slice(0, 3)
  };
};

/**
 * Generates ATS-optimized resume content
 * 
 * @param {Object} resumeData - User's resume data
 * @param {String} targetJob - Target job description
 * @returns {Promise<Object>} Optimized resume suggestions
 */
const optimizeResumeForATS = async (resumeData, targetJob) => {
  console.log('[AI Service] Optimizing resume for ATS compatibility');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    atsScore: Math.floor(Math.random() * 30 + 70), // 70-100
    optimizations: [
      {
        section: 'summary',
        original: resumeData.summary,
        suggested: 'Results-driven software developer with 5+ years of experience building scalable web applications using React, Node.js, and cloud technologies.',
        reason: 'Include specific technologies and quantified experience'
      },
      {
        section: 'skills',
        suggestions: [
          'Add specific framework versions (e.g., React 18, Node.js 16)',
          'Include cloud platforms mentioned in job description',
          'Add soft skills that appear in job requirements'
        ]
      }
    ],
    keywordSuggestions: extractKeywordsFromJob(targetJob),
    formatRecommendations: [
      'Use standard section headers (Experience, Education, Skills)',
      'Avoid tables and complex formatting',
      'Use bullet points for better readability',
      'Save as .docx format for better ATS compatibility'
    ]
  };
};

// Helper functions for generating realistic mock data

function generateRecommendationReason(course, userSkills, careerPath) {
  const reasons = [
    `Essential for ${careerPath} roles`,
    'Highly rated by industry professionals',
    'Covers key skills missing from your profile',
    'Popular among successful career changers',
    'Recommended by top companies in your field'
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

function calculateEstimatedImpact(course, careerPath) {
  const impacts = ['High', 'Medium', 'Medium-High'];
  return impacts[Math.floor(Math.random() * impacts.length)];
}

function assignDifficulty(course, userSkills) {
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

function generateSkillsGained(course) {
  const skillSets = {
    'Advanced React Development': ['React Hooks', 'Context API', 'Performance Optimization', 'Testing'],
    'AWS Cloud Practitioner': ['EC2', 'S3', 'Lambda', 'CloudFormation'],
    'Python for Data Science': ['Pandas', 'NumPy', 'Matplotlib', 'Machine Learning']
  };
  return skillSets[course.title] || ['Problem Solving', 'Critical Thinking'];
}

function generateCertificationSkills(provider) {
  const providerSkills = {
    'Microsoft': ['Azure', 'C#', '.NET', 'PowerBI'],
    'Google': ['GCP', 'Android', 'TensorFlow', 'Firebase'],
    'Amazon': ['AWS', 'EC2', 'S3', 'Lambda'],
    'Cisco': ['Networking', 'Security', 'Routing', 'Switching']
  };
  return providerSkills[provider] || ['General IT Skills'];
}

function determineCertificationLevel(provider, certId) {
  const levels = ['Associate', 'Professional', 'Expert'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function calculateJobMatchScore(job, userSkills, userExperience) {
  const baseScore = 60;
  let score = baseScore;
  
  // Skill matching
  const matchingSkills = job.requiredSkills.filter(required =>
    userSkills.some(user => user.name.toLowerCase() === required.toLowerCase())
  );
  score += (matchingSkills.length / job.requiredSkills.length) * 30;
  
  // Experience matching (simplified)
  const yearsOfExperience = userExperience.length * 2; // Approximate
  if (yearsOfExperience >= 3) score += 10;
  
  return Math.min(Math.floor(score), 100);
}

function generateMatchReasons(job, userSkills, userExperience) {
  return [
    `${Math.floor(Math.random() * 5 + 3)} of your skills match requirements`,
    'Your experience level aligns with job requirements',
    'Company culture matches your preferences'
  ];
}

function findMissingSkills(requiredSkills, userSkills) {
  const userSkillNames = userSkills.map(s => s.name.toLowerCase());
  return requiredSkills.filter(required => 
    !userSkillNames.includes(required.toLowerCase())
  );
}

function generateApplicationTips(job, resumeData) {
  return [
    `Highlight your ${job.requiredSkills[0]} experience in your cover letter`,
    'Mention specific projects that demonstrate problem-solving skills',
    'Research the company\'s recent projects and mention relevant ones'
  ];
}

function generateSalaryInsights(job, resumeData) {
  return {
    marketRange: job.salary,
    negotiationTips: [
      'Based on your experience, you could negotiate for the higher end',
      'Consider asking about additional benefits if salary is fixed'
    ],
    comparison: 'This is 5% above market average for your experience level'
  };
}

function generateCompanyInsights(company) {
  return {
    size: 'Medium (200-500 employees)',
    industry: 'Technology',
    rating: 4.2,
    benefits: ['Health Insurance', 'Remote Work', '401k Matching'],
    culture: ['Innovation-focused', 'Work-life balance', 'Learning opportunities']
  };
}

function generateApplicationDeadline() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30 + 7));
  return futureDate.toISOString().split('T')[0];
}

function generatePostedDate() {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 14 + 1));
  return pastDate.toISOString().split('T')[0];
}

function getRequiredSkillsForRole(role) {
  const roleSkills = {
    'Frontend Developer': [
      { name: 'React', level: 'advanced', priority: 'high' },
      { name: 'JavaScript', level: 'advanced', priority: 'high' },
      { name: 'CSS', level: 'intermediate', priority: 'medium' },
      { name: 'TypeScript', level: 'intermediate', priority: 'medium' }
    ],
    'Full Stack Developer': [
      { name: 'React', level: 'intermediate', priority: 'high' },
      { name: 'Node.js', level: 'intermediate', priority: 'high' },
      { name: 'Database Design', level: 'intermediate', priority: 'medium' },
      { name: 'API Development', level: 'intermediate', priority: 'high' }
    ]
  };
  return roleSkills[role] || roleSkills['Frontend Developer'];
}

function generateLearningPath(skillGaps) {
  return skillGaps.map((skill, index) => ({
    step: index + 1,
    skill: skill.name,
    estimatedTime: `${Math.floor(Math.random() * 4 + 2)} weeks`,
    resources: ['Online Course', 'Practice Project', 'Certification'],
    priority: skill.priority
  }));
}

function extractKeywordsFromJob(jobDescription) {
  // Mock keyword extraction
  return [
    'React', 'JavaScript', 'Node.js', 'Agile', 'Problem Solving',
    'Team Collaboration', 'Git', 'Testing', 'Performance Optimization'
  ];
}

module.exports = {
  parseResume,
  recommendCourses,
  verifyCertification,
  recommendJobs,
  analyzeSkillGaps,
  optimizeResumeForATS
};

/**
 * Generate a beginner-friendly, personalized career guide
 * Combines skill gap analysis, curated steps, starter projects, and recommended courses
 *
 * @param {Object} user - Mongoose User document or plain object with user fields
 * @returns {Promise<Object>} Career guide payload
 */
async function generateBeginnerCareerGuide(user) {
  const targetRole = user?.targetJobTitle || inferTargetRoleFromInterests(user) || 'Frontend Developer';
  const currentSkills = Array.isArray(user?.skills) ? user.skills : [];
  const experienceLevel = user?.experienceLevel || 'entry';

  // Analyze skill gaps and recommend courses
  const gaps = await analyzeSkillGaps(currentSkills, targetRole);
  const courses = await recommendCourses(currentSkills, targetRole, { limit: 6 });

  // Build phased learning roadmap
  const roadmap = buildBeginnerRoadmap(targetRole, gaps, courses);

  // Starter goals derived from roadmap and gaps
  const starterGoals = buildStarterGoals(targetRole, gaps);

  return {
    meta: {
      targetRole,
      experienceLevel,
      generatedAt: new Date().toISOString(),
    },
    overview: {
      summary: `A clear, step-by-step plan to go from beginner to job-ready ${targetRole}.`,
      overallReadiness: gaps.overallReadiness,
      estimatedTimeToReadiness: gaps.estimatedTimeToReadiness,
      prioritySkills: gaps.prioritySkills || [],
    },
    gettingStarted: [
      {
        title: 'Set up your environment',
        items: ['Install VS Code', 'Install Git', 'Create GitHub account'],
      },
      {
        title: 'Learn the basics',
        items: [`Complete one beginner course related to ${targetRole}`, 'Build a simple project'],
      },
      {
        title: 'Build consistency',
        items: ['Study 1 hour/day or 6–8 hours/week', 'Share weekly progress on GitHub'],
      },
    ],
    roadmap,
    starterProjects: generateStarterProjects(targetRole),
    recommendedCourses: courses,
    skillGapAnalysis: gaps,
    faq: generateBeginnerFAQ(targetRole),
    nextSteps: [
      'Pick one priority skill and one course to start this week',
      'Create two small portfolio projects in the next month',
      'Update your resume with new skills as you complete milestones',
    ],
    recommendedGoals: starterGoals,
  };
}

function inferTargetRoleFromInterests(user) {
  const headline = (user?.headline || '').toLowerCase();
  if (headline.includes('data')) return 'Data Analyst';
  if (headline.includes('devops')) return 'DevOps Engineer';
  if (headline.includes('backend')) return 'Backend Developer';
  if (headline.includes('full stack') || headline.includes('full-stack')) return 'Full Stack Developer';
  if (headline.includes('ai') || headline.includes('ml')) return 'Machine Learning Engineer';
  return null;
}

function buildBeginnerRoadmap(targetRole, gaps, courses) {
  const phases = [
    {
      phase: 'Foundation (Weeks 1–4)',
      focus: 'Core concepts and tooling',
      skills: gaps.prioritySkills?.slice(0, 2).map(s => s.name) || ['Version Control', 'Problem Solving'],
      actions: [
        'Complete a beginner-friendly course',
        'Set up a GitHub repo and make daily commits',
        'Build a basic project to apply fundamentals',
      ],
      recommendedCourses: courses.slice(0, 2),
    },
    {
      phase: 'Projects (Weeks 5–8)',
      focus: 'Apply skills with real projects',
      skills: gaps.skillGaps?.slice(0, 3).map(s => s.name) || ['APIs', 'Testing', 'Deployment'],
      actions: [
        'Build 2 small portfolio projects end-to-end',
        'Write clear README and deploy at least one project',
        'Ask for feedback and iterate',
      ],
      recommendedCourses: courses.slice(2, 4),
    },
    {
      phase: 'Job Readiness (Weeks 9–12)',
      focus: 'Resume, interview prep, and polishing',
      skills: ['Communication', 'Problem Solving', 'System Design (basic)'],
      actions: [
        'Optimize resume for ATS with targeted keywords',
        'Practice 20–30 interview questions',
        'Network and apply to 5–10 roles/week',
      ],
      recommendedCourses: courses.slice(4, 6),
    },
  ];
  return phases;
}

function generateStarterProjects(targetRole) {
  const common = [
    {
      title: 'Personal Portfolio Website',
      description: 'Showcase projects, skills, and contact info',
      difficulty: 'Beginner',
      skills: ['Git', 'Deployment', 'UI/UX'],
    },
    {
      title: 'REST API + Frontend',
      description: 'Simple CRUD app with authentication',
      difficulty: 'Intermediate',
      skills: ['APIs', 'Auth', 'State Management'],
    },
  ];

  const mapByRole = {
    'Frontend Developer': [
      { title: 'Todo App with Filters', skills: ['React', 'State'], difficulty: 'Beginner' },
      { title: 'Weather Dashboard', skills: ['APIs', 'Async'], difficulty: 'Beginner' },
    ],
    'Backend Developer': [
      { title: 'Notes API with JWT', skills: ['Node.js', 'Auth'], difficulty: 'Beginner' },
      { title: 'Image Uploader Service', skills: ['Storage', 'Security'], difficulty: 'Intermediate' },
    ],
    'Data Analyst': [
      { title: 'Exploratory Data Analysis', skills: ['Pandas', 'Visualization'], difficulty: 'Beginner' },
      { title: 'Sales Dashboard', skills: ['Dashboards', 'SQL'], difficulty: 'Intermediate' },
    ],
  };

  return [...(mapByRole[targetRole] || mapByRole['Frontend Developer']), ...common];
}

function buildStarterGoals(targetRole, gaps) {
  const now = new Date();
  const inDays = d => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  return [
    {
      id: `goal-${now.getTime()}-1`,
      title: `Complete a beginner course for ${targetRole}`,
      description: 'Finish one curated course and take notes',
      category: 'learning',
      targetDate: inDays(21),
      priority: 'high',
      status: 'not_started',
      progress: 0,
      milestones: ['Enroll', 'Finish 50%', 'Complete and summarize'],
      relatedSkills: (gaps?.prioritySkills || []).map(s => s.name).slice(0, 3),
      measurableOutcome: 'Certificate of completion and notes',
    },
    {
      id: `goal-${now.getTime()}-2`,
      title: 'Build and deploy one small project',
      description: 'End-to-end project with README and live link',
      category: 'project',
      targetDate: inDays(30),
      priority: 'medium',
      status: 'not_started',
      progress: 0,
      milestones: ['Plan', 'Build', 'Deploy', 'Iterate'],
      relatedSkills: (gaps?.skillGaps || []).map(s => s.name).slice(0, 3),
      measurableOutcome: 'Live URL in portfolio',
    },
  ];
}

function generateBeginnerFAQ(targetRole) {
  return [
    {
      q: `How long to become job-ready as a ${targetRole}?`,
      a: 'Typically 2–3 months with consistent effort (8–10 hours/week).',
    },
    {
      q: 'Do I need a degree?',
      a: 'Not necessarily. A strong portfolio, fundamentals, and projects are often enough for entry-level roles.',
    },
    {
      q: 'What matters most for beginners?',
      a: 'Consistency, building real projects, and demonstrating problem solving in your portfolio.',
    },
  ];
}

// Expose generator for routes
module.exports.generateBeginnerCareerGuide = generateBeginnerCareerGuide;

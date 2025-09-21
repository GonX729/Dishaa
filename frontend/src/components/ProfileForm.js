import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Target,
  Briefcase,
  Plus,
  X,
  Save
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ProfileForm = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'technical', proficiencyLevel: 'intermediate' });
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Mock user ID - in a real app, this would come from authentication
  const userId = user?._id || localStorage.getItem('userId');

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery(
    ['userProfile', userId],
    () => axios.get(`/api/profile/${userId}`).then(res => res.data.data.profile),
    {
      enabled: !!userId && isAuthenticated,
      onSuccess: (data) => {
        // Populate form with existing data
        setValue('firstName', data.firstName);
        setValue('lastName', data.lastName);
        setValue('email', data.email);
        setValue('phone', data.phone);
        setValue('headline', data.headline);
        setValue('summary', data.summary);
        setValue('targetJobTitle', data.targetJobTitle);
        setValue('targetIndustry', data.targetIndustry);
        setValue('experienceLevel', data.experienceLevel);
        setValue('location', data.location ? 
          `${data.location.city || ''}${data.location.state ? ', ' + data.location.state : ''}`.trim() : 
          '');
        setSkills(data.skills || []);
      }
    }
  );

  // Upload resume mutation
  const uploadResumeMutation = useMutation(
    (formData) => {
      const token = localStorage.getItem('authToken');
      return axios.post('/api/profile/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
    },
    {
      onSuccess: (response) => {
        toast.success('Resume uploaded and processed successfully!');
        queryClient.invalidateQueries(['userProfile']);
        // Auto-populate form with parsed data
        const parsedData = response.data.data.parsedData;
        setValue('firstName', parsedData.personalInfo.name.split(' ')[0]);
        setValue('lastName', parsedData.personalInfo.name.split(' ').slice(1).join(' '));
        setValue('email', parsedData.personalInfo.email);
        setValue('phone', parsedData.personalInfo.phone);
        setValue('summary', parsedData.summary);
        setValue('location', parsedData.personalInfo.location);
        setSkills(parsedData.skills || []);
      },
      onError: (error) => {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.error || 'Failed to upload resume');
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (profileData) => axios.put(`/api/profile/${userId}`, { 
      ...profileData, 
      skills: skills.map(skill => ({
        name: skill.name,
        category: skill.category,
        proficiencyLevel: skill.proficiencyLevel,
        verificationStatus: skill.verificationStatus || 'unverified'
      })),
      location: profileData.location ? {
        city: profileData.location.split(',')[0]?.trim(),
        state: profileData.location.split(',')[1]?.trim(),
        country: 'USA'
      } : undefined
    }),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        queryClient.invalidateQueries(['userProfile']);
      },
      onError: (error) => {
        console.error('Profile update error:', error);
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  // Dropzone for resume upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      console.log('Accepted files:', acceptedFiles);
      console.log('Rejected files:', rejectedFiles);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          console.error(`Rejected file: ${file.name}`, errors);
          if (errors[0]?.code === 'file-too-large') {
            toast.error('File is too large. Maximum size is 10MB.');
          } else if (errors[0]?.code === 'file-invalid-type') {
            toast.error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
          } else {
            toast.error(`File rejected: ${errors[0]?.message}`);
          }
        });
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        console.log('Processing file:', file.name, file.size, file.type);
        setUploadedFile(file);
        const formData = new FormData();
        formData.append('resume', file);
        uploadResumeMutation.mutate(formData);
      }
    }
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill, id: Date.now() }]);
      setNewSkill({ name: '', category: 'technical', proficiencyLevel: 'intermediate' });
    }
  };

  const removeSkill = (skillId) => {
    setSkills(skills.filter(skill => (skill.id || skill.name) !== skillId));
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Target },
    { id: 'upload', label: 'Upload Resume', icon: Upload }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Your Profile</h1>
        <p className="text-gray-600">
          Create a comprehensive profile to get personalized career recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile Completeness */}
          {userProfile && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Profile Completeness</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${userProfile.profileCompleteness}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {userProfile.profileCompleteness}% complete
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="card">
            {/* Basic Information Section */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="mr-2" size={24} />
                  Basic Information
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className="input-field"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Last Name</label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input-field"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <Mail className="inline mr-1" size={16} />
                    Email Address
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="input-field"
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    <Phone className="inline mr-1" size={16} />
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="label">
                    <MapPin className="inline mr-1" size={16} />
                    Location
                  </label>
                  <input
                    {...register('location')}
                    className="input-field"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            )}

            {/* Professional Information Section */}
            {activeSection === 'professional' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Briefcase className="mr-2" size={24} />
                  Professional Information
                </h2>

                <div>
                  <label className="label">Professional Headline</label>
                  <input
                    {...register('headline')}
                    className="input-field"
                    placeholder="e.g., Senior Software Engineer | Full-Stack Developer"
                  />
                </div>

                <div>
                  <label className="label">Professional Summary</label>
                  <textarea
                    {...register('summary')}
                    rows={4}
                    className="input-field"
                    placeholder="Describe your professional background, key skills, and career objectives..."
                  />
                </div>

                <div>
                  <label className="label">Target Job Title</label>
                  <input
                    {...register('targetJobTitle')}
                    className="input-field"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div>
                  <label className="label">Target Industry</label>
                  <select {...register('targetIndustry')} className="input-field">
                    <option value="">Select an industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="label">Experience Level</label>
                  <select {...register('experienceLevel')} className="input-field">
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior Level (6-10 years)</option>
                    <option value="executive">Executive Level (10+ years)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Skills Section */}
            {activeSection === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Target className="mr-2" size={24} />
                  Skills & Expertise
                </h2>

                {/* Add New Skill */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Add a New Skill</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <input
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        className="input-field"
                        placeholder="Skill name (e.g., React, Python)"
                      />
                    </div>
                    <div>
                      <select
                        value={newSkill.category}
                        onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                        className="input-field"
                      >
                        <option value="technical">Technical</option>
                        <option value="soft">Soft Skills</option>
                        <option value="language">Language</option>
                        <option value="certification">Certification</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={newSkill.proficiencyLevel}
                        onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                        className="input-field"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="mt-4 btn-primary flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Skill
                  </button>
                </div>

                {/* Skills List */}
                {skills.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Your Skills</h3>
                    <div className="space-y-3">
                      {skills.map((skill) => (
                        <div key={skill.id || skill.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium text-gray-900">{skill.name}</span>
                              <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                {skill.category}
                              </span>
                              <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {skill.proficiencyLevel}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.id || skill.name)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Resume Section */}
            {activeSection === 'upload' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Upload className="mr-2" size={24} />
                  Upload Resume
                </h2>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                    isDragActive 
                      ? 'border-primary-400 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {uploadResumeMutation.isLoading ? (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">Processing resume...</p>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                      </p>
                      <p className="text-gray-600">
                        Drag and drop your resume, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports PDF, DOC, and DOCX files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Resume uploaded successfully: {uploadedFile.name}
                        </p>
                        <p className="text-sm text-green-600">
                          Your profile has been automatically updated with the parsed information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Your profile will be used to generate personalized recommendations
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isLoading}
                className="btn-primary flex items-center"
              >
                {updateProfileMutation.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;

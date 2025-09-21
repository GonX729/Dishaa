import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Download, 
  FileText, 
  Eye,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  GripVertical,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import axios from 'axios';

const ResumeBuilder = () => {
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [previewMode, setPreviewMode] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const queryClient = useQueryClient();

  // Mock user ID - in a real app, this would come from authentication
  const userId = '64a7b2c8e4b0123456789abc';

  const { control, watch, reset } = useForm({
    defaultValues: {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        linkedin: '',
        github: '',
        summary: ''
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      customSections: []
    }
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
    move: moveExperience
  } = useFieldArray({
    control,
    name: 'experience'
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
    move: moveEducation
  } = useFieldArray({
    control,
    name: 'education'
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill
  } = useFieldArray({
    control,
    name: 'skills'
  });

  // Fetch user's existing resume data
  const { isLoading } = useQuery(
    ['resume', userId],
    () => axios.get(`/api/resume/${userId}`).then(res => res.data.data),
    {
      enabled: !!userId,
      onSuccess: (data) => {
        if (data) {
          reset(data);
        }
      }
    }
  );

  // Save resume mutation
  const saveResumeMutation = useMutation(
    (resumeData) => axios.put(`/api/resume/${userId}`, resumeData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['resume', userId]);
      }
    }
  );

  // Generate/download resume mutation
  const downloadResumeMutation = useMutation(
    ({ format, template }) => 
      axios.post(`/api/resume/${userId}/generate`, { format, template }, { responseType: 'blob' }),
    {
      onSuccess: (response, { format }) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `resume.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    }
  );

  // Optimize resume mutation
  const optimizeResumeMutation = useMutation(
    (resumeData) => axios.post(`/api/resume/${userId}/optimize`, resumeData),
    {
      onSuccess: (response) => {
        setOptimizationSuggestions(response.data.data.suggestions);
      }
    }
  );

  const watchedData = watch();

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedData && Object.keys(watchedData).length > 0) {
        saveResumeMutation.mutate(watchedData);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [watchedData, saveResumeMutation]);

  const handleDragEnd = (result, fieldType) => {
    if (!result.destination) return;

    const moveFunction = {
      experience: moveExperience,
      education: moveEducation
    }[fieldType];

    if (moveFunction) {
      moveFunction(result.source.index, result.destination.index);
    }
  };

  const addNewItem = (type) => {
    const defaultItems = {
      experience: {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      },
      education: {
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: '',
        honors: ''
      },
      project: {
        name: '',
        description: '',
        technologies: [],
        url: '',
        github: ''
      },
      skill: {
        category: '',
        items: []
      }
    };

    const appendFunctions = {
      experience: appendExperience,
      education: appendEducation,
      skill: appendSkill
    };

    appendFunctions[type]?.(defaultItems[type]);
  };

  const optimizeResume = () => {
    optimizeResumeMutation.mutate(watchedData);
  };

  const downloadResume = (format) => {
    downloadResumeMutation.mutate({ format, template: activeTemplate });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
          <p className="text-gray-600 mt-2">
            Create and optimize your professional resume with AI assistance
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-secondary ${previewMode ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            <Eye size={16} className="mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={optimizeResume}
            className="btn-secondary"
            disabled={optimizeResumeMutation.isLoading}
          >
            {optimizeResumeMutation.isLoading ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Zap size={16} className="mr-2" />
            )}
            Optimize with AI
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => downloadResume('pdf')}
              className="btn-primary"
              disabled={downloadResumeMutation.isLoading}
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={() => downloadResume('docx')}
              className="btn-secondary"
              disabled={downloadResumeMutation.isLoading}
            >
              Download DOCX
            </button>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Template</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['modern', 'classic', 'minimal', 'creative'].map((template) => (
            <button
              key={template}
              onClick={() => setActiveTemplate(template)}
              className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                activeTemplate === template
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center">
                <FileText className="text-gray-400" size={24} />
              </div>
              <span className="text-sm font-medium capitalize">{template}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Optimization Suggestions */}
      {optimizationSuggestions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="text-yellow-500 mr-2" size={24} />
            AI Optimization Suggestions
          </h2>
          <div className="space-y-3">
            {optimizationSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  suggestion.type === 'critical'
                    ? 'bg-red-50 border-red-400'
                    : suggestion.type === 'important'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start">
                  {suggestion.type === 'critical' ? (
                    <AlertCircle className="text-red-500 mr-3 mt-0.5" size={16} />
                  ) : (
                    <CheckCircle className="text-blue-500 mr-3 mt-0.5" size={16} />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    {suggestion.suggestion && (
                      <p className="text-sm text-green-700 mt-2 font-medium">
                        💡 Suggestion: {suggestion.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Resume Form */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="personalInfo.fullName"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input {...field} className="input-field" placeholder="John Doe" />
                  </div>
                )}
              />
              <Controller
                name="personalInfo.email"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input {...field} type="email" className="input-field" placeholder="john@example.com" />
                  </div>
                )}
              />
              <Controller
                name="personalInfo.phone"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input {...field} className="input-field" placeholder="+1 (555) 123-4567" />
                  </div>
                )}
              />
              <Controller
                name="personalInfo.location"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input {...field} className="input-field" placeholder="New York, NY" />
                  </div>
                )}
              />
              <Controller
                name="personalInfo.website"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input {...field} className="input-field" placeholder="https://yourwebsite.com" />
                  </div>
                )}
              />
              <Controller
                name="personalInfo.linkedin"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input {...field} className="input-field" placeholder="linkedin.com/in/johndoe" />
                  </div>
                )}
              />
            </div>
            <Controller
              name="personalInfo.summary"
              control={control}
              render={({ field }) => (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Summary
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    className="input-field"
                    placeholder="Write a compelling summary of your professional experience and career goals..."
                  />
                </div>
              )}
            />
          </div>

          {/* Experience Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
              <button
                onClick={() => addNewItem('experience')}
                className="btn-secondary"
              >
                <Plus size={16} className="mr-2" />
                Add Experience
              </button>
            </div>
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'experience')}>
              <Droppable droppableId="experience">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {experienceFields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <div {...provided.dragHandleProps} className="mr-2">
                                  <GripVertical className="text-gray-400" size={16} />
                                </div>
                                <h3 className="font-medium text-gray-900">Experience {index + 1}</h3>
                              </div>
                              <button
                                onClick={() => removeExperience(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus size={16} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Controller
                                name={`experience.${index}.title`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    className="input-field"
                                    placeholder="Job Title"
                                  />
                                )}
                              />
                              <Controller
                                name={`experience.${index}.company`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    className="input-field"
                                    placeholder="Company Name"
                                  />
                                )}
                              />
                              <Controller
                                name={`experience.${index}.startDate`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="month"
                                    className="input-field"
                                    placeholder="Start Date"
                                  />
                                )}
                              />
                              <Controller
                                name={`experience.${index}.endDate`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="month"
                                    className="input-field"
                                    placeholder="End Date"
                                    disabled={watch(`experience.${index}.current`)}
                                  />
                                )}
                              />
                            </div>
                            <Controller
                              name={`experience.${index}.current`}
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <div className="mt-3">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={value}
                                      onChange={onChange}
                                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      I currently work here
                                    </span>
                                  </label>
                                </div>
                              )}
                            />
                            <Controller
                              name={`experience.${index}.description`}
                              control={control}
                              render={({ field }) => (
                                <textarea
                                  {...field}
                                  rows={3}
                                  className="input-field mt-4"
                                  placeholder="Describe your responsibilities and achievements..."
                                />
                              )}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Education Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Education</h2>
              <button
                onClick={() => addNewItem('education')}
                className="btn-secondary"
              >
                <Plus size={16} className="mr-2" />
                Add Education
              </button>
            </div>
            <div className="space-y-4">
              {educationFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Education {index + 1}</h3>
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name={`education.${index}.degree`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="input-field"
                          placeholder="Degree"
                        />
                      )}
                    />
                    <Controller
                      name={`education.${index}.institution`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="input-field"
                          placeholder="Institution"
                        />
                      )}
                    />
                    <Controller
                      name={`education.${index}.graduationDate`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="month"
                          className="input-field"
                          placeholder="Graduation Date"
                        />
                      )}
                    />
                    <Controller
                      name={`education.${index}.gpa`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="input-field"
                          placeholder="GPA (optional)"
                        />
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
              <button
                onClick={() => addNewItem('skill')}
                className="btn-secondary"
              >
                <Plus size={16} className="mr-2" />
                Add Category
              </button>
            </div>
            <div className="space-y-4">
              {skillFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Controller
                      name={`skills.${index}.category`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className="input-field flex-1 mr-4"
                          placeholder="Category (e.g., Programming Languages)"
                        />
                      )}
                    />
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                  <Controller
                    name={`skills.${index}.items`}
                    control={control}
                    render={({ field: { value = [], onChange } }) => (
                      <div>
                        <input
                          className="input-field"
                          placeholder="Enter skills separated by commas"
                          value={Array.isArray(value) ? value.join(', ') : ''}
                          onChange={(e) => {
                            const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
                            onChange(skills);
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resume Preview */}
        <div className="sticky top-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Resume Preview</h2>
              <div className="text-sm text-gray-500">
                {saveResumeMutation.isLoading ? (
                  <span className="flex items-center">
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle size={14} className="mr-1 text-green-500" />
                    Auto-saved
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[600px]">
              {/* Resume Preview Content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {watch('personalInfo.fullName') || 'Your Name'}
                  </h1>
                  <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm text-gray-600">
                    {watch('personalInfo.email') && (
                      <span className="flex items-center">
                        <Mail size={12} className="mr-1" />
                        {watch('personalInfo.email')}
                      </span>
                    )}
                    {watch('personalInfo.phone') && (
                      <span className="flex items-center">
                        <Phone size={12} className="mr-1" />
                        {watch('personalInfo.phone')}
                      </span>
                    )}
                    {watch('personalInfo.location') && (
                      <span className="flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {watch('personalInfo.location')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {watch('personalInfo.summary') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {watch('personalInfo.summary')}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {experienceFields.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Work Experience</h2>
                    <div className="space-y-4">
                      {experienceFields.map((field, index) => (
                        <div key={field.id} className="border-l-2 border-primary-200 pl-4">
                          <h3 className="font-medium text-gray-900">
                            {watch(`experience.${index}.title`) || 'Job Title'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {watch(`experience.${index}.company`) || 'Company'} • {' '}
                            {watch(`experience.${index}.startDate`)} - {' '}
                            {watch(`experience.${index}.current`) ? 'Present' : watch(`experience.${index}.endDate`)}
                          </p>
                          {watch(`experience.${index}.description`) && (
                            <p className="text-gray-700 text-sm mt-1">
                              {watch(`experience.${index}.description`)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {educationFields.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Education</h2>
                    <div className="space-y-2">
                      {educationFields.map((field, index) => (
                        <div key={field.id}>
                          <h3 className="font-medium text-gray-900">
                            {watch(`education.${index}.degree`) || 'Degree'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {watch(`education.${index}.institution`) || 'Institution'} • {' '}
                            {watch(`education.${index}.graduationDate`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {skillFields.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
                    <div className="space-y-2">
                      {skillFields.map((field, index) => (
                        <div key={field.id}>
                          <h3 className="font-medium text-gray-900 text-sm">
                            {watch(`skills.${index}.category`) || 'Category'}:
                          </h3>
                          <p className="text-gray-700 text-sm">
                            {watch(`skills.${index}.items`)?.join(', ') || 'Skills list'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;

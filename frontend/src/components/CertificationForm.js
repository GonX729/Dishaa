import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Award,
  Loader,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';

const CertificationForm = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [verificationResults, setVerificationResults] = useState({});
  const [isVerifying, setIsVerifying] = useState({});
  const queryClient = useQueryClient();

  // Mock user ID
  const userId = '64a7b2c8e4b0123456789abc';

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      description: '',
      skills: [],
      url: ''
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file)
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  });

  // Submit certification mutation
  const submitCertificationMutation = useMutation(
    (formData) => {
      const data = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key === 'skills' && Array.isArray(formData[key])) {
          formData[key].forEach(skill => data.append('skills[]', skill));
        } else {
          data.append(key, formData[key]);
        }
      });
      
      // Append files
      uploadedFiles.forEach(fileObj => {
        data.append('certificationFiles', fileObj.file);
      });

      return axios.post(`/api/certifications/${userId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['certifications', userId]);
        reset();
        setUploadedFiles([]);
        setVerificationResults({});
      }
    }
  );

  // Verify certification mutation
  const verifyCertificationMutation = useMutation(
    ({ certificationData, fileId }) => 
      axios.post('/api/certifications/verify', {
        ...certificationData,
        fileId
      }),
    {
      onSuccess: (response, { fileId }) => {
        setVerificationResults(prev => ({
          ...prev,
          [fileId]: response.data.data
        }));
        setIsVerifying(prev => ({
          ...prev,
          [fileId]: false
        }));
      },
      onError: (error, { fileId }) => {
        setIsVerifying(prev => ({
          ...prev,
          [fileId]: false
        }));
      }
    }
  );

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setVerificationResults(prev => {
      const newResults = { ...prev };
      delete newResults[fileId];
      return newResults;
    });
  };

  const verifyCertification = (fileObj, formData) => {
    setIsVerifying(prev => ({ ...prev, [fileObj.id]: true }));
    verifyCertificationMutation.mutate({
      certificationData: formData,
      fileId: fileObj.id
    });
  };

  const onSubmit = (data) => {
    // Convert skills string to array
    if (typeof data.skills === 'string') {
      data.skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }
    
    submitCertificationMutation.mutate(data);
  };

  const getVerificationStatus = (fileId) => {
    const result = verificationResults[fileId];
    if (!result) return null;

    if (result.isValid) {
      return {
        icon: <CheckCircle className="text-green-500" size={20} />,
        text: 'Verified',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: <AlertCircle className="text-red-500" size={20} />,
        text: 'Verification Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Certification</h1>
        <p className="text-gray-600 mt-2">
          Upload and verify your professional certifications with AI validation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Certification Form */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Certification Details</h2>
              
              <div className="space-y-4">
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Certification name is required' }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certification Name *
                      </label>
                      <input
                        {...field}
                        className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                        placeholder="e.g., AWS Certified Solutions Architect"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="issuer"
                  control={control}
                  rules={{ required: 'Issuing organization is required' }}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issuing Organization *
                      </label>
                      <input
                        {...field}
                        className={`input-field ${errors.issuer ? 'border-red-300' : ''}`}
                        placeholder="e.g., Amazon Web Services"
                      />
                      {errors.issuer && (
                        <p className="text-red-600 text-xs mt-1">{errors.issuer.message}</p>
                      )}
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="issueDate"
                    control={control}
                    rules={{ required: 'Issue date is required' }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Date *
                        </label>
                        <input
                          {...field}
                          type="date"
                          className={`input-field ${errors.issueDate ? 'border-red-300' : ''}`}
                        />
                        {errors.issueDate && (
                          <p className="text-red-600 text-xs mt-1">{errors.issueDate.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="expiryDate"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          {...field}
                          type="date"
                          className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank if no expiry</p>
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="credentialId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credential ID
                      </label>
                      <input
                        {...field}
                        className="input-field"
                        placeholder="e.g., ABC123456789"
                      />
                    </div>
                  )}
                />

                <Controller
                  name="url"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification URL
                      </label>
                      <input
                        {...field}
                        type="url"
                        className="input-field"
                        placeholder="https://verify.example.com/credential/123"
                      />
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...field}
                        rows={3}
                        className="input-field"
                        placeholder="Describe what this certification covers and its relevance..."
                      />
                    </div>
                  )}
                />

                <Controller
                  name="skills"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Related Skills
                      </label>
                      <input
                        value={Array.isArray(value) ? value.join(', ') : value || ''}
                        onChange={(e) => {
                          const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
                          onChange(skills);
                        }}
                        className="input-field"
                        placeholder="Enter skills separated by commas (e.g., Cloud Architecture, AWS, DevOps)"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitCertificationMutation.isLoading}
              className="btn-primary w-full"
            >
              {submitCertificationMutation.isLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Adding Certification...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Certification
                </>
              )}
            </button>
          </div>

          {/* File Upload and Verification */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Certificate</h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                  isDragActive
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop certificate files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PDF, DOC, DOCX, PNG, JPG (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-gray-900">Uploaded Files</h3>
                  {uploadedFiles.map((fileObj) => {
                    const verification = getVerificationStatus(fileObj.id);
                    const isCurrentlyVerifying = isVerifying[fileObj.id];

                    return (
                      <div
                        key={fileObj.id}
                        className={`border rounded-lg p-4 ${
                          verification ? verification.borderColor : 'border-gray-200'
                        } ${verification ? verification.bgColor : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="text-gray-500" size={24} />
                            <div>
                              <p className="font-medium text-gray-900">
                                {fileObj.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {verification && (
                              <div className={`flex items-center space-x-1 ${verification.color}`}>
                                {verification.icon}
                                <span className="text-sm font-medium">{verification.text}</span>
                              </div>
                            )}
                            
                            {isCurrentlyVerifying && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Loader className="animate-spin" size={16} />
                                <span className="text-sm">Verifying...</span>
                              </div>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => removeFile(fileObj.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Verification Results */}
                        {verificationResults[fileObj.id] && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Verification Results</h4>
                            <div className="space-y-2 text-sm">
                              {verificationResults[fileObj.id].extractedData && (
                                <div>
                                  <span className="font-medium">Extracted Data:</span>
                                  <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(verificationResults[fileObj.id].extractedData, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {verificationResults[fileObj.id].feedback && (
                                <div>
                                  <span className="font-medium">Feedback:</span>
                                  <p className="text-gray-700 mt-1">
                                    {verificationResults[fileObj.id].feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Verify Button */}
                        {!verification && !isCurrentlyVerifying && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const formData = control._formValues;
                                verifyCertification(fileObj, formData);
                              }}
                              className="btn-secondary text-sm"
                            >
                              <Award size={14} className="mr-1" />
                              Verify with AI
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(fileObj.preview, '_blank')}
                              className="btn-secondary text-sm"
                            >
                              <Eye size={14} className="mr-1" />
                              Preview
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verification Tips */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Tips</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <p>Upload clear, high-quality images or PDFs of your certificates</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <p>Ensure all text is legible and certificate details are visible</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <p>Include credential IDs and verification URLs when available</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <p>AI verification helps validate authenticity and extract key information</p>
                </div>
              </div>
            </div>

            {/* Popular Certifications */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Certifications</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'AWS Certified Solutions Architect',
                  'Google Cloud Professional',
                  'Microsoft Azure Fundamentals',
                  'PMP Certification',
                  'Certified Kubernetes Administrator',
                  'Salesforce Administrator',
                  'CISSP Security Certification',
                  'Scrum Master Certification'
                ].map((cert, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      // Auto-fill certification name
                      control._setValue('name', cert);
                    }}
                    className="text-left p-2 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Success/Error Messages */}
      {submitCertificationMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="mr-2" size={20} />
            <span>Certification added successfully!</span>
          </div>
        </div>
      )}

      {submitCertificationMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <span>Error adding certification. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationForm;

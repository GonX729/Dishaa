import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  ExternalLink,
  Building2,
  Users,
  Filter,
  Star,
  Heart,
  MoreHorizontal,
  Briefcase,
  Target
} from 'lucide-react';
import axios from 'axios';

const JobListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Mock user ID
  const userId = '64a7b2c8e4b0123456789abc';

  // Fetch jobs with filters
  const { data: jobsData, isLoading, refetch } = useQuery(
    ['jobs', {
      search: searchTerm,
      location,
      jobType,
      experienceLevel,
      salaryRange,
      sortBy,
      page: currentPage
    }],
    () => axios.get('/api/jobs/search', {
      params: {
        search: searchTerm,
        location,
        jobType,
        experienceLevel,
        salaryRange,
        sortBy,
        page: currentPage,
        limit: 10
      }
    }).then(res => res.data.data),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Fetch job recommendations
  const { data: recommendations } = useQuery(
    ['jobRecommendations', userId],
    () => axios.get(`/api/jobs/recommendations/${userId}?limit=5`).then(res => res.data.data.recommendations),
    {
      enabled: !!userId
    }
  );

  // Fetch saved jobs
  // eslint-disable-next-line no-unused-vars
  const { data: savedJobsData } = useQuery(
    ['savedJobs', userId],
    () => axios.get(`/api/jobs/saved/${userId}`).then(res => res.data.data),
    {
      enabled: !!userId,
      onSuccess: (data) => {
        setSavedJobs(new Set(data.map(job => job._id)));
      }
    }
  );

  const jobs = jobsData?.jobs || [];
  const totalPages = jobsData?.totalPages || 1;
  const totalJobs = jobsData?.total || 0;

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || location) {
        setCurrentPage(1);
        refetch();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, location, refetch]);

  const handleSaveJob = async (jobId) => {
    try {
      if (savedJobs.has(jobId)) {
        await axios.delete(`/api/jobs/saved/${userId}/${jobId}`);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await axios.post(`/api/jobs/saved/${userId}`, { jobId });
        setSavedJobs(prev => new Set([...prev, jobId]));
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleApplyJob = async (jobId) => {
    try {
      await axios.post(`/api/jobs/${jobId}/apply`, { userId });
      // Could show a success message or redirect
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Salary not disclosed';
    if (!max) return `${currency} ${min?.toLocaleString()}+`;
    if (!min) return `Up to ${currency} ${max?.toLocaleString()}`;
    return `${currency} ${min?.toLocaleString()} - ${max?.toLocaleString()}`;
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'freelance': 'bg-orange-100 text-orange-800',
      'internship': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceLevelColor = (level) => {
    const colors = {
      'entry': 'bg-green-100 text-green-800',
      'mid': 'bg-blue-100 text-blue-800',
      'senior': 'bg-purple-100 text-purple-800',
      'lead': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
          <p className="text-gray-600 mt-2">
            Find your next career opportunity with AI-powered recommendations
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="btn-secondary"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="relevance">Most Relevant</option>
            <option value="date">Newest First</option>
            <option value="salary">Highest Salary</option>
            <option value="match">Best Match</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Search Jobs
          </button>
        </div>

        {/* Advanced Filters */}
        {filtersVisible && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead/Management</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range
                </label>
                <select
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Salary</option>
                  <option value="0-50000">$0 - $50,000</option>
                  <option value="50000-75000">$50,000 - $75,000</option>
                  <option value="75000-100000">$75,000 - $100,000</option>
                  <option value="100000-150000">$100,000 - $150,000</option>
                  <option value="150000+">$150,000+</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setJobType('');
                    setExperienceLevel('');
                    setSalaryRange('');
                    setCurrentPage(1);
                    refetch();
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Job Recommendations Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="text-primary-600 mr-2" size={20} />
              Recommended for You
            </h2>
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((job, index) => (
                  <div key={job._id || index} className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{job.company}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.type)}`}>
                        {job.type}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="text-yellow-500 mr-1" size={12} />
                        {job.matchScore || 85}%
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All Recommendations →
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No recommendations yet</p>
                <p className="text-xs text-gray-400">Complete your profile to get personalized recommendations</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Market Insights</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Jobs</span>
                <span className="font-medium text-gray-900">{totalJobs?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New This Week</span>
                <span className="font-medium text-green-600">+1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Response Time</span>
                <span className="font-medium text-gray-900">3 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-medium text-blue-600">12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalJobs)} of {totalJobs} jobs
                </p>
              </div>

              {/* Job Cards */}
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job._id} className="card hover:shadow-lg transition-shadow duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="text-gray-600" size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600 cursor-pointer">
                                {job.title}
                              </h3>
                              <p className="text-gray-600 flex items-center">
                                <Building2 size={14} className="mr-1" />
                                {job.company}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSaveJob(job._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {savedJobs.has(job._id) ? (
                              <Heart size={20} className="fill-current text-red-500" />
                            ) : (
                              <Heart size={20} />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <MapPin size={14} className="mr-1" />
                            <span className="text-sm">{job.location}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign size={14} className="mr-1" />
                            <span className="text-sm">
                              {formatSalary(job.salary?.min, job.salary?.max, job.salary?.currency)}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock size={14} className="mr-1" />
                            <span className="text-sm">
                              {new Date(job.postedDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users size={14} className="mr-1" />
                            <span className="text-sm">{job.applicantCount || 0} applicants</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getJobTypeColor(job.type)}`}>
                            {job.type}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExperienceLevelColor(job.experienceLevel)}`}>
                            {job.experienceLevel}
                          </span>
                          {job.remote && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Remote
                            </span>
                          )}
                          {job.matchScore && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center">
                              <Star size={12} className="mr-1" />
                              {job.matchScore}% match
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h4>
                            <div className="flex flex-wrap gap-2">
                              {job.skills.slice(0, 6).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 6 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  +{job.skills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex lg:flex-col gap-3 mt-4 lg:mt-0 lg:ml-6">
                        <button
                          onClick={() => handleApplyJob(job._id)}
                          className="btn-primary flex-1 lg:flex-none"
                        >
                          Apply Now
                        </button>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex-1 lg:flex-none flex items-center justify-center"
                        >
                          <ExternalLink size={16} className="mr-2" />
                          View Details
                        </a>
                        <button className="btn-secondary lg:hidden">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-2">
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const page = Math.max(1, currentPage - 2) + index;
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-md ${
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or removing some filters
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocation('');
                  setJobType('');
                  setExperienceLevel('');
                  setSalaryRange('');
                  setCurrentPage(1);
                  refetch();
                }}
                className="btn-primary"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListing;

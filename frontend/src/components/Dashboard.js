import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  BookOpen, 
  Target,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import axios from 'axios';
import CourseCard from './CourseCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('6months');
  
  // Mock user ID - in a real app, this would come from authentication
  const userId = '64a7b2c8e4b0123456789abc';

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard', userId],
    () => axios.get(`/api/progress/${userId}`).then(res => res.data.data),
    {
      enabled: !!userId,
      refetchInterval: 300000 // Refresh every 5 minutes
    }
  );

  // Fetch course recommendations
  const { data: courseRecommendations } = useQuery(
    ['courseRecommendations', userId],
    () => axios.get(`/api/courses/recommendations/${userId}?limit=3`).then(res => res.data.data.recommendations),
    {
      enabled: !!userId,
      refetchInterval: 600000 // Refresh every 10 minutes
    }
  );

  // Mock chart data for learning progress
  const learningProgressData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Hours Learned',
        data: [12, 19, 8, 15, 22, 18],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  // Skills distribution chart data
  const skillsData = {
    labels: ['Technical', 'Soft Skills', 'Languages', 'Certifications'],
    datasets: [
      {
        data: [65, 20, 10, 5],
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const overview = dashboardData?.overview || {};
  const recommendations = dashboardData?.recommendations || [];
  const recentAchievements = dashboardData?.recentAchievements || [];
  const upcomingItems = dashboardData?.upcomingItems || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your progress and get personalized recommendations
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input-field"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profile Completeness</p>
              <p className="text-2xl font-bold text-gray-900">{overview.profileCompleteness || 0}%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp size={12} className="mr-1" />
                +5% this week
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Users className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Career Readiness</p>
              <p className="text-2xl font-bold text-gray-900">{overview.careerReadinessScore || 0}%</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Target size={12} className="mr-1" />
                Excellent match
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Courses Completed</p>
              <p className="text-2xl font-bold text-gray-900">{overview.coursesCompleted || 0}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <BookOpen size={12} className="mr-1" />
                {overview.coursesInProgress || 0} in progress
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BookOpen className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certifications</p>
              <p className="text-2xl font-bold text-gray-900">{overview.verifiedCertifications || 0}</p>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <Award size={12} className="mr-1" />
                All verified
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Award className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Learning Progress Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
              <BarChart3 className="text-gray-400" size={24} />
            </div>
            <div className="h-64">
              <Line 
                data={learningProgressData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Hours'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
              <Zap className="text-yellow-500" size={24} />
            </div>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100' :
                    rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Target className={`${
                      rec.priority === 'high' ? 'text-red-600' :
                      rec.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`} size={16} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {rec.estimatedTime}
                      <span className="mx-2">•</span>
                      <span className="capitalize">{rec.priority} priority</span>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Achievements</h2>
              <Star className="text-yellow-500" size={24} />
            </div>
            {recentAchievements.length > 0 ? (
              <div className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="text-green-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.details}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(achievement.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No recent achievements</p>
                <p className="text-sm text-gray-400">Complete courses or update your profile to earn achievements</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Skills Distribution */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills Distribution</h2>
            <div className="h-48 flex items-center justify-center">
              <Doughnut 
                data={skillsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Upcoming Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming</h2>
              <Calendar className="text-gray-400" size={24} />
            </div>
            {upcomingItems.length > 0 ? (
              <div className="space-y-3">
                {upcomingItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className={`p-1 rounded-full ${
                      item.priority === 'high' ? 'bg-red-100' :
                      item.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <Clock className={`${
                        item.priority === 'high' ? 'text-red-600' :
                        item.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} size={12} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-600">
                        Due: {format(new Date(item.dueDate), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No upcoming deadlines</p>
              </div>
            )}
          </div>

          {/* Recommended Courses */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recommended Courses</h2>
              <BookOpen className="text-gray-400" size={24} />
            </div>
            <div className="space-y-4">
              {courseRecommendations?.slice(0, 2).map((course, index) => (
                <CourseCard 
                  key={course.id || index} 
                  course={course} 
                  compact={true}
                />
              ))}
              <button className="w-full text-center py-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All Recommendations →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-sm font-medium text-gray-900">Update Profile</span>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-sm font-medium text-gray-900">Download Resume</span>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-sm font-medium text-gray-900">Browse Jobs</span>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <span className="text-sm font-medium text-gray-900">Add Certification</span>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

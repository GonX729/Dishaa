import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  TrendingUp,
  Award,
  Play,
  Calendar,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const CourseCard = ({ course, compact = false, showProgress = false, onEnroll, onViewDetails }) => {
  if (!course) return null;

  const {
    title,
    description,
    instructor,
    duration,
    difficulty,
    rating,
    studentCount,
    price,
    originalPrice,
    thumbnail,
    tags,
    progress,
    startDate,
    endDate,
    isEnrolled,
    isFree,
    provider,
    certificateAvailable,
    matchScore,
    url
  } = course;

  const getDifficultyColor = (level) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
      'expert': 'bg-purple-100 text-purple-800'
    };
    return colors[level?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    if (price === 0 || isFree) return 'Free';
    return `$${price}`;
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'number') {
      if (duration < 60) return `${duration}m`;
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return duration || 'N/A';
  };

  if (compact) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer">
        <div className="flex items-start space-x-3">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
              {title}
            </h3>
            <p className="text-xs text-gray-600 mb-2">{instructor}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>{formatDuration(duration)}</span>
                {rating && (
                  <>
                    <Star size={12} className="text-yellow-500 fill-current" />
                    <span>{rating}</span>
                  </>
                )}
              </div>
              {matchScore && (
                <span className="text-xs font-medium text-primary-600">
                  {matchScore}% match
                </span>
              )}
            </div>

            {showProgress && progress !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Course Image */}
      <div className="relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <BookOpen className="text-gray-400" size={48} />
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isFree && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
              Free
            </span>
          )}
          {matchScore && (
            <span className="px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded flex items-center">
              <TrendingUp size={10} className="mr-1" />
              {matchScore}% match
            </span>
          )}
          {isEnrolled && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
              Enrolled
            </span>
          )}
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-40">
          <button
            onClick={() => onViewDetails?.(course)}
            className="bg-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-200"
          >
            <Play className="text-primary-600 ml-1" size={24} />
          </button>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
              {title}
            </h3>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 ml-2"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          
          {provider && (
            <p className="text-sm text-primary-600 font-medium">{provider}</p>
          )}
          
          <p className="text-gray-600 text-sm">{instructor}</p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Course Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{formatDuration(duration)}</span>
          </div>
          
          {difficulty && (
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </span>
            </div>
          )}
          
          {studentCount && (
            <div className="flex items-center">
              <Users size={14} className="mr-1" />
              <span>{studentCount?.toLocaleString()} students</span>
            </div>
          )}
          
          {certificateAvailable && (
            <div className="flex items-center">
              <Award size={14} className="mr-1" />
              <span>Certificate</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  className={`${
                    index < Math.floor(rating)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {rating} ({studentCount || 0})
            </span>
          </div>
        )}

        {/* Progress Bar (if enrolled) */}
        {showProgress && progress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Course Dates */}
        {(startDate || endDate) && (
          <div className="mb-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              {startDate && endDate ? (
                <span>
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </span>
              ) : startDate ? (
                <span>Starts {new Date(startDate).toLocaleDateString()}</span>
              ) : (
                <span>Ends {new Date(endDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Price */}
          <div className="flex items-center space-x-2">
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice}
              </span>
            )}
            <span className={`font-semibold ${isFree ? 'text-green-600' : 'text-gray-900'}`}>
              {formatPrice(price)}
            </span>
          </div>

          {/* Action Button */}
          <div className="flex gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(course)}
                className="btn-secondary text-sm"
              >
                View Details
              </button>
            )}
            
            {isEnrolled ? (
              <button className="btn-secondary text-sm flex items-center">
                <CheckCircle size={14} className="mr-1" />
                Continue
              </button>
            ) : (
              <button
                onClick={() => onEnroll?.(course)}
                className="btn-primary text-sm"
              >
                {isFree ? 'Enroll Free' : 'Enroll Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

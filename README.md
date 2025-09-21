# Disha AI - Career Builder Web Application

A comprehensive, AI-powered career building platform that helps users develop their professional profiles, build optimized resumes, find relevant courses, verify certifications, and discover job opportunities.

## 🌟 Features

### Core Functionality
- **AI-Powered Career Insights**: Intelligent recommendations for courses, jobs, and career development
- **Profile Management**: Comprehensive user profiles with skill tracking and progress analytics
- **Resume Builder**: Dynamic resume creation with ATS optimization and multiple templates
- **Job Matching**: Smart job search with personalized recommendations and application tracking
- **Certification Verification**: AI-powered certificate validation and skill mapping
- **Learning Path Recommendations**: Personalized course suggestions based on career goals

### Technical Features
- **Full-Stack Architecture**: React.js frontend with Node.js/Express backend
- **Modern UI/UX**: Responsive design with Tailwind CSS and intuitive navigation
- **Real-time Updates**: Live progress tracking and instant feedback
- **File Upload**: Resume and certificate document handling with drag-and-drop
- **Data Analytics**: Progress visualization with charts and insights
- **API Integration**: RESTful API design with proper error handling

## 🏗️ Architecture

```
disha-ai/
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB/Mongoose schemas
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic and AI services
│   ├── middleware/         # Authentication and validation
│   └── uploads/            # File storage directory
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/disha-ai
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   
   # AI Service Configuration (Optional)
   OPENAI_API_KEY=your-openai-api-key
   AZURE_AI_ENDPOINT=your-azure-endpoint
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name disha-mongodb mongo:latest
   ```

5. **Run the backend server**
   ```bash
   npm start
   ```
   
   The API server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_APP_NAME=Disha AI
   REACT_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   The React app will start on `http://localhost:3000`

## 📱 Usage Guide

### 1. Profile Setup
- Navigate to Profile section
- Fill in personal and professional information
- Upload your resume for AI parsing
- Add skills, experience, and education details

### 2. Resume Building
- Use the Resume Builder to create professional resumes
- Choose from multiple templates (Modern, Classic, Minimal, Creative)
- Get AI-powered optimization suggestions
- Download in PDF or DOCX formats

### 3. Job Search
- Browse personalized job recommendations
- Use advanced filters (location, salary, experience level)
- Save interesting positions
- Apply directly through the platform

### 4. Certification Management
- Upload certificate documents
- Get AI verification for authenticity
- Track certification expiry dates
- Map certifications to relevant skills

### 5. Learning Recommendations
- Receive personalized course suggestions
- Track learning progress
- View analytics and insights

## 🛠️ Development

### Available Scripts

**Backend**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run test       # Run test suite
npm run lint       # Run ESLint
```

**Frontend**
```bash
npm start          # Start development server
npm run build      # Build for production
npm run test       # Run test suite
npm run eject      # Eject from Create React App
```

### Database Schema

The application uses MongoDB with the following main collections:

- **users**: User profiles and authentication data
- **courses**: Course catalog and recommendations
- **certifications**: User certifications and verification data
- **jobs**: Job listings and application tracking

### API Endpoints

**Profile Management**
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update profile
- `POST /api/profile/:userId/resume` - Upload resume

**Course Recommendations**
- `GET /api/courses/recommendations/:userId` - Get personalized courses
- `GET /api/courses/search` - Search courses
- `POST /api/courses/:courseId/enroll` - Enroll in course

**Job Search & Matching**
- `GET /api/jobs/search` - Search jobs with filters
- `GET /api/jobs/recommendations/:userId` - Get job recommendations
- `POST /api/jobs/:jobId/apply` - Apply to job

**Resume Builder**
- `GET /api/resume/:userId` - Get resume data
- `PUT /api/resume/:userId` - Update resume
- `POST /api/resume/:userId/generate` - Generate resume file
- `POST /api/resume/:userId/optimize` - Get optimization suggestions

**Certification Verification**
- `POST /api/certifications/:userId` - Add certification
- `POST /api/certifications/verify` - Verify certificate with AI

**Progress Tracking**
- `GET /api/progress/:userId` - Get dashboard data
- `PUT /api/progress/:userId` - Update progress

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Test Coverage
- Unit tests for API endpoints
- Integration tests for database operations
- Component tests for React components
- End-to-end tests for user workflows

## 🚦 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure production environment**
   - Update `.env` files with production URLs
   - Set up MongoDB Atlas or production database
   - Configure file storage (AWS S3, Google Cloud, etc.)

3. **Deploy backend**
   ```bash
   cd backend
   npm start
   ```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, AWS S3
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🔧 Configuration

### Environment Variables

**Backend Configuration**
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `MAX_FILE_SIZE`: Maximum upload file size
- `OPENAI_API_KEY`: OpenAI API key for AI features

**Frontend Configuration**
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_APP_NAME`: Application name

### File Upload Configuration
- Maximum file size: 10MB
- Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG
- Storage: Local filesystem (configurable to cloud storage)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration for code style
- Write tests for new features
- Update documentation for API changes
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React.js and the React ecosystem
- Node.js and Express.js communities
- MongoDB for flexible data storage
- Tailwind CSS for rapid UI development
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs` when running locally

---

**Built with ❤️ using modern web technologies for career development and professional growth.**

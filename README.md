# 🎥 Video Proctoring System

A comprehensive video proctoring application built with React and Node.js that monitors candidates during online interviews using AI-powered face detection, object recognition, and audio analysis.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Features

### 🔍 Real-time Monitoring
- **Face Detection**: Monitors for no face, multiple faces, and looking away
- **Object Detection**: Identifies suspicious items (phones, books, laptops)
- **Audio Analysis**: Detects background voices and unusual audio patterns
- **Focus Tracking**: Eye gaze and attention monitoring

### 📊 Comprehensive Reporting
- Real-time event logging with timestamps
- Automatic scoring and deduction system
- Video recording with synchronized events
- Detailed candidate reports and analytics

### 🛡️ Security Features
- Secure video upload and storage
- Event-based monitoring with configurable thresholds
- Encrypted data transmission
- Comprehensive audit trails

## 📁 Project Structure

```
video-proctoring/
├── 🔧 backend/                 # Node.js/Express API server
│   ├── controllers/            # Route handlers
│   │   └── candidateController.js
│   ├── models/                # MongoDB schemas
│   │   └── Candidate.js
│   ├── routes/                # API endpoints
│   │   └── candidateRoutes.js
│   ├── config/                # Database configuration
│   │   └── db.js
│   ├── utils/                 # Helper functions
│   │   └── calculateScore.js
│   ├── uploads/               # Video file storage
│   ├── scripts/               # Database utilities
│   │   └── seedCandidates.js
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   └── package.json
│
├── 🎨 frontend/               # React application
│   ├── public/
│   │   ├── models/            # Face-API.js models
│   │   └── index.html
│   └── src/
│       ├── components/        # React components
│       │   ├── InterviewScreen.jsx  # Main interview interface
│       │   ├── Report.jsx           # Results display
│       │   └── ui/                  # Reusable UI components
│       │       ├── button.jsx
│       │       └── card.jsx
│       ├── services/          # API communication
│       │   └── api.js
│       ├── utils/             # AI detection utilities
│       │   ├── focusDetection.js    # Eye gaze tracking
│       │   └── objectDetection.js   # COCO-SSD integration
│       ├── App.jsx            # Main app component
│       ├── index.js           # React entry point
│       └── package.json
│
├── 📝 scripts/                # Database utilities
│   └── seedCandidates.js      # Sample data seeding
├── 🔒 .env.example            # Environment template
├── 📋 package.json            # Workspace configuration
└── 📖 README.md
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MongoDB** - Choose one:
  - [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud - Recommended)
  - [Local MongoDB](https://www.mongodb.com/try/download/community) (Local development)
- **Git** - [Download](https://git-scm.com/)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Camera**: Webcam access required
- **Microphone**: Audio input required

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/video-proctoring.git
cd video-proctoring
```

### 2. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
# For Windows users:
copy .env.example .env
notepad .env
```

**Configure your `.env` file:**
```env
# MongoDB Connection (choose one)
# For MongoDB Atlas:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/video-proctoring

# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/video-proctoring

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FACEAPI_MODELS_URL=/models
```

### 3. Install Dependencies
```bash
# Install all dependencies for both frontend and backend
npm run install:all

# Or install individually:
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 4. Download Face Detection Models
The application requires Face-API.js models for face detection:

```bash
# Create models directory
mkdir -p frontend/public/models

# Download models (choose one method):

# Method 1: Direct download (recommended)
cd frontend/public/models
curl -L -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -L -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1.bin
curl -L -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -L -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1.bin

# Method 2: Using npm script (if available)
npm run download:models
```

### 5. Start the Application
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### 6. Initialize Database (Optional)
```bash
# Seed the database with sample data
npm run seed
```

## 🌐 Access the Application

Once started, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (if implemented)

## 📖 Detailed Setup Guide

### MongoDB Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`

#### Option B: Local MongoDB
```bash
# Install MongoDB Community Edition
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Windows - Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod

# Create database (optional)
mongosh
use video-proctoring
```

### Face Detection Models Setup

The application uses Face-API.js for face detection. Models must be placed in `frontend/public/models/`:

**Required Models:**
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1.bin`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1.bin`

**Download Script:**
```bash
#!/bin/bash
# save as download-models.sh
mkdir -p frontend/public/models
cd frontend/public/models

BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

curl -L -O "$BASE_URL/tiny_face_detector_model-weights_manifest.json"
curl -L -O "$BASE_URL/tiny_face_detector_model-shard1.bin"
curl -L -O "$BASE_URL/face_landmark_68_model-weights_manifest.json" 
curl -L -O "$BASE_URL/face_landmark_68_model-shard1.bin"

echo "✅ Models downloaded successfully!"
```

## 🎯 Usage Guide

### Starting an Interview

1. **Open the application** at http://localhost:3000
2. **Grant permissions** for camera and microphone access
3. **Wait for initialization** - models and camera setup
4. **Begin interview** - monitoring starts automatically

### Monitoring Features

#### Face Detection
- **No Face**: Triggers after 10 seconds without detecting a face
- **Multiple Faces**: Immediate detection of additional people
- **Looking Away**: Triggers after 5 seconds of looking away from screen

#### Object Detection
- **Suspicious Items**: Detects phones, books, laptops, tablets
- **Real-time Recognition**: Uses COCO-SSD model for object classification

#### Audio Analysis
- **Background Voices**: Detects voices when candidate's mouth is closed
- **Audio Anomalies**: Identifies unusual audio patterns
- **Calibration**: 5-second calibration period for baseline audio

### Scoring System

Events are automatically scored with deductions:
- **No Face**: -5 points
- **Multiple Faces**: -20 points  
- **Looking Away**: -5 points
- **Suspicious Items**: -10 points
- **Audio Anomalies**: Logged for review

### Ending an Interview

1. **Click "End Interview"** button
2. **Video processing** - automatic upload and processing
3. **Report generation** - view detailed results
4. **Data storage** - all events saved to database

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```env
# Database
MONGO_URI=mongodb://localhost:27017/video-proctoring
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads

# Security
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Configuration
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FACEAPI_MODELS_URL=/models

# Feature Flags
REACT_APP_ENABLE_AUDIO_DETECTION=true
REACT_APP_ENABLE_OBJECT_DETECTION=true
REACT_APP_DEBUG_MODE=false
```

### Monitoring Thresholds

You can adjust detection sensitivity in the code:

```javascript
// frontend/src/components/InterviewScreen.jsx

// Face detection thresholds
const NO_FACE_THRESHOLD = 10000;      // 10 seconds
const LOOKING_AWAY_THRESHOLD = 5000;  // 5 seconds

// Audio detection thresholds  
const AUDIO_RMS_THRESHOLD = 0.0016;
const AUDIO_BAND_DB_THRESHOLD = -78;
const MOUTH_OPEN_THRESHOLD = 0.28;
```

## 🚀 Deployment

### Production Environment Setup

1. **Environment Variables**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/video-proctoring-prod
PORT=5000
REACT_APP_API_URL=https://your-backend-domain.com
```

2. **Build Frontend**
```bash
cd frontend
npm run build
```

3. **Start Backend**
```bash
cd backend
npm start
```

### Deployment Options

#### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up

# Deploy frontend
cd ../frontend  
npm run build
# Upload build folder to your preferred static hosting
```

#### Option 2: Heroku
```bash
# Backend deployment
cd backend
heroku create your-app-backend
git push heroku main

# Frontend deployment
cd ../frontend
npm run build
# Deploy to Netlify/Vercel
```

#### Option 3: Docker
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB production database setup
- [ ] SSL certificates configured (HTTPS)
- [ ] CORS origins updated for production domains
- [ ] File upload limits and storage configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security headers configured

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Run tests with coverage
npm run test:coverage
```

### Manual Testing Checklist

#### Camera & Audio
- [ ] Camera permission granted
- [ ] Video feed displays correctly
- [ ] Audio permission granted
- [ ] Microphone captures audio

#### Face Detection
- [ ] Single face detected correctly
- [ ] No face triggers after 10 seconds
- [ ] Multiple faces detected immediately
- [ ] Looking away triggers after 5 seconds

#### Object Detection
- [ ] Phone detection works
- [ ] Book detection works  
- [ ] Laptop detection works
- [ ] False positives minimized

#### Recording & Upload
- [ ] Video recording starts automatically
- [ ] Recording stops on interview end
- [ ] Video uploads successfully
- [ ] File size within limits

## 🐛 Troubleshooting

### Common Issues

#### Camera/Microphone Not Working
```javascript
// Check browser permissions
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => console.log('✅ Media access granted'))
  .catch(err => console.error('❌ Media access denied:', err));
```

**Solutions:**
- Ensure HTTPS or localhost (required for media access)
- Check browser permissions settings
- Try different browser
- Restart browser/computer

#### Models Not Loading
**Error**: `Failed to load face detection models`

**Solutions:**
- Verify models exist in `frontend/public/models/`
- Check file permissions
- Ensure correct model file names
- Try downloading models again

#### Database Connection Failed
**Error**: `MongoNetworkError` or `ECONNREFUSED`

**Solutions:**
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure database user has correct permissions
- Check network connectivity for Atlas

#### Build Failures
**Error**: `Module not found` or build errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# For frontend specific issues
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable debug logging:
```env
REACT_APP_DEBUG_MODE=true
NODE_ENV=development
```

### Performance Issues

**Slow Detection:**
- Reduce video resolution
- Increase detection intervals
- Optimize model loading

**High CPU Usage:**
- Adjust detection frequency
- Use smaller models
- Implement detection throttling

## 📊 API Documentation

### Endpoints

#### Candidates
```
POST   /api/candidates          # Create new candidate
GET    /api/candidates/:id      # Get candidate details
PUT    /api/candidates/:id      # Update candidate
DELETE /api/candidates/:id      # Delete candidate
```

#### Interview Management
```
POST   /api/interviews/start    # Start interview session
POST   /api/interviews/end      # End interview session
POST   /api/events             # Log monitoring events
POST   /api/upload             # Upload video files
```

#### Reports
```
GET    /api/reports/:id         # Get interview report
GET    /api/reports/:id/events  # Get event timeline
GET    /api/reports/:id/score   # Get calculated score
```

### Request/Response Examples

#### Start Interview
```javascript
// POST /api/interviews/start
{
  "candidateId": "507f1f77bcf86cd799439011"
}

// Response
{
  "success": true,
  "sessionId": "interview_12345",
  "startTime": "2024-01-15T10:30:00Z"
}
```

#### Log Event
```javascript
// POST /api/events
{
  "candidateId": "507f1f77bcf86cd799439011",
  "event": "FOCUS_LOST",
  "timestamp": "2024-01-15T10:35:00Z",
  "deduction": 5,
  "metadata": {
    "duration": 3000,
    "confidence": 0.95
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests for new features**
5. **Ensure all tests pass**
   ```bash
   npm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Code Style

- **JavaScript**: ESLint + Prettier
- **React**: Functional components with hooks
- **Node.js**: ES modules, async/await
- **Database**: Mongoose ODM

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Face-API.js** - Face detection and recognition
- **TensorFlow.js** - Object detection (COCO-SSD)
- **React** - Frontend framework
- **Express.js** - Backend framework
- **MongoDB** - Database
- **Tailwind CSS** - Styling

## 📞 Support

Need help? Here's how to get support:

- **Documentation**: Check this README and inline code comments
- **Issues**: [Open an issue](https://github.com/yourusername/video-proctoring/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/video-proctoring/discussions)
- **Email**: support@yourcompany.com

## 🔄 Changelog

### v1.0.0 (Current)
- ✅ Real-time face detection and monitoring
- ✅ Object detection for suspicious items
- ✅ Audio analysis and background voice detection
- ✅ Video recording and upload
- ✅ Comprehensive reporting system
- ✅ MongoDB integration
- ✅ Responsive UI with Tailwind CSS

### Upcoming Features
- 🔄 Advanced analytics dashboard
- 🔄 Multi-language support
- 🔄 Integration with popular LMS platforms
- 🔄 Enhanced security features
- 🔄 Mobile app support

---

**Made with ❤️ for secure online assessments**
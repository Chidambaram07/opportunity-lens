# 🔍 Opportunity Lens
### AI-Powered Startup Opportunity Discovery Using NLP

🌐 **Live Demo:** [Opportunity Lens](https://opportunity-lens-eta.vercel.app/)

🚀 **Backend API:** [Opportunity Lens API](https://opportunity-lens-api.onrender.com/)

📚 **API Documentation:** [Swagger UI](https://opportunity-lens-api.onrender.com/docs)

## 📌 Overview

Opportunity Lens is an AI-powered platform designed to identify potential startup opportunities by analyzing real-world user complaints and discussions.

People frequently share their problems, frustrations, and unmet needs in online communities. Opportunity Lens applies Natural Language Processing (NLP), sentiment analysis, and topic clustering techniques to uncover recurring pain points and help transform them into potential business opportunities.

The platform aims to bridge the gap between real-world problems and entrepreneurial innovation through data-driven analysis.
<img width="1897" height="1020" alt="image" src="https://github.com/user-attachments/assets/b6cd3a9c-1426-4c59-960f-4e2ab326f1c1" />


## ✨ Key Features

- **Data Collection:** Collect user-generated discussions from Reddit using the Reddit API.
- **Text Preprocessing:** Clean and normalize raw text for downstream NLP analysis.
- **Pain-Point Detection:** Analyze user complaints to identify problems and unmet needs.
- **Sentiment Analysis:** Use transformer-based NLP models to analyze sentiment.
- **Topic Modeling:** Discover recurring themes and group similar complaints using topic modeling and clustering techniques.
- **Opportunity Analysis:** Evaluate potential startup opportunities using relevant signals such as urgency, emotional intensity, and credibility.
- **Interactive Dashboard:** Present analyzed results through a web-based interface.

*Feature availability depends on the current implementation and configured data sources.*

## 🏗️ System Architecture

Opportunity Lens follows a frontend-backend architecture with an NLP processing pipeline.

```text
        User
         |
         v
 React + TypeScript Frontend
       (Vercel)
         |
         v
     FastAPI Backend
       (Render)
         |
    +----+---------+
    |              |
    v              v
 NLP Pipeline   MongoDB Atlas
    |
    +-- Text Preprocessing
    +-- Sentiment Analysis
    +-- Topic Modeling
    +-- Clustering
    +-- Opportunity Analysis
```

### Architecture Components

- **Frontend:** Provides the user interface for interacting with the platform.
- **Backend:** Handles API requests and coordinates application processing.
- **NLP Engine:** Processes text, analyzes sentiment, and discovers recurring themes.
- **Database:** MongoDB Atlas stores application data.
- **Data Collection:** Reddit API integration provides user-generated discussions for analysis.

## 🔄 Workflow

1. **Data Collection:** Retrieve discussions and complaints from configured data sources.
2. **Text Preprocessing:** Clean raw text and prepare it for NLP models.
3. **Pain-Point Analysis:** Identify complaints and potential unmet user needs.
4. **Sentiment Analysis:** Analyze the emotional tone of the collected text.
5. **Topic Modeling and Clustering:** Group similar complaints to discover recurring problems.
6. **Opportunity Analysis:** Evaluate identified problems using relevant opportunity signals.
7. **Visualization:** Present the analysis through the web application.

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn

### Database
- MongoDB Atlas

### NLP and Machine Learning
- PyTorch
- Hugging Face Transformers
- Sentence Transformers
- BERTopic
- Scikit-learn

### Data Collection and AI Integration
- Reddit API
- PRAW
- Groq API

### Deployment
- Vercel — Frontend hosting
- Render — Backend hosting
- MongoDB Atlas — Cloud database

## 🌐 Live Application

Try the deployed application:

**Frontend:** https://opportunity-lens-eta.vercel.app/

**Backend API:** https://opportunity-lens-api.onrender.com/

**Interactive API Documentation:** https://opportunity-lens-api.onrender.com/docs

The backend is hosted separately from the frontend. API requests from the deployed frontend must be configured to use the public backend URL.

## 🚀 Run Locally

### Prerequisites

Install the following tools before starting:

- Python 3.11
- Node.js and npm
- MongoDB Atlas account or another supported MongoDB deployment
- API credentials for any external services you enable

### 1. Clone the Repository

```bash
git clone https://github.com/Chidambaram07/opportunity-lens.git
cd opportunity-lens
```

### 2. Set Up the Backend

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables using your project's expected variable names.

Start the FastAPI backend:

```bash
uvicorn api.main:app --reload
```

The backend should run at:

http://localhost:8000

Open the API documentation at:

http://localhost:8000/docs

### 3. Set Up the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

Configure the frontend API base URL to point to your local backend during development.

## 🔐 Environment Variables

The application may require environment variables for database connectivity and external integrations.

Configure the variables expected by your application, such as:

- MongoDB connection URI
- Reddit API credentials, if required
- Groq API key, if enabled
- Other service credentials required by your configuration

Keep credentials in a local `.env` file or your deployment platform's environment settings.

**Never commit API keys, passwords, database credentials, or other secrets to GitHub.** Ensure that `.env` files containing secrets are excluded through `.gitignore`.

## 🔮 Future Enhancements

- Improve the accuracy of pain-point detection and opportunity ranking.
- Expand data collection from additional sources.
- Add historical trend analysis for recurring user problems.
- Provide explanations for why particular opportunities receive high scores.
- Improve automated testing, monitoring, and application scalability.

## 👨‍💻 Author

**Chidambaram M**

Computer Science and Engineering  
Thiagarajar College of Engineering

- GitHub: [Chidambaram07](https://github.com/Chidambaram07)
- LinkedIn: [Chidambaram Muthukumar](https://www.linkedin.com/in/chidambaram-muthukumar/)
- LeetCode: [Chidambaram01](https://leetcode.com/u/chidambaram01/)

---

⭐ If you find this project interesting, consider starring the repository.

*Opportunity Lens explores how Natural Language Processing can help uncover real-world problems and identify potential entrepreneurial opportunities.*

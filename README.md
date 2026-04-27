# 🛡️ FairAI Guardian

**Real-Time AI Bias Prevention, Governance & Compliance Platform**

FairAI Guardian is an enterprise-grade platform designed to monitor, detect, and mitigate bias in AI models in real-time. It provides a comprehensive suite of tools for AI governance, from automated compliance auditing to high-fidelity conversational explainability.

### 🔗 Live URLs
- **Frontend App**: [https://fairai-494213-f8.web.app](https://fairai-494213-f8.web.app)
- **Backend API**: [https://fairai-guardian-server-842068417000.us-central1.run.app/api](https://fairai-guardian-server-842068417000.us-central1.run.app/api)

---

## 🚀 Key Features

### 🎙️ AI Auditor (True Speech-to-Speech)
A RAG-powered (Retrieval-Augmented Generation) conversational assistant that explains AI decisions and compliance status.
- **High-Fidelity Voice**: Integrated with Google Cloud Vertex AI (Neural2) for natural, human-like speech.
- **Explainable AI**: Breaks down complex model decisions into plain English.
- **Regulatory Knowledge**: Grounded in EU AI Act, NIST AI RMF, and Fair Lending laws.

### 📉 Real-Time Drift & Bias Analysis
Continuous monitoring of model performance and demographic parity.
- **Automated Baselining**: Tracks performance against statistical thresholds.
- **One-Click Testing**: Simulate drift scenarios to validate monitoring alerts.
- **KPI Dashboards**: Visualizes Bias Score, Legal Risk, and Ethical Confidence.

### ⚖️ Compliance & Governance
Automated checks against global regulatory frameworks.
- **Policy Interceptor**: Real-time enforcement of fairness policies on incoming data.
- **Violation Tracking**: Instant alerts for demographic parity or disparate impact violations.
- **Audit Trails**: Secure logging of all AI decisions and auditor interactions.

### 🔍 BigQuery Explorer
Direct integration with enterprise data warehouses for deep-dive forensic analysis of bias patterns.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **React 18 & Vite**: Lightning-fast development and optimized production builds.
- **Tailwind CSS**: Modern, responsive UI with a premium dark-mode aesthetic.
- **Framer Motion**: Smooth micro-animations and page transitions.
- **Lucide & Recharts**: High-quality iconography and interactive data visualizations.

### Backend Infrastructure
- **Node.js & Express**: High-performance API orchestration.
- **Socket.io**: Real-time bidirectional communication for live monitoring alerts.
- **Google Cloud Run**: Serverless containerized backend for automatic scaling.

### 🤖 Google Cloud AI & Data Services
- **Vertex AI (Gemini Pro/Flash)**: Powers the **RAG (Retrieval-Augmented Generation)** engine for deep compliance analysis and policy explanations.
- **Cloud Text-to-Speech (Neural2)**: Provides ultra-realistic, high-fidelity human voices for the AI Auditor.
- **BigQuery**: Acts as the central data warehouse for forensic bias analysis and large-scale data storage.
- **Firestore**: NoSQL database for real-time policy management and report caching.
- **Cloud Pub/Sub**: Handles event-driven messaging for real-time drift detection pipelines.
- **Firebase Hosting**: Fast, global content delivery for the web interface.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Google Cloud Service Account with permissions for Vertex AI, BigQuery, and TTS.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avi36005/GSC-Kryptonite.git
   cd GSC-Kryptonite
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   # Create a .env file with your GCP credentials
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Run Locally**
   ```bash
   # From the root directory
   npm run dev
   ```

---

## 📜 Deployment

- **Frontend**: Deployed via Firebase Hosting.
- **Backend**: Deployed via Google Cloud Run.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed for the Google AI Hackathon / GSC** 🚀

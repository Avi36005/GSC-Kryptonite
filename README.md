# 🛡️ FairAI Guardian

**Real-Time AI Bias Prevention, Governance & Compliance Platform**

FairAI Guardian is an enterprise-grade platform designed to monitor, detect, and mitigate bias in AI models in real-time. It provides a comprehensive suite of tools for AI governance, from automated compliance auditing to high-fidelity conversational explainability.

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

- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide (Icons), Recharts (Visualizations).
- **Backend**: Node.js, Express, Socket.io (Real-time updates).
- **Google Cloud Platform**:
  - **Vertex AI**: Gemini Pro/Flash for RAG and Chat.
  - **Cloud TTS/STT**: Neural2 high-fidelity voice processing.
  - **BigQuery**: Large-scale data analytics.
  - **Cloud Run**: Serverless backend deployment.
  - **Firebase**: Global hosting and frontend delivery.

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

<p align="center">
  <img src="https://img.shields.io/badge/Google_Solution_Challenge-2026-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="GSC 2026" />
  <img src="https://img.shields.io/badge/Team-Kryptonite-00C853?style=for-the-badge" alt="Team Kryptonite" />
  <img src="https://img.shields.io/badge/Powered_by-Gemini_2.5-886FBF?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 2.5" />
</p>

<h1 align="center">🛡️ FairAI Guardian</h1>
<p align="center"><b>AI-Powered Governance Platform for Responsible & Unbiased Artificial Intelligence</b></p>
<p align="center">
  <i>Intercept bias before it causes harm — in real time, across every domain.</i>
</p>

---

## 📑 Table of Contents

- [🏆 About the Project](#-about-the-project)
- [👥 Team Kryptonite](#-team-kryptonite)
- [🧠 Problem Statement](#-problem-statement)
- [💡 Solution Overview](#-solution-overview)
- [🔗 Links](#-links)
- [🚀 Key Features](#-key-features)
- [🎯 UN Sustainable Development Goals](#-un-sustainable-development-goals)
- [🏗️ System Architecture](#️-system-architecture)
- [⚙️ Data Processing Pipeline](#️-data-processing-pipeline)
- [🤖 Multi-Agent System](#-multi-agent-system)
- [☁️ Google Cloud Services Used](#️-google-cloud-services-used)
- [🗂️ Project Structure](#️-project-structure)
- [🖥️ Getting Started](#️-getting-started)
- [📄 License](#-license)

---

## 🏆 About the Project

**FairAI Guardian** is a full-stack AI governance platform built for the **Google Solution Challenge 2026**. It acts as a real-time middleware that sits between AI models and their consumers, intercepting every automated decision, detecting bias, ensuring legal compliance, and providing explainable, auditable outcomes — all powered by **Google's Gemini 2.5** family of models via **Vertex AI**.

> **Tagline:** _"Compliance by Design — The world's first AI-powered auditor with deep system awareness."_

---

## 👥 Team Kryptonite

| Name |
|---|
| **Hardik Hinduja** |
| **Sahil Deshmukh** |
| **Siddharth Dey** |
| **Avinash Gehi** |

---

## 🧠 Problem Statement

**Unbiased AI Decision — Ensuring Fairness and Detecting Bias in Automated Decisions**

Computer programs now make life-changing decisions about who gets a job, a bank loan, or even medical care. However, if these programs learn from flawed or unfair historical data, they will repeat and amplify those exact same discriminatory mistakes.

---

## 💡 Solution Overview

FairAI Guardian provides an end-to-end, Google Cloud-native AI governance solution:

1. **Upload** a dataset (CSV) containing decision records (hiring, loans, admissions, etc.)
2. **Analyze** it with Gemini 2.5 Pro for deep bias detection, proxy variable identification, and statistical disparity analysis
3. **Intercept** individual decisions in real-time through a multi-agent pipeline that detects bias, assesses risk, checks compliance, and generates explanations
4. **Auto-fix** biased decisions with AI-powered debiasing that rewrites unfair outcomes while preserving intent
5. **Monitor** data drift and model degradation over time with BigQuery analytics
6. **Chat** with an AI Auditor that has full system awareness — it knows every decision, every bias flag, every compliance violation
7. **Export** corrected, debiased datasets ready for production use

---

## 🔗 Links

| Resource | Link |
|---|---|
| 🌐 **Live Application** | _Deployed via Firebase Hosting + Cloud Run_ |
| 🎬 **Demo Video (3 min)** | _[Coming Soon]_ |
| 📦 **Repository** | [github.com/Avi36005/GSC-Kryptonite](https://github.com/Avi36005/GSC-Kryptonite) |

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **📊 Bias Detection Engine** | Gemini 2.5 Pro-powered deep analysis of datasets for direct bias, proxy discrimination, and statistical disparities |
| **🛡️ Real-Time Interceptor** | Multi-agent pipeline that intercepts AI decisions in <2s SLA with fail-safe bypass |
| **⚖️ Compliance Checker** | Automated verification against EU AI Act, GDPR, Title VII, ADEA, HIPAA, FERPA, and ECOA |
| **🤖 AI Auditor Chatbot** | Gemini 2.5 Flash-powered conversational AI with full system awareness via Firestore |
| **🔧 Auto Bias Fix** | AI-generated corrections that rewrite biased decisions to be fair and compliant |
| **📈 Drift Analysis** | BigQuery-backed temporal analysis of bias trends and model degradation |
| **🌍 Multi-Domain Support** | Pre-configured for Hiring, Finance, Healthcare, Education, and Government sectors |
| **📥 CSV Upload & Debias** | Upload → Analyze → Download corrected dataset, fully automated |
| **🔌 Real-Time Updates** | Socket.IO for live bias alerts and system status broadcasting |
| **🏷️ Explainability Engine** | Natural language explanations for every intercepted decision |

---

## 🎯 UN Sustainable Development Goals

FairAI Guardian directly addresses the following UN SDGs:

| SDG | How We Contribute |
|---|---|
| **SDG 10 — Reduced Inequalities** | Detects and eliminates algorithmic bias that disproportionately affects marginalized communities in hiring, lending, healthcare, and education |
| **SDG 16 — Peace, Justice & Strong Institutions** | Ensures AI decision-making is transparent, accountable, and legally compliant with international frameworks |
| **SDG 8 — Decent Work & Economic Growth** | Prevents discriminatory hiring practices by auditing recruitment AI systems in real-time |
| **SDG 5 — Gender Equality** | Identifies and corrects gender-based bias in automated decision-making across all supported domains |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│  Landing → Dashboard → Analyzer → Interceptor → Compliance      │
│  FairWatch → Drift Analysis → AI Auditor Chat                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API + Socket.IO
┌──────────────────────────▼──────────────────────────────────────┐
│                     SERVER (Node.js + Express)                   │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ CSV Analysis │  │ Chat Routes  │  │ Interceptor Routes     │  │
│  │ (Upload +    │  │ (AI Auditor) │  │ (DecisionGuard Agent)  │  │
│  │  Debias)     │  │              │  │                        │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘  │
│         │                 │                    │                  │
│  ┌──────▼─────────────────▼────────────────────▼───────────────┐ │
│  │              MULTI-AGENT ORCHESTRATION LAYER                │ │
│  │  DecisionGuard → BiasDetection → Compliance → Explanation   │ │
│  │  RiskAssessment → AutoBiasFix → AuditChat                  │ │
│  └──────┬─────────────────┬────────────────────┬───────────────┘ │
│         │                 │                    │                  │
│  ┌──────▼───┐  ┌──────────▼──────┐  ┌─────────▼──────────────┐  │
│  │ Gemini   │  │ Gemini 2.5      │  │ Domain Configs         │  │
│  │ 2.5 Pro  │  │ Flash           │  │ (Hiring, Finance,      │  │
│  │(Vertex AI)│  │(Vertex AI)     │  │  Healthcare, etc.)     │  │
│  └──────────┘  └─────────────────┘  └────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   GOOGLE CLOUD PLATFORM                          │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Firestore  │  │ BigQuery   │  │ Pub/Sub    │  │ Cloud Run │ │
│  │ (Audit     │  │ (Drift     │  │ (Real-time │  │ (Backend  │ │
│  │  Logs +    │  │  Analysis  │  │  Alerts)   │  │  Deploy)  │ │
│  │  Chat)     │  │  + History)│  │            │  │           │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│                                                                  │
│  ┌────────────┐  ┌────────────────────────────────────────────┐  │
│  │ Firebase   │  │ Vertex AI (Gemini 2.5 Pro + Flash)        │  │
│  │ Hosting    │  │ Application Default Credentials (ADC)     │  │
│  │ (Frontend) │  │                                            │  │
│  └────────────┘  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Data Processing Pipeline

The platform processes data through a **4-phase pipeline**, each phase building on the previous:

### Phase 1 — Ingestion & Parsing
```
CSV Upload → Multer (50MB limit) → csv-parse → Column Statistics → Sample Extraction
```
- Accepts CSV files up to 50MB
- Parses with automatic header detection, empty line skipping, and column count relaxation
- Computes per-column statistics: type detection (numeric/categorical), min, max, mean, unique counts, frequency distributions
- Builds representative samples (first 10 + last 5 + random middle rows)

### Phase 2 — AI-Powered Bias Analysis
```
Statistics + Sample → Gemini 2.5 Pro Prompt → Structured JSON Report
```
- Domain-aware context injection (Hiring rules, Finance regulations, etc.)
- Compliance framework evaluation (Title VII, EU AI Act, GDPR, HIPAA, ECOA, FERPA)
- Outputs: `overallBiasScore`, `flaggedColumns`, `statisticalDisparities`, `complianceViolations`, `debiasingSuggestions`

### Phase 3 — Real-Time Decision Interception
```
Decision → DecisionGuard Agent → [BiasDetection ∥ RiskAssessment] → Compliance → Explanation
```
- **Parallel execution**: Bias detection and risk assessment run concurrently
- **SLA enforcement**: 2-second timeout with fail-safe bypass (FAIL OPEN)
- **Outcome**: APPROVED / INTERCEPTED / BYPASSED
- Non-blocking persistence to Firestore + BigQuery + Pub/Sub

### Phase 4 — Auto-Debiasing & Export
```
Bias Report + Original Data → Gemini 2.5 Pro → Transformation Instructions → Apply → Corrected CSV
```
- Supported transformations: `remove_column`, `anonymize` (hash/generalize/suppress), `rename_column`, `add_column`
- Generates downloadable corrected CSV
- Tracks all applied changes with reasoning

---

## 🤖 Multi-Agent System

FairAI Guardian uses a **7-agent architecture**, each with a specialized role:

| Agent | Model | Responsibility |
|---|---|---|
| **DecisionGuardAgent** | Orchestrator | Central coordinator — routes decisions through the pipeline with SLA enforcement |
| **BiasDetectionAgent** | Gemini 2.5 Pro | Detects direct bias, proxy variables, and statistical disparities |
| **ComplianceAgent** | Gemini 2.5 Pro | Verifies decisions against legal frameworks (EU AI Act, GDPR, Title VII, etc.) |
| **ExplanationAgent** | Gemini 2.5 Pro | Generates human-readable explanations for intercepted decisions |
| **RiskAssessmentAgent** | Gemini 2.5 Pro | Assesses systemic, legal, and reputational risk levels |
| **AutoBiasFixAgent** | Gemini 2.5 Pro | Rewrites biased decisions to be fair while preserving intent |
| **AuditChatAgent** | Gemini 2.5 Flash | Conversational AI auditor with full system awareness via Firestore |

---

## ☁️ Google Cloud Services Used

| Service | Purpose |
|---|---|
| **Vertex AI (Gemini 2.5 Pro)** | Deep reasoning — bias detection, compliance analysis, dataset auditing, auto-debiasing |
| **Vertex AI (Gemini 2.5 Flash)** | Fast inference — chatbot responses, dashboard insights, system status summaries |
| **Cloud Firestore** | Persistent audit logs, chat history, and decision records |
| **BigQuery** | Long-term decision analytics, drift detection, and temporal trend analysis |
| **Cloud Pub/Sub** | Real-time event streaming for bias alerts and system notifications |
| **Cloud Run** | Containerized backend deployment with auto-scaling |
| **Firebase Hosting** | Global CDN for the React frontend with SPA rewrites |
| **Application Default Credentials** | Unified auth — no API keys, service accounts in production |

---

## 🗂️ Project Structure

```
GSC-Kryptonite/
├── client/                          # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Audit/               # SystemStatusPanel
│   │   │   ├── Dashboard/           # KPI cards, AI Insights
│   │   │   └── Layout/              # Sidebar navigation
│   │   ├── context/                 # DomainContext (multi-domain state)
│   │   ├── pages/
│   │   │   ├── Landing.tsx          # Hero landing page
│   │   │   ├── Dashboard.tsx        # Overview KPIs and metrics
│   │   │   ├── Analyzer.tsx         # CSV upload & bias analysis
│   │   │   ├── Interceptor.tsx      # Real-time decision interception
│   │   │   ├── Compliance.tsx       # Legal compliance dashboard
│   │   │   ├── FairWatch.tsx        # Live fairness monitoring
│   │   │   ├── DriftAnalysis.tsx    # BigQuery drift visualization
│   │   │   └── AuditChat.tsx        # AI Auditor chatbot interface
│   │   └── services/
│   │       ├── api.ts               # REST API client
│   │       └── socket.ts            # Socket.IO client
│   └── vite.config.ts
│
├── server/                          # Node.js + Express Backend
│   ├── agents/                      # Multi-Agent System
│   │   ├── DecisionGuardAgent.js    # Orchestrator with SLA enforcement
│   │   ├── BiasDetectionAgent.js    # Gemini-powered bias analysis
│   │   ├── ComplianceAgent.js       # Legal framework verification
│   │   ├── ExplanationAgent.js      # Human-readable explanations
│   │   ├── RiskAssessmentAgent.js   # Risk level assessment
│   │   ├── AutoBiasFixAgent.js      # Automated bias correction
│   │   └── AuditChatAgent.js        # Conversational AI auditor
│   ├── domains/                     # Domain-Specific Configurations
│   │   ├── hiring.js               # Title VII, ADEA, NYC LL144
│   │   ├── finance.js              # ECOA, Fair Lending
│   │   ├── healthcare.js           # HIPAA, ACA
│   │   ├── education.js            # FERPA, Title IX
│   │   └── government.js           # Executive Orders, ADA
│   ├── routes/                      # Express API Routes
│   │   ├── api.js                   # Core system endpoints
│   │   ├── csvAnalysis.js           # CSV upload, analysis, debiasing
│   │   ├── chat.js                  # AI Auditor chat endpoint
│   │   ├── autofix.js               # Auto bias correction
│   │   └── insights.js              # AI-generated insights
│   ├── services/                    # Cloud Service Integrations
│   │   ├── geminiClient.js          # Vertex AI Gemini (Pro + Flash)
│   │   ├── firestoreService.js      # Cloud Firestore
│   │   ├── bigqueryService.js       # BigQuery analytics
│   │   ├── pubsubService.js         # Pub/Sub event streaming
│   │   └── systemState.js           # In-memory + Firestore state
│   ├── Dockerfile                   # Cloud Run container
│   └── index.js                     # Server entry point
│
├── data/
│   └── sample_biased_hiring.csv     # Sample dataset for testing
├── docs/
│   ├── bigquery_schema.json         # BigQuery table schema
│   └── system_architecture_analysis.md
├── firebase.json                    # Firebase Hosting config
├── .firebaserc                      # Firebase project binding
├── bq_schema.json                   # BigQuery schema (root)
└── .env.example                     # Environment template
```

---

## 🖥️ Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Google Cloud SDK** (`gcloud`) — [Install](https://cloud.google.com/sdk/docs/install)
- A **GCP Project** with the following APIs enabled:
  - Vertex AI API
  - Cloud Firestore API
  - BigQuery API
  - Cloud Pub/Sub API

### 1. Clone & Install

```bash
git clone https://github.com/Avi36005/GSC-Kryptonite.git
cd GSC-Kryptonite

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy the template
cp .env.example .env

# Edit .env with your GCP project ID
# VERTEX_PROJECT_ID=your-project-id
# FIREBASE_PROJECT_ID=your-project-id
# BIGQUERY_PROJECT_ID=your-project-id
```

### 3. Authenticate with Google Cloud

```bash
# Login to GCP
gcloud auth login

# Set Application Default Credentials (for Vertex AI, Firestore, BigQuery, Pub/Sub)
gcloud auth application-default login

# Set your project
gcloud config set project your-project-id
```

### 4. Run Locally

```bash
# Terminal 1 — Start the backend
cd server && npm run dev

# Terminal 2 — Start the frontend
cd client && npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5001` (API).

### 5. Deploy to Google Cloud

```bash
# Deploy backend to Cloud Run
cd server
gcloud run deploy fairai-guardian --source . --region us-central1

# Deploy frontend to Firebase Hosting
cd client && npm run build
firebase deploy --only hosting
```

---


## 📜 License

This project is built for the **Google Solution Challenge 2026** and is open-source under the [MIT License](https://opensource.org/licenses/MIT).

---

<p align="center">
  <b>Built with ❤️ by Team Kryptonite</b><br/>
  <i>Google Solution Challenge 2026</i>
</p>

# Robust Learning Under Label Noise for Real-World Classification Problems

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete, production-grade machine learning platform designed to benchmark, detect, and mitigate the detrimental effects of label noise in supervised classification datasets. 

Engineered with strict empirical integrity: **no mock data, no fake metrics, no hardcoded charts, and 100% computed results**.

---

## Table of Contents
1. [Project Overview & Research Motivation](#1-project-overview--research-motivation)
2. [Key Architectural Pillars](#2-key-architectural-pillars)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Installation & Setup](#5-installation--setup)
6. [Database Setup & Migrations](#6-database-setup--migrations)
7. [Running the Application](#7-running-the-application)
8. [Docker Deployment](#8-docker-deployment)
9. [Automated Test Suite](#9-automated-test-suite)
10. [Methodology & Algorithmic Foundation](#10-methodology--algorithmic-foundation)
    - [Noise Injection Strategy](#noise-injection-strategy)
    - [Confident Learning Detection](#confident-learning-detection)
    - [Robust Learning Models](#robust-learning-models)
11. [REST API Documentation](#11-rest-api-documentation)
12. [Publication-Grade PDF Reports](#12-publication-grade-pdf-reports)
13. [Limitations & Technical Discussion](#13-limitations--technical-discussion)

---

## 1. Project Overview & Research Motivation

Supervised machine learning algorithms rely critically on high-quality annotated data. In practical applications—ranging from medical diagnosis to fraud detection—human fatigue, ambiguous boundary criteria, automated web scraping, and sensor drift inject **label noise**. 

Standard statistical and deep learning classifiers possess sufficient capacity to memorize corrupted labels. This distorts the learned decision boundary around noisy samples, severely impairing out-of-sample generalization.

This platform provides an end-to-end laboratory where machine learning engineers and researchers can:
1. Upload real-world CSV/XLSX datasets or test against authentic peer-reviewed benchmarks.
2. Formulate controlled noise conditions (0%, 5%, 10%, 20%, 30%, 40%) applied strictly to the training split.
3. Diagnose suspicious labels via Confident-Learning-inspired out-of-fold probability estimation.
4. Train baseline conventional models alongside noise-resistant robust models (Sample-Weighted & Trimmed Pruning).
5. Compare performance curves and download publication-ready formal PDF evaluation reports.

---

## 2. Key Architectural Pillars

* **Empirical Honesty:** If a baseline classifier outperforms a robust model at low noise levels, the platform truthfully reports that finding. No results are manufactured.
* **Leakage-Free Protocol:** Label noise is injected **strictly into the training set**. The holdout validation and test sets remain pristine ground-truth references.
* **Reproducibility:** Experiments are bound to explicit random seeds, dataset SHA256 hashes, and deterministic splitting. Multi-seed repeats (seeds `[42, 123, 456]`) compute mean and standard deviation.
* **Separation of Concerns:** ML computations run natively in Python (`scikit-learn`, `numpy`, `scipy`). The frontend is a clean White + Blue professional interface built with Next.js and Tailwind CSS (no dark mode).

---

## 3. Technology Stack

### Machine Learning & Backend
- **Python 3.10+**
- **FastAPI**: Asynchronous RESTful API framework.
- **scikit-learn 1.4+**: Classification engines, cross-validation, and metrics.
- **Pandas & NumPy**: High-performance tabular transformation and vector math.
- **SQLAlchemy 2.0 & Alembic**: ORM and schema migration system.
- **ReportLab**: Programmatic PDF compilation for formal benchmark reports.
- **SQLite / PostgreSQL**: Dual database support (SQLite local default, PostgreSQL for Docker).

### Frontend Interface
- **Next.js 15 (App Router)** & **React 19**
- **TypeScript** (strict mode enabled)
- **Tailwind CSS**: Modern White + Blue professional design system.
- **Recharts**: Dynamic rendering of noise degradation curves.
- **Lucide React**: Clean modern icons.

---

## 4. Project Structure

```text
robust-learning-label-noise/
├── apps/
│   ├── api/                     # FastAPI Python Backend
│   │   ├── app/
│   │   │   ├── api/             # REST Endpoints (datasets, experiments, analysis)
│   │   │   ├── core/            # Configuration & Settings
│   │   │   ├── db/              # SQLAlchemy session & Base
│   │   │   ├── models/          # ORM Models (Dataset, Experiment)
│   │   │   ├── schemas/         # Pydantic V2 Schemas
│   │   │   ├── services/        # Service logic & background task runner
│   │   │   └── main.py          # FastAPI application entrypoint
│   │   └── Dockerfile
│   │
│   └── web/                     # Next.js Frontend
│       ├── app/
│       │   ├── datasets/        # Dataset catalog & inspection pages
│       │   ├── experiments/     # Experiment registry, wizard, and results
│       │   ├── analysis/        # Cross-experiment comparative charts
│       │   ├── methodology/     # Theoretical foundations & technical FAQ
│       │   ├── layout.tsx
│       │   └── page.tsx         # Platform Dashboard
│       ├── components/          # Reusable UI & Chart components
│       ├── lib/api.ts           # Typed API Client
│       └── Dockerfile
│
├── ml/                          # Core Machine Learning Engine
│   ├── preprocessing/           # Loader, TabularPreprocessor, DataSplitter
│   ├── noise/                   # LabelNoiseInjector (symmetric & asymmetric)
│   ├── detection/               # LabelIssueDetector (Confident Learning OOF)
│   ├── models/                  # Baseline & Robust Classifiers
│   ├── evaluation/              # ModelEvaluator & metrics calculation
│   ├── experiments/             # ExperimentRunner orchestrator
│   └── utils/                   # Benchmark datasets loader
│
├── migrations/                  # Alembic database migration versions
├── reports/                     # PDF ReportLab generator
├── storage/                     # Local filesystem dataset & report storage
├── tests/                       # Complete Pytest automated test suite
├── docker-compose.yml           # Multi-container Docker orchestration
├── requirements.txt             # Python dependencies
├── Makefile                     # Developer automation commands
└── .env.example                 # Environment configuration template
```

---

## 5. Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (Node v20+ recommended)
- npm 9+
- *(For complete laptop requirements and official download links, see [PREREQUISITES.md](PREREQUISITES.md).)*

### 1. Clone & Set Up Environment
```bash
git clone <repository_url>
cd robust-learning-label-noise
cp .env.example .env
```

### 2. Python Backend Setup
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd apps/web
npm install
cd ../..
```

---

## 6. Database Setup & Migrations

The system defaults to SQLite (`sqlite:///./storage/app.db`) for immediate zero-friction local execution. For production or Docker, set `DATABASE_URL=postgresql://...`.

Run the Alembic migration command:
```bash
python -m alembic upgrade head
```

---

## 7. Running the Application

### Option A: Running Locally

**Terminal 1 — Backend API:**
```bash
python -m uvicorn apps.api.app.main:app --reload --port 8000
```
*API will be available at:* `http://localhost:8000`  
*Interactive Swagger Documentation:* `http://localhost:8000/docs`

**Terminal 2 — Frontend Application:**
```bash
cd apps/web
npm run dev
```
*Frontend will be available at:* `http://localhost:3000`

---

## 8. Docker Deployment

Launch the entire ecosystem (PostgreSQL, Backend API, and Next.js Frontend) with a single command:

```bash
docker compose up --build
```

---

## 9. Automated Test Suite

The test suite validates every layer of the ML engine and API with real assertions:

```bash
python -m pytest tests/ -v
```

### Test Coverage Summary:
- `test_preprocessing.py`: CSV parsing, encoding, duplicate detection, and continuous target rejection.
- `test_noise.py`: Verifies exact noise ratios, immutability of original data, and deterministic seeds.
- `test_detection.py`: Confirms out-of-fold probability estimation and continuous suspiciousness scoring.
- `test_models.py`: Fits and evaluates baseline, sample-weighted, and trimmed classifiers.
- `test_evaluation.py`: Validates accuracy, precision, recall, F1, and confusion matrix arithmetic.
- `test_api.py`: Tests benchmark loading, experiment execution, status polling, and PDF report delivery.

---

## 10. Methodology & Algorithmic Foundation

### Noise Injection Strategy
Training labels $y_{\text{train}}$ are corrupted under controlled parameters:
- **Symmetric Noise:** Selects $n = \lfloor N \cdot \eta \rfloor$ samples and uniformly swaps $y_i$ with any other class $k \neq y_i$.
- **Asymmetric Noise:** Conditionally flips $y_i \to (y_i + 1) \pmod K$, simulating real-world annotator confusion between adjacent classes.

### Confident Learning Detection
Using stratified 5-fold cross-validation on $X_{\text{train}}$, we compute out-of-fold predicted class probabilities $P(k \mid x_i)$.
The continuous suspiciousness score is formulated as:
$$\text{Score}_i = \text{clip}\left( 0.5 \cdot (1 - P(y_i \mid x_i)) + 0.5 \cdot \max(0, P(\hat{y}_i \mid x_i) - P(y_i \mid x_i)), 0, 1 \right)$$
Samples with $\text{Score}_i \ge \theta$ ($\theta = 0.50$ by default) are diagnosed as **Potential Label Issues**.

### Robust Learning Models
1. **Robust Sample-Weighted Learning:**  
   Assigns weights $w_i = \text{clip}(1.0 - \text{Score}_i, 0.05, 1.0)$ during loss minimization. Suspicious samples exert negligible influence on decision boundaries.
2. **Trimmed Selective Training:**  
   Purifies the training manifold by pruning samples where $\text{Score}_i > \theta$, retaining high-confidence training instances.

---

## 11. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Backend health check |
| `POST` | `/api/datasets/upload` | Upload CSV/XLSX dataset |
| `POST` | `/api/datasets/benchmark` | Load standard public benchmark (Breast Cancer, Wine) |
| `GET` | `/api/datasets` | List all registered datasets |
| `GET` | `/api/datasets/{id}` | Inspect dataset schema and exploratory statistics |
| `GET` | `/api/datasets/{id}/preview` | Fetch 50-row real data preview |
| `POST` | `/api/experiments` | Create and trigger asynchronous experiment |
| `GET` | `/api/experiments` | List all historical experiments |
| `GET` | `/api/experiments/{id}` | Retrieve complete experiment configuration and results |
| `GET` | `/api/experiments/{id}/status` | Real-time step progress polling |
| `GET` | `/api/experiments/{id}/report` | Download formal ReportLab PDF report |
| `GET` | `/api/experiments/{id}/export/{format}` | Export `metrics.csv`, `suspicious_labels.csv`, `config.json` |

---

## 12. Publication-Grade PDF Reports

Every completed experiment automatically generates a downloadable PDF containing:
1. Project title and unique experiment identifier.
2. Dataset metadata, sample size, feature counts, and split ratios.
3. Tabular model performance across all evaluated noise levels.
4. Top diagnosed suspicious training records with confidence margins.
5. Empirical findings and methodological notes.

---

## 13. Limitations & Technical Discussion

1. **Synthetic vs. Real Noise:** Synthetic noise injection simulates label noise under controlled conditions; real-world annotation noise may exhibit complex feature-dependent bias.
2. **Conservative Pruning:** On small datasets with high noise ($\ge 40\%$), aggressive trimmed training can discard minority class samples, necessitating adaptive thresholding.
3. **Statistical Repeats:** Single-seed trials provide exact reproducibility, but multi-seed repeats (`[42, 123, 456]`) are recommended for formal benchmarking and production evaluations.

---

## License

This project is licensed under the MIT License.

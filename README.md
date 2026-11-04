# Robust Learning Under Label Noise for Real-World Classification

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade machine learning platform designed to benchmark, detect, and mitigate the detrimental effects of label noise in supervised classification datasets.

Built with strict empirical integrity: **no mock data, no fake metrics, no hardcoded charts, and 100% computed results**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start (Local Setup)](#3-quick-start-local-setup)
   - [Windows (PowerShell)](#windows-powershell)
   - [macOS / Linux (Bash)](#macos--linux-bash)
4. [Running with Docker Compose](#4-running-with-docker-compose)
5. [End-to-End User Guide](#5-end-to-end-user-guide)
   - [Step 1: Datasets (Benchmarks or Custom Upload)](#step-1-datasets-benchmarks-or-custom-upload)
   - [Step 2: Choosing a Target Column](#step-2-choosing-a-target-column)
   - [Step 3: Creating and Configuring an Experiment](#step-3-creating-and-configuring-an-experiment)
   - [Step 4: Monitoring Real-Time Pipeline Execution](#step-4-monitoring-real-time-pipeline-execution)
   - [Step 5: Inspecting Results & Visual Analytics](#step-5-inspecting-results--visual-analytics)
   - [Step 6: Exporting Data & Downloading PDF Reports](#step-6-exporting-data--downloading-pdf-reports)
6. [Machine Learning Methodology](#6-machine-learning-methodology)
   - [Synthetic Noise Injection (Symmetric & Asymmetric)](#synthetic-noise-injection)
   - [Confident Learning Out-of-Fold Detection](#confident-learning-detection)
   - [Noise-Robust Algorithms](#noise-robust-algorithms)
7. [REST API Reference](#7-rest-api-reference)
8. [Automated Test Suite](#8-automated-test-suite)
9. [Project Structure](#9-project-structure)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)
11. [License](#11-license)

---

## 1. Project Overview

Supervised classification algorithms assume that ground-truth labels are pristine. In real-world environments—from clinical health records to sensor telemetry—human annotator fatigue, vague labeling guidelines, and automated web extraction introduce substantial **label noise**. 

Standard models (such as deep neural networks and gradient boosting ensembles) easily overfit to mislabeled instances, distorting decision boundaries and degrading real-world test generalization.

This platform provides an interactive, mathematically rigorous environment to:
1. **Benchmark** clean datasets against controlled synthetic training noise ($0\%$ to $40\%$).
2. **Detect** mislabeled instances automatically via cross-validation out-of-fold probability estimation (Confident Learning).
3. **Train** noise-robust models (Sample-Weighted Downweighting and Trimmed Pruning) alongside conventional baselines (Logistic Regression, Random Forest, HistGradientBoosting).
4. **Compare** degradation curves and confusion matrices evaluated strictly on clean holdout test splits.
5. **Download** publication-grade formal PDF evaluation reports for documentation and audit trails.

---

## 2. Prerequisites

| Software | Minimum Version | Required For | Download Link |
| :--- | :--- | :--- | :--- |
| **Git** | 2.x+ | Repository version control | [git-scm.com](https://git-scm.com/downloads) |
| **Python** | **3.10+** (3.10, 3.11, or 3.12) | FastAPI REST API, Scikit-learn, Pandas, Alembic | [python.org](https://www.python.org/downloads/) |
| **Node.js** | **18.x+** *(20+ LTS recommended)* | Next.js 16, React 19 web frontend | [nodejs.org](https://nodejs.org/en/download) |
| **npm** | **9.x+** | Package management *(bundled with Node.js)* | [nodejs.org](https://nodejs.org/en/download) |

> [!NOTE]
> Local development defaults to **SQLite** (`sqlite:///./storage/app.db`), which is built directly into Python. **No standalone database installation is required** for local development.

For a full breakdown of requirements, see [PREREQUISITES.md](PREREQUISITES.md).

---

## 3. Quick Start (Local Setup)

### Windows (PowerShell)

Open PowerShell and run the following commands from your project root:

```powershell
# 1. Clone the repository
git clone https://github.com/karthikrshet/Robust-Learning.git
cd Robust-Learning

# 2. Copy the environment configuration
Copy-Item .env.example .env

# 3. Create and activate a Python virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# 4. Install Python backend dependencies
pip install -r requirements.txt

# 5. Run database migrations
python -m alembic upgrade head

# 6. Install frontend dependencies
cd apps/web
npm install
cd ../..
```

#### Running the Services (Windows)

Open **two separate PowerShell terminals** from the project root (`Robust-Learning`):

**Terminal 1 — Start Backend API:**
```powershell
.venv\Scripts\Activate.ps1
python -m uvicorn apps.api.app.main:app --reload --port 8000
```
- API Endpoint: [http://localhost:8000](http://localhost:8000)
- Interactive Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

**Terminal 2 — Start Web Frontend:**
```powershell
cd apps/web
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

### macOS / Linux (Bash)

Open your terminal and run:

```bash
# 1. Clone the repository
git clone https://github.com/karthikrshet/Robust-Learning.git
cd Robust-Learning

# 2. Copy the environment configuration
cp .env.example .env

# 3. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 4. Install Python backend dependencies
pip install -r requirements.txt

# 5. Run database migrations
python -m alembic upgrade head

# 6. Install frontend dependencies
cd apps/web
npm install
cd ../..
```

#### Running the Services (macOS / Linux)

Open **two separate terminal windows**:

**Terminal 1 — Backend API:**
```bash
source .venv/bin/activate
python -m uvicorn apps.api.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend Application:**
```bash
cd apps/web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Running with Docker Compose

If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed, launch the entire ecosystem (PostgreSQL 15, FastAPI, and Next.js) with a single command:

```bash
docker compose up --build
```

- Web Interface: [http://localhost:3000](http://localhost:3000)
- REST API: [http://localhost:8000](http://localhost:8000)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:
```bash
docker compose down
```

---

## 5. End-to-End User Guide

### Step 1: Datasets (Benchmarks or Custom Upload)
1. Navigate to **Datasets** (`/datasets`) in the navigation bar.
2. **Load Standard Benchmarks:** Click **Load Benchmark** to import pre-configured standard datasets:
   - *Breast Cancer Wisconsin* (Binary classification: Malignant vs. Benign, 569 rows)
   - *Wine Recognition* (Multiclass classification: 3 cultivars, 178 rows)
   - *Fisher's Iris* (Multiclass classification: 3 species, 150 rows)
3. **Upload Your Own Dataset:** Drag and drop any `.csv`, `.xlsx`, or `.parquet` file. The platform will automatically inspect the columns, calculate missing values, and check summary statistics.

---

### Step 2: Choosing a Target Column
In the Dataset Detail page (`/datasets/[id]`), select the **Target / Label Column**:
- The platform automatically validates the column for supervised classification.
- **Valid target:** Must contain between **2 and 30 discrete classes** (e.g., `diagnosis`, `churn`, `status`, `tier`).
- **Ineligible targets:** Columns with only 1 class or columns with continuous float values / unique IDs (e.g., `id`, `name`, `timestamp`) are flagged with an error to prevent model training crashes.

---

### Step 3: Creating and Configuring an Experiment
1. Click **Start Experiment** or navigate to **Experiments > New Experiment** (`/experiments/new`).
2. Follow the 7-step guided configuration wizard:
   - **Step 1 (Dataset):** Select your target dataset.
   - **Step 2 (Target Label):** Select the class label column. Valid candidate columns are highlighted with `[Valid: N classes]`.
   - **Step 3 (Preprocessing):** Configure missing value imputation (median / mean / mode), feature scaling (StandardScaler / RobustScaler / MinMaxScaler), and duplicate handling.
   - **Step 4 (Split & Seeds):** Set train/val/test split ratios (default: 70% / 15% / 15%) and random seeds. Enable Multi-Seed (`[42, 123, 456]`) for variance benchmarking.
   - **Step 5 (Label Noise):** Choose the synthetic noise levels to test (e.g., `0%`, `10%`, `20%`, `30%`, `40%`) and the corruption strategy:
     - **Symmetric:** Uniform class swapping across all non-target classes.
     - **Asymmetric:** Adjacent pair-flipping ($k \to k+1$), mimicking real-world annotator boundary confusion.
   - **Step 6 (Models):** Select which classifiers to train:
     - *Baseline Models:* Logistic Regression, Random Forest, HistGradientBoosting, SVC.
     - *Robust Models:* Sample-Weighted Random Forest, Trimmed Pruning Random Forest, Sample-Weighted Logistic Regression.
   - **Step 7 (Review & Run):** Review your parameters and click **Run Experiment Pipeline**.

---

### Step 4: Monitoring Real-Time Pipeline Execution
The experiment runs asynchronously in the Python backend. The interface polls execution progress live with step-by-step indicators:
1. `Preprocessing dataset` (imputation, encoding, scaling)
2. `Splitting data` (stratified train / validation / test)
3. `Injecting synthetic noise` (applied strictly to the training split)
4. `Detecting suspicious labels` (stratified 5-fold cross-validation out-of-fold scoring)
5. `Training models` (baselines vs. robust algorithms)
6. `Evaluating on holdout test set` (pristine ground truth)
7. `Synthesizing report & PDF generation`

---

### Step 5: Inspecting Results & Visual Analytics
Once completed, open the Experiment Detail page (`/experiments/[id]`):
- **Metrics Table:** Review Accuracy, Precision, Recall, F1-Score, ROC-AUC, and training duration across each noise level.
- **Degradation Charts:** Visualize how robust models maintain high performance while baseline models degrade under increasing noise ratios.
- **Confusion Matrices:** Examine class-by-class misclassification patterns for any model at any noise level.
- **Suspicious Samples Audit:** View the exact training rows flagged by Confident Learning, with observed labels, predicted classes, confidence margins, and issue scores.

---

### Step 6: Exporting Data & Downloading PDF Reports
- **Download PDF Report:** Click **Download PDF Report** to retrieve a publication-ready evaluation document detailing the experimental setup, summary performance tables, diagnosed suspicious labels, and methodological findings.
- **Export Raw Data:** Download raw metrics as `metrics.csv`, detected noisy samples as `suspicious_labels.csv`, or complete experiment configurations as `config.json`.

---

## 6. Machine Learning Methodology

### Synthetic Noise Injection
Noise is applied **strictly to the training set** $y_{\text{train}}$ so validation and test evaluations reflect true generalization:
- **Symmetric Noise:** Selects $n = \lfloor N \cdot \eta \rfloor$ samples and swaps label $y_i$ uniformly with any class $k \neq y_i$.
- **Asymmetric Noise:** Replaces label $y_i$ with $(y_i + 1) \pmod K$, simulating systematic annotator confusion between adjacent categories.

### Confident Learning Detection
Using stratified 5-fold cross-validation on $X_{\text{train}}$, we calculate out-of-fold predicted class probabilities $P(k \mid x_i)$ without assuming ground truth is known. The continuous suspiciousness score is computed as:
$$\text{Score}_i = \text{clip}\left( 0.5 \cdot (1 - P(y_i \mid x_i)) + 0.5 \cdot \max(0, P(\hat{y}_i \mid x_i) - P(y_i \mid x_i)), 0, 1 \right)$$
Samples exceeding the detection threshold $\theta$ ($\theta = 0.50$ by default) are flagged as **Potential Issues**.

### Noise-Robust Algorithms
1. **Robust Sample-Weighted Learning:**  
   Assigns weights $w_i = \text{clip}(1.0 - \text{Score}_i, 0.05, 1.0)$ during model fitting. Highly suspicious samples exert minimal influence on decision boundaries.
2. **Trimmed Selective Training:**  
   Prunes samples where $\text{Score}_i > \theta$, training on a purified subset of reliable samples while guaranteeing all classes retain minimum representation.

---

## 7. REST API Reference

The backend exposes a fully documented RESTful API. Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/datasets/upload` | Upload a new CSV, XLSX, or Parquet dataset file |
| `POST` | `/api/datasets/benchmark` | Load a standard benchmark (`breast_cancer`, `wine_quality`, `iris_multiclass`) |
| `GET` | `/api/datasets` | List all registered datasets |
| `GET` | `/api/datasets/{id}` | Get dataset schema, column statistics, and class counts |
| `GET` | `/api/datasets/{id}/preview` | Preview top 50 rows of a dataset |
| `GET` | `/api/datasets/{id}/target/{col}` | Inspect and validate candidate target column |
| `DELETE`| `/api/datasets/{id}` | Delete a dataset and its storage files |
| `POST` | `/api/experiments` | Create and launch an asynchronous experiment pipeline |
| `GET` | `/api/experiments` | List all historical and running experiments |
| `GET` | `/api/experiments/{id}` | Retrieve complete results, metrics, and suspicious samples |
| `GET` | `/api/experiments/{id}/status` | Poll real-time execution step and progress |
| `GET` | `/api/experiments/{id}/report` | Download the compiled formal ReportLab PDF report |
| `GET` | `/api/experiments/{id}/export/{format}` | Export results as `metrics.csv`, `suspicious_labels.csv`, or `config.json` |
| `GET` | `/api/experiments/dashboard/stats`| Operational metrics (total models trained, issues detected) |

---

## 8. Automated Test Suite

The test suite covers data loaders, preprocessing pipelines, noise injectors, Confident Learning detectors, model wrappers, metrics calculators, and REST endpoints.

Run the entire test suite:
```bash
python -m pytest tests/ -v
```

Run tests with code coverage:
```bash
python -m pytest tests/ --cov=ml --cov=apps/api/app -v
```

---

## 9. Project Structure

```text
Robust-Learning/
├── apps/
│   ├── api/                     # FastAPI Python Backend
│   │   ├── app/
│   │   │   ├── api/             # REST API routers (datasets, experiments, auth)
│   │   │   ├── core/            # Configuration and environment settings
│   │   │   ├── db/              # SQLAlchemy session and model base
│   │   │   ├── models/          # ORM models (Dataset, Experiment)
│   │   │   ├── schemas/         # Pydantic validation schemas
│   │   │   ├── services/        # Business logic & background task execution
│   │   │   └── main.py          # FastAPI application entrypoint
│   │   └── Dockerfile
│   │
│   └── web/                     # Next.js Frontend
│       ├── app/
│       │   ├── datasets/        # Dataset catalog & inspection pages
│       │   ├── experiments/     # Experiment wizard, detail, and list pages
│       │   ├── analysis/        # Cross-experiment comparative charts
│       │   ├── methodology/     # Methodology documentation and theory
│       │   ├── login/           # Evaluator authentication page
│       │   └── page.tsx         # Platform dashboard & interactive sandbox
│       ├── components/          # UI, charts, and layout components
│       ├── lib/api.ts           # Type-safe API client
│       └── Dockerfile
│
├── ml/                          # Core Machine Learning Engine
│   ├── preprocessing/           # Loader, TabularPreprocessor, DataSplitter
│   ├── noise/                   # LabelNoiseInjector (symmetric & asymmetric)
│   ├── detection/               # LabelIssueDetector (Confident Learning OOF)
│   ├── models/                  # Baseline & Robust Classifier Wrappers
│   ├── evaluation/              # ModelEvaluator & multi-class metric arithmetic
│   ├── experiments/             # ExperimentRunner pipeline orchestrator
│   └── utils/                   # Benchmark datasets loader
│
├── migrations/                  # Alembic database migrations
├── reports/                     # ReportLab PDF report generator
├── storage/                     # Datasets, SQLite DB, and generated PDF reports
├── tests/                       # Pytest test suite (17 tests)
├── docker-compose.yml           # Multi-container Docker deployment
├── Makefile                     # Make shortcut commands
├── PREREQUISITES.md             # Detailed installation and system requirements
├── requirements.txt             # Python backend dependencies
└── .env.example                 # Environment configuration template
```

---

## 10. Troubleshooting & FAQ

### 1. `This solver needs samples of at least 2 classes in the data, but the data contains only one class`
- **Cause:** The selected target column only has 1 unique value across the dataset (e.g., a status column where every row is `"Active"`).
- **Solution:** Select a column with between 2 and 30 distinct classes. The platform's experiment wizard flags valid candidates with `[Valid: N classes]`.

### 2. `Target column appears to be a continuous numerical variable`
- **Cause:** A continuous float column (such as salary, price, or coordinates) was selected.
- **Solution:** This platform is designed for classification tasks. For regression targets, bin the continuous values into discrete categories prior to upload.

### 3. Frontend Cannot Connect to Backend (`Failed to fetch`)
- Ensure the FastAPI backend is running on `http://localhost:8000` (check `http://localhost:8000/health`).
- Verify that `NEXT_PUBLIC_API_URL=http://localhost:8000` is set in your `.env` file.

### 4. Port Conflicts
- If port `8000` is in use, start the backend on another port:
  ```bash
  python -m uvicorn apps.api.app.main:app --reload --port 8080
  ```
- Update `NEXT_PUBLIC_API_URL=http://localhost:8080` in `apps/web/.env.local` or `.env`.

---

## 11. License

This project is licensed under the [MIT License](LICENSE).

# System Requirements & Prerequisites

This document lists all software, runtimes, and dependencies required to install and run the **Robust Learning Under Label Noise** platform on your machine.

---

## 1. Core Prerequisites (Local Native Development)

For standard development running the Python backend and Next.js frontend locally:

| Software / Runtime | Minimum Version | Required For | Official Download Link |
| :--- | :--- | :--- | :--- |
| **Git** | Any modern version (2.x+) | Cloning the repository and version control | [https://git-scm.com/downloads](https://git-scm.com/downloads) |
| **Python** | **3.10+** (3.10, 3.11, or 3.12) | FastAPI REST backend, Scikit-learn, Pandas, Alembic migrations, Pytest | [https://www.python.org/downloads/](https://www.python.org/downloads/) |
| **Node.js** | **18.x+** *(20+ LTS recommended)* | Next.js 15, React 19, and Tailwind CSS frontend | [https://nodejs.org/en/download](https://nodejs.org/en/download) |
| **npm** | **9.x+** | Node.js package management *(included with Node.js)* | [https://nodejs.org/en/download](https://nodejs.org/en/download) |

> [!NOTE]
> **Database:** Local execution defaults to **SQLite** (`sqlite:///./storage/app.db`), which is built directly into Python. **No standalone database installation is required** for local development.

---

## 2. Containerized Option (Docker Setup)

If you prefer to run the entire stack (PostgreSQL + FastAPI Backend + Next.js Frontend) in containers without installing Python or Node.js directly on your host machine:

| Software | Purpose | Official Download Link |
| :--- | :--- | :--- |
| **Docker Desktop** *(includes Docker Engine & Compose)* | Builds and launches all services via `docker compose up --build` | [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) |

---

## 3. Recommended Developer Tools (Optional)

| Tool | Purpose | Official Download Link |
| :--- | :--- | :--- |
| **Visual Studio Code** | Code editor with Python, Pylance, and TypeScript extensions | [https://code.visualstudio.com/](https://code.visualstudio.com/) |
| **PostgreSQL 15+** | Only required if you choose to run a native PostgreSQL database instead of SQLite | [https://www.postgresql.org/download/](https://www.postgresql.org/download/) |
| **GNU Make** | Optional utility for executing shorthand commands from `Makefile` (`make install`, `make test`) | [https://gnuwin32.sourceforge.net/packages/make.htm](https://gnuwin32.sourceforge.net/packages/make.htm) *(Windows)* or via OS package manager |

---

## 4. Verifying Installed Versions

Open a terminal (PowerShell, Command Prompt, or Bash) and run:

```bash
# Verify Git
git --version
# Output should be: git version 2.x.x

# Verify Python
python --version
# Output must be: Python 3.10.x or higher

# Verify Node.js and npm
node -v
# Output must be: v18.x.x or v20.x.x+
npm -v
# Output must be: 9.x.x or 10.x.x+

# (Optional) Verify Docker if using containerized mode
docker --version
docker compose version
```

---

## 5. Quick-Start Commands

Once the prerequisites are installed on your laptop:

### Local Development Setup

```bash
# 1. Clone repository and navigate inside
git clone <repo_url>
cd "Robust Learning"

# 2. Copy environment settings
cp .env.example .env

# 3. Set up Python virtual environment & backend dependencies
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt

# 4. Run database migrations
python -m alembic upgrade head

# 5. Set up Frontend dependencies
cd apps/web
npm install
cd ../..
```

### Running the Services

**Terminal 1 (Backend API):**
```bash
python -m uvicorn apps.api.app.main:app --reload --port 8000
```
- API: [http://localhost:8000](http://localhost:8000)
- Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

**Terminal 2 (Frontend Interface):**
```bash
cd apps/web
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## Related Project Files

- [README.md](README.md) - Full project documentation and research methodology
- [requirements.txt](requirements.txt) - Complete Python dependency specification
- [package.json](apps/web/package.json) - Complete Frontend dependency specification
- [docker-compose.yml](docker-compose.yml) - Multi-container Docker deployment specification
- [.env.example](.env.example) - Environment variable template

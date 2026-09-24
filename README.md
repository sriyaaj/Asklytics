# DataSense AI

> **An AI-powered data analyst that cleans, analyzes, explains, compares, simulates, and reports data in plain English.**

### Core Principle
> **Python/Deterministic logic calculates. AI explains. The user decides.**

---

## 🚀 Quick Start

To launch and run DataSense AI locally:

```bash
# 1. Navigate to the project directory
cd /Users/admin/.gemini/antigravity/scratch/datasense-ai

# 2. Start a lightweight HTTP server
python3 -m http.server 8080

# 3. Open in your browser
# Visit: http://localhost:8080
```

---

## 🌟 The 16 Features Implemented

| # | Feature | Capability |
|---|---|---|
| 1 | **CSV Upload & Preview** | Drag & drop any CSV or choose from 3 built-in sample datasets (Sales, Students, Customers). Instantly views schema, records, data types, and first 10 rows. |
| 2 | **AI-Assisted Data Cleaning & Resolution** | Detects exact duplicates, fuzzy duplicates (Levenshtein similarity on names, phone, email), casing inconsistencies, mixed currencies (`₹1,500`, `Rs.1500` → `1500.00`), mixed date formats (`12/08/2026` → `2026-08-12`), missing values without guessing, and full Undo/Redo stack. |
| 3 | **Data Quality Check** | Automated audit checklist tracking recognized date/metric columns, missingness %, remaining duplicates, invalid dates, and physical range validity. |
| 4 | **Data Health Score** | Deterministic 0–100 score computed via rule-based weights: Completeness (30%), Consistency (25%), Validity (25%), Duplicates (20%). Interactive calculation breakdown modal. |
| 5 | **Automatic KPI Dashboard** | Domain-adaptive metric cards (Revenue/Profit/Orders/Returns vs Students/Pass Rate/Avg/Top vs Churn/Retention/Spend) with trend badges and evidence proofs. |
| 6 | **Intelligent Chart Generation** | Dynamically chooses optimal Chart.js visualizations (Temporal Trend Line, Categorical Bar, Distribution Histogram, Donut Breakdown, Bivariate Scatter). |
| 7 | **Plain-English AI Insights** | Verified facts extracted by deterministic math engine first → serialized to structured JSON → Groq LLM turns them into plain-English explanations with category tags (Growth, Risk, Pattern). |
| 8 | **Ask Your Data** | Notion/Linear search bar (`/` hotkey) answering natural language questions with calculation evidence. Enforces strict **"Insufficient Data"** safeguard when questions ask for unavailable dimensions. |
| 9 | **Insight Evidence Cards** | Interactive **"Why am I saying this?"** drawer connecting any claim to exact baseline vs observed metrics, source columns, and mathematical formulas. |
| 10 | **Action Recommendation Engine** | Maps analytical findings to pragmatic, high-impact suggestions (e.g. Return rate spikes → review packaging/sizing; Low math scores → targeted remedial cohort). |
| 11 | **Anomaly Detection** | Statistical scan (Z-score > 2.5 and IQR boundaries) flagged into 🔴 High Priority and 🟡 Needs Attention with full deviation formulas. |
| 12 | **Scenario Simulator** | What-if laboratory with interactive sliders (Price %, Quantity %, Return Reduction %) recalculating revenue impact, recovered value, and elasticity notices. |
| 13 | **Report Comparison** | Compares Dataset A vs Dataset B or Period A vs Period B (e.g. June vs July) with delta %, delta numbers, and trend tags. |
| 14 | **Comparison Insights** | Auto-tags meaningful changes: `IMPROVEMENT` (e.g. Profit +14.2%), `DECLINE` (e.g. Volume -4.1%), `ATTENTION` (e.g. Return Rate +2.2 pp). |
| 15 | **Audience-Based Reports** | One-click report generator customized for 5 stakeholder personas: Executive, Analyst, Teacher, Sales Manager, and General User. |
| 16 | **Methodology & PDF Export** | Pipeline flow visualization, AI Limitations disclosure, and multi-page printable executive PDF report export via `window.print()`. |

---

## 🎨 UI Direction: Linear × Notion × Modern BI

- **Obsidian / Dark Slate Palette**: Deep backgrounds (`#080B11`, `#0E131F`), subtle 1px border glows (`rgba(255, 255, 255, 0.07)`), and crisp high-contrast text.
- **Data Typography**: JetBrains Mono for numbers, formulas, and metric values; Inter for clean, legible reading.
- **Micro-Interactions**: Smooth hover effects, responsive sliders, quick-focus search bar, and transparent mathematical proof drawers.

---

## 🤖 Groq API Configuration

DataSense AI integrates directly with Groq Cloud API:
- Supports `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, and `mixtral-8x7b-32768`.
- To configure: Click **Groq API** in the top navigation and enter your API key (`gsk_...`). The key is stored securely in your browser's `localStorage`.
- **Offline / Zero-Key Fallback**: Even without an API key, the built-in deterministic narrative engine generates rich insights, answers questions, and populates audience reports so the app remains 100% functional out of the box!

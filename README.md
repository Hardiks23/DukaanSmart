# DukaanSmart — A Premium AI Retail Intelligence Agent

> **Tagline**: *A clearer way to run the everyday shop.*  
> **Hackathon**: HackWithHyderabad 3.0 — AI Agents That Learn Using Hindsight  
> **Team**: 404 - "COMPETITION NOT FOUND"  
> **Team Members**:  
> - **Hardik Sachdeva**  
> - **Uday Narayan Dubey**  
> - **Simardeep Singh Bhatia**  
> - **Amit Kumar**  
>
> **Target Users**: Indian Kirana store owners and small retailers.  
> **Core Mission**: Turn everyday shop records into intelligent, profit-maximizing business decisions through persistent long-term AI memory.

---

## 🌟 Why DukaanSmart?

Indian Kirana stores operate on razor-thin margins, trust-based customer credit (*Udhar Khata*), and hyper-local seasonal demand spikes. Traditional generic chatbots lack historical memory — forgetting what happened during the previous Diwali stockout, which customer took 45 days to clear credit, or how supplier price hikes were previously handled.

**DukaanSmart** integrates **Vectorize Hindsight AI** to give the retail agent persistent, evolving memory. The agent becomes context-aware by remembering past business events, decisions, customer repayments, and their recorded outcomes.

---

## 🧠 Hindsight AI Integration Architecture

DukaanSmart incorporates the official `hindsight-client` Python SDK (v1.1.0) and implements the core Hindsight primitives:

1. **`retain(bank_id, content, tags, context, entities)`**:  
   Persistently stores business experiences, stockouts, price shifts, and credit clearances directly into the tenant bank (`dukaansmart-store-1`).
2. **`recall(bank_id, query, budget, tags)`**:  
   Retrieves relevant memories using Hindsight's **4 parallel retrieval strategies**:
   - **Semantic Similarity**: Matches conceptual retail intents.
   - **Keyword (BM25)**: Ensures exact brand and product matches (e.g. *Aashirvaad Atta*, *Fortune Oil*).
   - **Entity Graph Traversal**: Connects customer names (*Ramesh Kumar* $\rightarrow$ *Diwali* $\rightarrow$ *Repayment in 4 days*).
   - **Temporal Reasoning**: Prioritizes recency and seasonal cyclicality.
3. **`reflect(bank_id, query, budget)`**:  
   Runs an autonomous agentic reflection loop over the memory bank to synthesize high-order strategic conclusions.

### Dual Live / Local Engine Mode
- **Live Hindsight Cloud / Local Server**: When configured in Settings or `.env` (`HINDSIGHT_API_KEY`, `HINDSIGHT_BASE_URL`), DukaanSmart connects directly to live Hindsight.
- **High-Fidelity Local Engine**: If credentials are unset or offline, DukaanSmart runs its built-in Local Memory Engine implementing the exact same 4-strategy fusion, ensuring zero broken workflows while remaining completely transparent.

---

## 🛍️ Core Application Features

### 1. Executive Intelligence Dashboard
- **Calculated Metrics**: Today's revenue, real estimated gross profit, stock cost valuation, low-stock count, products nearing expiry, and total outstanding Udhar.
- **14-Day Sales Velocity Chart**: Recharts area chart plotting revenue vs gross profit.
- **Payment Tender Breakdown**: Cash vs Instant UPI QR vs Udhar credit.
- **Dynamic AI Kirana Insight Banner**: Grounded in Hindsight historical memories.

### 2. Kirana Inventory Management
- Full catalog management: Name, SKU, Barcode, Category, Purchase Cost, Selling Price, Quantity, Minimum Stock Threshold, Supplier, and Batch Expiry.
- Category filters (*Staples & Grains*, *Oils & Ghee*, *Dairy & Bread*, *Snacks*, *Spices*, *Personal Care*).
- Stock level alerts (Low-stock warning & Batch expiry countdown < 45 days).
- Quick stock adjustment and delivery logger.

### 3. POS Billing Counter
- Optimized for quick retail checkout.
- Barcode and product search.
- Payment modes: **Cash** (with change calculator), **Instant UPI QR** (generates live QR with exact bill amount), and **Udhar (Credit)**.
- **Credit Limit Enforcement**: Blocks checkout if customer credit limit will be breached.
- **Thermal Receipt Printer**: One-click printable receipt formatted for standard 80mm thermal POS printers.

### 4. Digital Udhar Khata (Khatabook)
- Customer profiles with credit limits and trust tiers (*Trusted*, *Standard*, *Caution*).
- Record payment (*Jama*) with automated Hindsight memory retention.
- **WhatsApp Payment Reminder Generator**: One-click personalized polite reminder message with shop name, exact balance, and UPI ID link.
- Chronological customer ledger drawer showing debits, credits, and running balance.

### 5. AI Business Assistant (Copilot)
- Context-aware retail advisor grounded in live SQLite database numbers + recalled Hindsight memories.
- **Memory Provenance Badges**: Every recommendation explicitly shows the recalled memories, retrieval strategy, relevance score, and agentic influence.
- Pre-built Kirana problem prompts (Credit approval, Festival stocking, Wholesaler price negotiation).

### 6. Hindsight Memory Explorer
- Live memory bank inspector for `dukaansmart-store-1`.
- Interactive sandboxes for **Test Recall**, **Test Reflect**, and **Retain Experience**.
- Complete audit trail of all memory operations.

### 7. Financial Analytics & Reports
- Category valuation breakdown.
- Payment tender distribution pie chart.
- Top-selling products by volume and highest gross-profit contributors.

### 8. System & Engine Settings
- Live Hindsight Cloud / Local Engine switcher.
- Groq API Key and LLM model selection (`llama-3.3-70b-versatile`).
- Kirana store identity customization.
- One-click **Reset to Sample Kirana Data**.

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & npm

### Quick One-Click Launch (Windows)
Double-click `start_all.bat` or run:
```powershell
.\start_all.bat
```

### Manual Launch

#### 1. Backend Setup:
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at: `http://localhost:8000`  
API Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend Setup:
```powershell
cd frontend
npm run dev
```
Frontend UI will be live at: `http://localhost:5173`

#### 3. Run Backend Automated Test Suite:
```powershell
cd backend
python test_api.py
```

---

## 👥 Hackathon Team 404 — "COMPETITION NOT FOUND"
- **Hardik Sachdeva**
- **Uday Narayan Dubey**
- **Simardeep Singh Bhatia**
- **Amit Kumar**

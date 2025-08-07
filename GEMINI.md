Claude.md — SME Finance Assistant (ADK + SEA-LION) — MVP Spec (Local-first, Multi-Modal)

Goal (MVP in 1 month):  
A lightweight, multilingual web app for Southeast Asian SMEs to record transactions, categorize expenses, generate invoices (PDF), and summarize cash flow—using local-first multi-agent orchestration (ADK), SEA-LION for local-language understanding, and local OCR/image/audio models for extraction. Supports text, image, and voice input. Data is displayed in a modern frontend.

⸻

1) Scope & Success Criteria

In-scope (MVP)
- Cashflow capture (chat, form, image, or voice):
	- Natural-language entry (e.g., “Sold 500k IDR to PT Sari on 5 Aug, COD”).
	- File upload for receipt/invoice photos/PDFs → local OCR/image model (e.g., Tesseract or GPT-4o mini) → auto-extract totals, dates, vendor, line items; user can edit.
	- Voice input: audio file or real-time stream → local/OpenAI audio model (e.g., OpenAI Realtime API) → transcript → process as text.
- Expense management: categorize (COGS, rent, wages, utilities, taxes, misc), export CSV.
- Invoice generation: create/send branded PDF invoices (sequential IDs, due dates, tax, currency), store & re-issue.
- Local language UX: Indonesian, Vietnamese, Thai, Tagalog, Malay, Burmese (extendable). SEA-LION as primary NLU/NLG.
- Basic summaries: daily/weekly/monthly net cashflow, top expense categories, upcoming receivables.
- User profile agent: stores language, preferences, and recent activity.

Success
- Record a transaction via chat, upload, or voice in <10s; extraction accuracy ≥90% on pilot docs.
- Generate a PDF invoice with correct totals/taxes/currency in <5s.
- Low hallucination: numeric calculations executed by code, not LLM.
- All responses available in user’s chosen SEA language.
- Data displayed in frontend tables, charts, and summary widgets.

⸻

2) System Overview (Local-first, Multi-Modal)

Why local-first?  
No GCP dependency for MVP: all extraction, storage, and model inference run locally or via self-hosted APIs. Enables rapid iteration and privacy.

High-level

Web (Next.js) ─► FastAPI/ADK backend  
        ├─► RouterAgent (intent → sub-agent)  
        ├─► CashflowAgent  
        │  ├─ Tool: LocalOCR/Image (Tesseract, GPT-4o mini)  
        │  ├─ Tool: CategorizeExpense  
        │  └─ Tool: LedgerDB  
        ├─► InvoiceAgent  
        │  ├─ Tool: GenerateInvoiceHTML  
        │  └─ Tool: HtmlToPDF  
        ├─► AudioAgent (voice input → transcript)  
        │  └─ Tool: Local/OpenAI Audio Model  
        ├─► ProfileAgent (user profile, prefs)  
        └─► HelpAgent (optional)

Input modalities:
- Text: chat/form (SEA-LION, GPT-4o mini)
- Image/PDF: upload (local OCR, GPT-4o mini for image understanding)
- Audio: upload/stream (OpenAI Realtime API or local Whisper, then text pipeline)

All data is displayed in the frontend: tables (transactions, invoices), charts (cashflow), and summaries.

⸻

3) Agents & Tools (ADK)

3.1 RouterAgent
- Purpose: classify input → CashflowAgent, InvoiceAgent, AudioAgent, ProfileAgent, or HelpAgent.
- Model: SEA-LION (primary).
- Signals: keywords (“add expense”, “invoice”, “receipt upload”, “pdf”, “voice”), entities (dates, amounts, vendors).

3.2 CashflowAgent
- User tasks:
	- “Record: Sold 2,500 THB to Somchai 5 Aug; paid cash.”
	- “Upload this receipt; add to expenses.”
	- “Show July cashflow; what’s my biggest cost?”
- Tools:
	1. LocalOCR/ImageTool → returns normalized JSON: vendor, issue_date, due_date, currency, line_items[], subtotal, tax, total, doc_uri, confidence. Uses Tesseract or GPT-4o mini for image/PDF.
	2. CategorizeExpense → maps description/GL to category (COGS, Opex…); code-based rules + LLM fallback.
	3. LedgerDB → create/read/update transactions table; supports CSV export.
	4. SummarizeCashflow → code computes rollups; LLM only explains in user’s language.

3.3 InvoiceAgent
- User tasks:
	- “Create an invoice for PT Nusantara: 10 boxes @ 200, tax 11%, due in 30 days.”
	- “Re-issue INV-000231 as PDF in Bahasa Indonesia.”
- Tools:
	1. GenerateInvoiceHTML → fills localized template with items/tax/terms.
	2. HtmlToPDF → render to PDF (WeasyPrint/wkhtmltopdf).
	3. LedgerDB → persists invoice header + lines + status.

3.4 AudioAgent
- User tasks:
	- “Record a sale by voice.”
	- “Upload a voice memo for expense.”
- Tools:
	1. AudioToText → uses OpenAI Realtime API or local Whisper to transcribe audio, then routes transcript to RouterAgent.

3.5 ProfileAgent
- Stores user language, preferences, and recent activity.
- Used for personalization and default settings in UI.

3.6 HelpAgent (optional)
- Finance basics explanations (budgeting, digital payments) with short, localized answers (SEA-LION).

⸻

4) Models & Integration

- SEA-LION: multilingual, SEA-context LLM; host via Ollama/vLLM and attach to ADK through LiteLLM provider.
- GPT-4o mini: for image and text input, especially for receipts/invoices (local or via OpenAI API).
- Audio: OpenAI Realtime API or local Whisper for voice input.
- All models run locally or via self-hosted APIs for MVP.

⸻

5) Data Model (MVP)

transactions  
id, ts, type(income|expense), amount, currency, category, counterparty, method, notes, source_doc_uri, doc_confidence, created_by

invoices (header)  
id, invoice_no, issue_date, due_date, currency, customer_name, customer_addr, subtotal, tax, total, status(draft|sent|paid|overdue), pdf_uri

invoice_lines  
id, invoice_id, description, qty, unit_price, tax_rate, line_total

categories  
id, name, description, tax_treatment

user_profiles  
id, user_id, language, preferences, recent_activity

⸻

6) Prompts (initial)

Keep numbers out of LLM math. LLM extracts → backend computes.

Router (classification)  
“Classify the user request into one of: record_tx, invoice_create, invoice_reissue, summary, help, audio_input. Return JSON with {intent, entities:{amount,currency,date,party,items[]}}.”

Extraction (post-OCR refinement)  
“You are standardizing parsed invoice fields for accounting. Return a JSON with vendor, issue_date(YYYY-MM-DD), due_date, currency(ISO), line_items[{desc,qty,unit_price,tax_rate}], subtotal, tax, total. If unsure, set null and confidence per field.”

Cashflow explanation  
“Explain this cashflow summary in {{LANG}} for a small shop owner. Use friendly tone, 3 bullet points, and one practical tip.”

⸻

7) Code Tasks & Commands

7.1 Repo Scaffolding
- Create monorepo:

/apps/web            # Next.js app (selector + chat + upload + audio + data display)
/apps/adk-backend    # FastAPI + ADK agents + tools
	/agents            # router.py, cashflow.py, invoice.py, audio.py, profile.py, help.py
	/tools             # ocr_image.py, ledger_db.py, pdf.py, categorize.py, audio_to_text.py
	/models            # se-lion_client.py, gpt4o_client.py, whisper_client.py
	/schemas           # pydantic models
	/eval              # unit tests for tools + JSON contracts
	/deploy            # local deploy scripts

7.2 ADK Backend Setup
- Install ADK + FastAPI + DB + PDF lib + local OCR/audio/image clients.
- Implement RouterAgent (intent JSON) and attach CashflowAgent, InvoiceAgent, AudioAgent, ProfileAgent.
- Register tools with ADK tool interface (function tools). Reference ADK multi-agent and model docs for patterns and LiteLLM/Ollama providers.

7.3 Local OCR/Image Integration
- In tools/ocr_image.py:
	- process_invoice(file_uri|bytes) -> NormalizedInvoiceJSON
	- Use Tesseract or GPT-4o mini for OCR/image understanding.
	- Add unit tests with sample PDFs/images.

7.4 Audio Integration
- In tools/audio_to_text.py:
	- process_audio(file_uri|bytes) -> transcript (OpenAI Realtime API or local Whisper)
	- Route transcript to RouterAgent for further processing.

7.5 Ledger & Invoicing
- tools/ledger_db.py: SQLAlchemy (SQLite → Postgres).
- tools/pdf.py: HTML template + PDF render (WeasyPrint/wkhtmltopdf).
- agents/invoice.py: build invoice from JSON; store header+lines; return PDF URL.

7.6 Web Frontend
- Left-rail selector: “Record / Upload / Audio / Invoices / Summary / Settings”.
- Upload widget (drag/drop) → /adk/upload.
- Audio widget (record/upload) → /adk/audio.
- Chat (right pane) → streams assistant replies; show extracted fields diff for user confirmation.
- Data tables, charts, and summaries for transactions and invoices.

7.7 Optional: Profile & Personalization
- Add user profile/language prefs (ProfileAgent).
- Use profile data to personalize UI and default language.

⸻

8) Environment & Secrets

- DATABASE_URL (SQLite local, Postgres prod).
- PDF_BUCKET (if storing PDFs in local or cloud storage).
- MODEL_PROVIDER=ollama|litellm, SEA_LION_MODEL=aisingapore/SEA-LION-v1-7B (example).
- GPT4O_API_KEY (if using OpenAI API for GPT-4o mini).
- AUDIO_API_KEY (if using OpenAI Realtime API for audio).

⸻

9) Acceptance Tests

1. Upload receipt (image/PDF) → expense row appears with correct amount/currency/date/vendor; user can edit; CSV export matches UI.
2. Create invoice via chat or voice → PDF file with accurate totals/tax; stored in DB; status=sent.
3. Monthly summary with correct arithmetic (double-check totals vs. DB).
4. Language switch (e.g., Indonesian) → all assistant text localized (SEA-LION).
5. Audio input (record/upload) → transcript processed as transaction; accuracy ≥90%.

⸻

10) Milestones (4 weeks)

- W1: ADK skeleton (router, agents), SEA-LION wired via LiteLLM/Ollama; Ledger DB; upload/audio endpoints.
- W2: Local OCR/image/audio extraction; CSV export; simple summary; data display in frontend.
- W3: Invoice agent + PDF; localization pass; UI polish.
- W4: Hardening (eval cases, error states), minimal deploy (local scripts).

⸻

11) Risk & Guardrails

- Numerical correctness: only code does math; LLM outputs labeled “explanations”.
- Extraction variance: allow user confirmation & corrections; log diffs for future tuning; rely on local models for extraction.
- Latency/cost: batch OCR, cache parsed docs, stream LLM responses.
- PII/security: redact logs; local storage; scoped access.
- Hallucinations: add disclaimers; keep grounding for help/docs (later).

⸻

12) Code Starters (Claude prompts)

Create ADK Router + Agents

“Generate Python ADK code for a RouterAgent (SEA-LION model) routing to CashflowAgent, InvoiceAgent, AudioAgent, and ProfileAgent. Each agent must expose tools with Pydantic I/O: LocalOCR, CategorizeExpense, LedgerDB, GenerateInvoiceHTML, HtmlToPDF, AudioToText. Include FastAPI endpoints /chat, /upload, and /audio.”

Wire SEA-LION via LiteLLM/Ollama

“Add an ADK model provider using LiteLLM to call an Ollama-hosted SEA-LION 7B. Create a config file to switch providers at runtime.”

Local OCR/Image Tool

“Implement process_invoice(file_bytes) using Tesseract or GPT-4o mini; return normalized JSON fields.”

Audio Tool

“Implement process_audio(file_bytes) using OpenAI Realtime API or local Whisper; return transcript for further processing.”

Invoice PDF Tool

“Create a Jinja2 HTML invoice template with localized labels; render to PDF and store to /data/pdfs (local) with signed URL generator.”

⸻

13) References (for Claude / devs)

- ADK docs (overview & multi-agent): flexible, model-agnostic; MAS composition.
- ADK models (LiteLLM/Ollama provider): attach local models easily.
- SEA-LION (docs & model card): SEA-trained, 11 languages; HF 7B card.
- GPT-4o mini (docs): text/image understanding.
- Tesseract (docs): local OCR.
- Whisper (docs): local audio transcription.
- OpenAI Realtime API (docs): audio streaming.
- Deploy (local scripts): Python; scale and manage agents.

⸻

Final notes for Claude Code
- Prioritize tool correctness and database integrity; keep LLM in the loop for language & intent, not arithmetic.
- Start with English + one SEA language (e.g., Bahasa Indonesia) → add more after extraction pipeline stabilizes.
- Keep prompts and schemas in /schemas/ so Claude can iterate safely without breaking contracts.
- Display all data in the frontend for user review and confirmation.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Header
      "header.title": "plainfigures",
      "header.subtitle": "Manage your business finances with AI assistance",
      "header.backend_status": "Backend",
      "header.connected": "Connected",
      
      // Loading screens
      "loading.connecting": "Connecting to backend services...",
      "loading.first_startup": "This may take a moment on first startup",
      "error.backend_unavailable": "Backend Unavailable",
      "error.unable_connect": "Unable to connect to backend services at localhost:8000",
      "button.retry_connection": "Retry Connection",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Record Transactions",
      "nav.upload": "Upload Invoice",
      "nav.invoices": "Generate An Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "AI Financial Recommendations",
      "dashboard.cache": "Cache",
      "dashboard.minutes_ago": "m ago",
      "dashboard.refresh": "Refresh",
      
      // Notes and instructions
      "note.currency": "Note: For development purposes, we are using SGD as the primary currency.",
      "note.image_uploads": "Note: For development purposes, only image uploads are supported.",
      
      // Upload instructions
      "upload.instructions": "Instructions",
      "upload.supported_formats": "Supported Formats",
      "upload.formats.images": "Images: JPG, PNG",
      "upload.formats.documents": "Documents: PDF",
      "upload.what_extract": "What We Extract",
      "upload.extract.vendor": "Vendor/supplier information",
      "upload.extract.dates": "Invoice dates and amounts",
      "upload.extract.items": "Line items and descriptions",
      "upload.extract.tax": "Tax amounts and totals",
      "upload.processing": "Processing",
      "upload.processing_desc": "Files are processed using OCR and AI to extract structured data. You can review and edit the extracted information before saving.",
      
      // Language picker
      "language.select": "Select Language",
      
      // Cashflow Summary
      "cashflow.title": "Cashflow Summary",
      "cashflow.loading": "Loading summary...",
      "cashflow.try_again": "Try Again",
      "cashflow.no_data": "No data available",
      "cashflow.amounts_converted": "All amounts converted to SGD",
      "cashflow.hide_breakdown": "Hide",
      "cashflow.show_breakdown": "Show",
      "cashflow.breakdown": "Breakdown",
      "cashflow.last_7_days": "Last 7 days",
      "cashflow.last_30_days": "Last 30 days",
      "cashflow.last_90_days": "Last 90 days",
      "cashflow.last_year": "Last year",
      "cashflow.income": "Income (SGD)",
      "cashflow.expenses": "Expenses (SGD)",
      "cashflow.net": "Net (SGD)",
      "cashflow.top_categories": "Top Expense Categories",
      "cashflow.based_on_transactions": "Based on {{count}} transactions in the last {{days}} days",
      
      // Transaction List
      "transactions.title": "Recent Transactions",
      "transactions.loading": "Loading transactions...",
      "transactions.try_again": "Try Again",
      "transactions.no_transactions": "No transactions found",
      "transactions.add_first": "Add your first transaction to get started",
      "transactions.in": "IN",
      "transactions.out": "OUT",
      "transactions.tax": "Tax",
      
      // Record Transactions
      "record.voice_title": "Voice Transaction Entry",
      "record.voice_description": "Record transactions using voice input. Click the microphone to start recording your transaction details.",
      "record.recording": "Recording...",
      "record.click_to_start": "Click to start recording",
      "record.click_again_stop": "Click again to stop",
      "record.speak_details": "Speak your transaction details",
      "record.process_voice": "Process Voice Input",
      "record.manual_title": "Manual Transaction Entry",
      "record.date": "Date",
      "record.direction": "Direction",
      "record.income": "Income (IN)",
      "record.expense": "Expense (OUT)",
      "record.amount": "Amount",
      "record.currency": "Currency",
      "record.category": "Category",
      "record.counterparty": "Counterparty",
      "record.select_counterparty": "Select counterparty (optional)",
      "record.customer": "Customer",
      "record.supplier": "Supplier",
      "record.payment_method": "Payment Method",
      "record.tax_amount": "Tax Amount",
      "record.description": "Description",
      "record.description_placeholder": "Transaction description...",
      "record.document_reference": "Document Reference",
      "record.document_placeholder": "Invoice number, receipt ID, etc.",
      "record.preview_transaction": "Preview Transaction",
      "record.creating": "Creating...",
      "record.confirm_transaction": "Confirm Transaction",
      "record.review_details": "Please review the transaction details below and confirm to submit:",
      "record.confirm_create": "Confirm & Create Transaction",
      "record.cancel": "Cancel",
      "record.select_category": "Select category",
      "record.fill_required": "Please fill in all required fields",
      
      // Categories
      "category.sales_revenue": "Sales Revenue",
      "category.office_expenses": "Office Expenses",
      "category.professional_services": "Professional Services",
      "category.marketing_expenses": "Marketing Expenses",
      "category.equipment_purchase": "Equipment Purchase",
      "category.staff_salaries": "Staff Salaries",
      "category.utilities": "Utilities",
      "category.office_rent": "Office Rent",
      "category.miscellaneous": "Miscellaneous",
      
      // Payment Methods
      "payment.bank_transfer": "Bank Transfer",
      "payment.credit_card": "Credit Card",
      "payment.cash": "Cash",
      "payment.cheque": "Cheque",
      "payment.digital_wallet": "Digital Wallet",
      
      // Currencies
      "currency.sgd": "SGD - Singapore Dollar",
      "currency.idr": "IDR - Indonesian Rupiah",
      "currency.thb": "THB - Thai Baht",
      "currency.myr": "MYR - Malaysian Ringgit",
      "currency.php": "PHP - Philippine Peso",
      "currency.mmk": "MMK - Myanmar Kyat"
    }
  },
  id: {
    translation: {
      // Header
      "header.title": "plainfigures",
      "header.subtitle": "Kelola keuangan bisnis Anda dengan bantuan AI",
      "header.backend_status": "Backend",
      "header.connected": "Terhubung",
      
      // Loading screens
      "loading.connecting": "Menghubungkan ke layanan backend...",
      "loading.first_startup": "Ini mungkin memerlukan waktu saat startup pertama",
      "error.backend_unavailable": "Backend Tidak Tersedia",
      "error.unable_connect": "Tidak dapat terhubung ke layanan backend di localhost:8000",
      "button.retry_connection": "Coba Lagi Koneksi",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Catat Transaksi",
      "nav.upload": "Unggah Invoice",
      "nav.invoices": "Buat Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "Rekomendasi Keuangan AI",
      "dashboard.cache": "Cache",
      "dashboard.minutes_ago": "m lalu",
      "dashboard.refresh": "Refresh",
      
      // Notes and instructions
      "note.currency": "Catatan: Untuk tujuan pengembangan, kami menggunakan SGD sebagai mata uang utama.",
      "note.image_uploads": "Catatan: Untuk tujuan pengembangan, hanya unggahan gambar yang didukung.",
      
      // Upload instructions
      "upload.instructions": "Instruksi",
      "upload.supported_formats": "Format yang Didukung",
      "upload.formats.images": "Gambar: JPG, PNG",
      "upload.formats.documents": "Dokumen: PDF",
      "upload.what_extract": "Yang Kami Ekstrak",
      "upload.extract.vendor": "Informasi vendor/supplier",
      "upload.extract.dates": "Tanggal dan jumlah invoice",
      "upload.extract.items": "Item baris dan deskripsi",
      "upload.extract.tax": "Jumlah pajak dan total",
      "upload.processing": "Pemrosesan",
      "upload.processing_desc": "File diproses menggunakan OCR dan AI untuk mengekstrak data terstruktur. Anda dapat meninjau dan mengedit informasi yang diekstrak sebelum menyimpan.",
      
      // Language picker
      "language.select": "Pilih Bahasa",
      
      // Cashflow Summary
      "cashflow.title": "Ringkasan Arus Kas",
      "cashflow.loading": "Memuat ringkasan...",
      "cashflow.try_again": "Coba Lagi",
      "cashflow.no_data": "Tidak ada data tersedia",
      "cashflow.amounts_converted": "Semua jumlah dikonversi ke SGD",
      "cashflow.hide_breakdown": "Sembunyikan",
      "cashflow.show_breakdown": "Tampilkan",
      "cashflow.breakdown": "Rincian",
      "cashflow.last_7_days": "7 hari terakhir",
      "cashflow.last_30_days": "30 hari terakhir",
      "cashflow.last_90_days": "90 hari terakhir",
      "cashflow.last_year": "Tahun lalu",
      "cashflow.income": "Pendapatan (SGD)",
      "cashflow.expenses": "Pengeluaran (SGD)",
      "cashflow.net": "Bersih (SGD)",
      "cashflow.top_categories": "Kategori Pengeluaran Teratas",
      "cashflow.based_on_transactions": "Berdasarkan {{count}} transaksi dalam {{days}} hari terakhir",
      
      // Transaction List
      "transactions.title": "Transaksi Terbaru",
      "transactions.loading": "Memuat transaksi...",
      "transactions.try_again": "Coba Lagi",
      "transactions.no_transactions": "Tidak ada transaksi ditemukan",
      "transactions.add_first": "Tambahkan transaksi pertama Anda untuk memulai",
      "transactions.in": "MASUK",
      "transactions.out": "KELUAR",
      "transactions.tax": "Pajak",
      
      // Record Transactions
      "record.voice_title": "Entri Transaksi Suara",
      "record.voice_description": "Catat transaksi menggunakan input suara. Klik mikrofon untuk mulai merekam detail transaksi Anda.",
      "record.recording": "Merekam...",
      "record.click_to_start": "Klik untuk mulai merekam",
      "record.click_again_stop": "Klik lagi untuk berhenti",
      "record.speak_details": "Ucapkan detail transaksi Anda",
      "record.process_voice": "Proses Input Suara",
      "record.manual_title": "Entri Transaksi Manual",
      "record.date": "Tanggal",
      "record.direction": "Arah",
      "record.income": "Pendapatan (MASUK)",
      "record.expense": "Pengeluaran (KELUAR)",
      "record.amount": "Jumlah",
      "record.currency": "Mata Uang",
      "record.category": "Kategori",
      "record.counterparty": "Pihak Lawan",
      "record.select_counterparty": "Pilih pihak lawan (opsional)",
      "record.customer": "Pelanggan",
      "record.supplier": "Supplier",
      "record.payment_method": "Metode Pembayaran",
      "record.tax_amount": "Jumlah Pajak",
      "record.description": "Deskripsi",
      "record.description_placeholder": "Deskripsi transaksi...",
      "record.document_reference": "Referensi Dokumen",
      "record.document_placeholder": "Nomor invoice, ID kuitansi, dll.",
      "record.preview_transaction": "Pratinjau Transaksi",
      "record.creating": "Membuat...",
      "record.confirm_transaction": "Konfirmasi Transaksi",
      "record.review_details": "Silakan tinjau detail transaksi di bawah ini dan konfirmasi untuk mengirim:",
      "record.confirm_create": "Konfirmasi & Buat Transaksi",
      "record.cancel": "Batal",
      "record.select_category": "Pilih kategori",
      "record.fill_required": "Harap isi semua bidang yang diperlukan",
      
      // Categories
      "category.sales_revenue": "Pendapatan Penjualan",
      "category.office_expenses": "Pengeluaran Kantor",
      "category.professional_services": "Layanan Profesional",
      "category.marketing_expenses": "Pengeluaran Pemasaran",
      "category.equipment_purchase": "Pembelian Peralatan",
      "category.staff_salaries": "Gaji Karyawan",
      "category.utilities": "Utilitas",
      "category.office_rent": "Sewa Kantor",
      "category.miscellaneous": "Lain-lain",
      
      // Payment Methods
      "payment.bank_transfer": "Transfer Bank",
      "payment.credit_card": "Kartu Kredit",
      "payment.cash": "Tunai",
      "payment.cheque": "Cek",
      "payment.digital_wallet": "Dompet Digital",
      
      // Currencies
      "currency.sgd": "SGD - Dolar Singapura",
      "currency.idr": "IDR - Rupiah Indonesia",
      "currency.thb": "THB - Baht Thailand",
      "currency.myr": "MYR - Ringgit Malaysia",
      "currency.php": "PHP - Peso Filipina",
      "currency.mmk": "MMK - Kyat Myanmar"
    }
  },
  th: {
    translation: {
      // Header
      "header.title": "plainfigures",
      "header.subtitle": "จัดการการเงินธุรกิจของคุณด้วยความช่วยเหลือจาก AI",
      "header.backend_status": "Backend",
      "header.connected": "เชื่อมต่อแล้ว",
      
      // Loading screens
      "loading.connecting": "กำลังเชื่อมต่อกับบริการ backend...",
      "loading.first_startup": "อาจใช้เวลาสักครู่ในการเริ่มต้นครั้งแรก",
      "error.backend_unavailable": "Backend ไม่พร้อมใช้งาน",
      "error.unable_connect": "ไม่สามารถเชื่อมต่อกับบริการ backend ที่ localhost:8000",
      "button.retry_connection": "ลองเชื่อมต่อใหม่",
      
      // Navigation tabs
      "nav.dashboard": "แดชบอร์ด",
      "nav.transactions": "บันทึกธุรกรรม",
      "nav.upload": "อัปโหลดใบแจ้งหนี้",
      "nav.invoices": "สร้างใบแจ้งหนี้",
      
      // Dashboard
      "dashboard.ai_recommendations": "คำแนะนำการเงินจาก AI",
      "dashboard.cache": "แคช",
      "dashboard.minutes_ago": "น. ที่แล้ว",
      "dashboard.refresh": "รีเฟรช",
      
      // Notes and instructions
      "note.currency": "หมายเหตุ: สำหรับวัตถุประสงค์ในการพัฒนา เราใช้ SGD เป็นสกุลเงินหลัก",
      "note.image_uploads": "หมายเหตุ: สำหรับวัตถุประสงค์ในการพัฒนา รองรับเฉพาะการอัปโหลดภาพเท่านั้น",
      
      // Upload instructions
      "upload.instructions": "คำแนะนำ",
      "upload.supported_formats": "รูปแบบที่รองรับ",
      "upload.formats.images": "ภาพ: JPG, PNG",
      "upload.formats.documents": "เอกสาร: PDF",
      "upload.what_extract": "สิ่งที่เราดึงข้อมูล",
      "upload.extract.vendor": "ข้อมูลผู้ขาย/ผู้จำหน่าย",
      "upload.extract.dates": "วันที่และจำนวนเงินในใบแจ้งหนี้",
      "upload.extract.items": "รายการและคำอธิบาย",
      "upload.extract.tax": "จำนวนภาษีและรวม",
      "upload.processing": "การประมวลผล",
      "upload.processing_desc": "ไฟล์ถูกประมวลผลโดยใช้ OCR และ AI เพื่อดึงข้อมูลที่มีโครงสร้าง คุณสามารถตรวจสอบและแก้ไขข้อมูลที่ดึงมาก่อนบันทึก",
      
      // Language picker
      "language.select": "เลือกภาษา",
      
      // Cashflow Summary
      "cashflow.title": "สรุปกระแสเงินสด",
      "cashflow.loading": "กำลังโหลดสรุป...",
      "cashflow.try_again": "ลองใหม่",
      "cashflow.no_data": "ไม่มีข้อมูล",
      "cashflow.amounts_converted": "จำนวนเงินทั้งหมดแปลงเป็น SGD",
      "cashflow.hide_breakdown": "ซ่อน",
      "cashflow.show_breakdown": "แสดง",
      "cashflow.breakdown": "รายละเอียด",
      "cashflow.last_7_days": "7 วันที่ผ่านมา",
      "cashflow.last_30_days": "30 วันที่ผ่านมา",
      "cashflow.last_90_days": "90 วันที่ผ่านมา",
      "cashflow.last_year": "ปีที่แล้ว",
      "cashflow.income": "รายได้ (SGD)",
      "cashflow.expenses": "รายจ่าย (SGD)",
      "cashflow.net": "สุทธิ (SGD)",
      "cashflow.top_categories": "หมวดรายจ่ายสูงสุด",
      "cashflow.based_on_transactions": "อิงจาก {{count}} ธุรกรรมใน {{days}} วันที่ผ่านมา",
      
      // Transaction List
      "transactions.title": "ธุรกรรมล่าสุด",
      "transactions.loading": "กำลังโหลดธุรกรรม...",
      "transactions.try_again": "ลองใหม่",
      "transactions.no_transactions": "ไม่พบธุรกรรม",
      "transactions.add_first": "เพิ่มธุรกรรมแรกของคุณเพื่อเริ่มต้น",
      "transactions.in": "เข้า",
      "transactions.out": "ออก",
      "transactions.tax": "ภาษี",
      
      // Record Transactions
      "record.voice_title": "บันทึกธุรกรรมด้วยเสียง",
      "record.voice_description": "บันทึกธุรกรรมโดยใช้อินพุตเสียง คลิกไมโครโฟนเพื่อเริ่มบันทึกรายละเอียดธุรกรรมของคุณ",
      "record.recording": "กำลังบันทึก...",
      "record.click_to_start": "คลิกเพื่อเริ่มบันทึก",
      "record.click_again_stop": "คลิกอีกครั้งเพื่อหยุด",
      "record.speak_details": "พูดรายละเอียดธุรกรรมของคุณ",
      "record.process_voice": "ประมวลผลอินพุตเสียง",
      "record.manual_title": "บันทึกธุรกรรมด้วยตนเอง",
      "record.date": "วันที่",
      "record.direction": "ทิศทาง",
      "record.income": "รายได้ (เข้า)",
      "record.expense": "รายจ่าย (ออก)",
      "record.amount": "จำนวน",
      "record.currency": "สกุลเงิน",
      "record.category": "หมวดหมู่",
      "record.counterparty": "คู่สัญญา",
      "record.select_counterparty": "เลือกคู่สัญญา (ไม่บังคับ)",
      "record.customer": "ลูกค้า",
      "record.supplier": "ผู้จำหน่าย",
      "record.payment_method": "วิธีการชำระเงิน",
      "record.tax_amount": "จำนวนภาษี",
      "record.description": "คำอธิบาย",
      "record.description_placeholder": "คำอธิบายธุรกรรม...",
      "record.document_reference": "เอกสารอ้างอิง",
      "record.document_placeholder": "หมายเลขใบแจ้งหนี้, ID ใบเสร็จ ฯลฯ",
      "record.preview_transaction": "ดูตัวอย่างธุรกรรม",
      "record.creating": "กำลังสร้าง...",
      "record.confirm_transaction": "ยืนยันธุรกรรม",
      "record.review_details": "กรุณาตรวจสอบรายละเอียดธุรกรรมด้านล่างและยืนยันเพื่อส่ง:",
      "record.confirm_create": "ยืนยัน & สร้างธุรกรรม",
      "record.cancel": "ยกเลิก",
      "record.select_category": "เลือกหมวดหมู่",
      "record.fill_required": "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด",
      
      // Categories
      "category.sales_revenue": "รายได้จากการขาย",
      "category.office_expenses": "ค่าใช้จ่ายสำนักงาน",
      "category.professional_services": "บริการวิชาชีพ",
      "category.marketing_expenses": "ค่าใช้จ่ายการตลาด",
      "category.equipment_purchase": "การซื้ออุปกรณ์",
      "category.staff_salaries": "เงินเดือนพนักงาน",
      "category.utilities": "สาธารณูปโภค",
      "category.office_rent": "ค่าเช่าสำนักงาน",
      "category.miscellaneous": "เบ็ดเตล็ด",
      
      // Payment Methods
      "payment.bank_transfer": "โอนเงินธนาคาร",
      "payment.credit_card": "บัตรเครดิต",
      "payment.cash": "เงินสด",
      "payment.cheque": "เช็ค",
      "payment.digital_wallet": "กระเป๋าเงินดิจิทัล",
      
      // Currencies
      "currency.sgd": "SGD - ดอลลาร์สิงคโปร์",
      "currency.idr": "IDR - รูเปียห์อินโดนีเซีย",
      "currency.thb": "THB - บาทไทย",
      "currency.myr": "MYR - ริงกิตมาเลเซีย",
      "currency.php": "PHP - เปโซฟิลิปปินส์",
      "currency.mmk": "MMK - จ๊าตพม่า"
    }
  },
  tl: {
    translation: {
      // Header
      "header.title": "plainfigures",
      "header.subtitle": "Pamahalaan ang inyong business finances gamit ang AI assistance",
      "header.backend_status": "Backend",
      "header.connected": "Nakakonekta",
      
      // Loading screens
      "loading.connecting": "Kumukonekta sa backend services...",
      "loading.first_startup": "Maaaring tumagal ng konti sa unang startup",
      "error.backend_unavailable": "Hindi Available ang Backend",
      "error.unable_connect": "Hindi makakonekta sa backend services sa localhost:8000",
      "button.retry_connection": "Subukan Ulit ang Koneksyon",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Mag-record ng Transactions",
      "nav.upload": "Mag-upload ng Invoice",
      "nav.invoices": "Lumikha ng Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "AI Financial Recommendations",
      "dashboard.cache": "Cache",
      "dashboard.minutes_ago": "m nakaraan",
      "dashboard.refresh": "Refresh",
      
      // Notes and instructions
      "note.currency": "Paalala: Para sa development purposes, ginagamit namin ang SGD bilang primary currency.",
      "note.image_uploads": "Paalala: Para sa development purposes, image uploads lang ang supported.",
      
      // Upload instructions
      "upload.instructions": "Mga Tagubilin",
      "upload.supported_formats": "Mga Supported na Format",
      "upload.formats.images": "Mga Larawan: JPG, PNG",
      "upload.formats.documents": "Mga Dokumento: PDF",
      "upload.what_extract": "Ano ang Aming Kinukuha",
      "upload.extract.vendor": "Vendor/supplier information",
      "upload.extract.dates": "Invoice dates at amounts",
      "upload.extract.items": "Line items at descriptions",
      "upload.extract.tax": "Tax amounts at totals",
      "upload.processing": "Pagproproseso",
      "upload.processing_desc": "Ang mga file ay pinoproseso gamit ang OCR at AI para makuha ang structured data. Maaari ninyong suriin at i-edit ang extracted information bago i-save.",
      
      // Language picker
      "language.select": "Pumili ng Wika",
      
      // Cashflow Summary
      "cashflow.title": "Buod ng Cashflow",
      "cashflow.loading": "Naglo-load ng buod...",
      "cashflow.try_again": "Subukan Ulit",
      "cashflow.no_data": "Walang available na data",
      "cashflow.amounts_converted": "Lahat ng halaga ay na-convert sa SGD",
      "cashflow.hide_breakdown": "Itago",
      "cashflow.show_breakdown": "Ipakita",
      "cashflow.breakdown": "Breakdown",
      "cashflow.last_7_days": "Huling 7 araw",
      "cashflow.last_30_days": "Huling 30 araw",
      "cashflow.last_90_days": "Huling 90 araw",
      "cashflow.last_year": "Nakaraang taon",
      "cashflow.income": "Kita (SGD)",
      "cashflow.expenses": "Gastos (SGD)",
      "cashflow.net": "Net (SGD)",
      "cashflow.top_categories": "Mga Nangungunang Kategorya ng Gastos",
      "cashflow.based_on_transactions": "Batay sa {{count}} transactions sa nakaraang {{days}} araw",
      
      // Transaction List
      "transactions.title": "Mga Kamakailang Transaction",
      "transactions.loading": "Naglo-load ng mga transaction...",
      "transactions.try_again": "Subukan Ulit",
      "transactions.no_transactions": "Walang nahanap na transactions",
      "transactions.add_first": "Magdagdag ng inyong unang transaction para magsimula",
      "transactions.in": "PASOK",
      "transactions.out": "LABAS",
      "transactions.tax": "Buwis",
      
      // Record Transactions
      "record.voice_title": "Voice Transaction Entry",
      "record.voice_description": "Mag-record ng mga transaction gamit ang voice input. I-click ang microphone para magsimula ng pag-record ng mga detalye ng inyong transaction.",
      "record.recording": "Nagre-record...",
      "record.click_to_start": "I-click para magsimula ng pag-record",
      "record.click_again_stop": "I-click ulit para tumigil",
      "record.speak_details": "Sabihin ang mga detalye ng inyong transaction",
      "record.process_voice": "I-process ang Voice Input",
      "record.manual_title": "Manual Transaction Entry",
      "record.date": "Petsa",
      "record.direction": "Direksyon",
      "record.income": "Kita (PASOK)",
      "record.expense": "Gastos (LABAS)",
      "record.amount": "Halaga",
      "record.currency": "Currency",
      "record.category": "Kategorya",
      "record.counterparty": "Counterparty",
      "record.select_counterparty": "Pumili ng counterparty (optional)",
      "record.customer": "Customer",
      "record.supplier": "Supplier",
      "record.payment_method": "Paraan ng Bayad",
      "record.tax_amount": "Halaga ng Buwis",
      "record.description": "Paglalarawan",
      "record.description_placeholder": "Paglalarawan ng transaction...",
      "record.document_reference": "Document Reference",
      "record.document_placeholder": "Invoice number, receipt ID, atbp.",
      "record.preview_transaction": "Preview ng Transaction",
      "record.creating": "Ginagawa...",
      "record.confirm_transaction": "Kumpirmahin ang Transaction",
      "record.review_details": "Pakisuri ang mga detalye ng transaction sa ibaba at kumpirmahin para i-submit:",
      "record.confirm_create": "Kumpirmahin & Gumawa ng Transaction",
      "record.cancel": "Kanselahin",
      "record.select_category": "Pumili ng kategorya",
      "record.fill_required": "Pakipunan ang lahat ng kinakailangang fields",
      
      // Categories
      "category.sales_revenue": "Sales Revenue",
      "category.office_expenses": "Office Expenses",
      "category.professional_services": "Professional Services",
      "category.marketing_expenses": "Marketing Expenses",
      "category.equipment_purchase": "Equipment Purchase",
      "category.staff_salaries": "Staff Salaries",
      "category.utilities": "Utilities",
      "category.office_rent": "Office Rent",
      "category.miscellaneous": "Miscellaneous",
      
      // Payment Methods
      "payment.bank_transfer": "Bank Transfer",
      "payment.credit_card": "Credit Card",
      "payment.cash": "Cash",
      "payment.cheque": "Cheque",
      "payment.digital_wallet": "Digital Wallet",
      
      // Currencies
      "currency.sgd": "SGD - Singapore Dollar",
      "currency.idr": "IDR - Indonesian Rupiah",
      "currency.thb": "THB - Thai Baht",
      "currency.myr": "MYR - Malaysian Ringgit",
      "currency.php": "PHP - Philippine Peso",
      "currency.mmk": "MMK - Myanmar Kyat"
    }
  }
};

// Get saved language preference or default to English
const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;

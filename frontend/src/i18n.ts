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
      "error.unable_connect": "Unable to connect to backend services at localhost:8080",
      "button.retry_connection": "Retry Connection",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Add Data",
      "nav.invoices": "Generate An Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "AI Financial Recommendations",
      "dashboard.market_research": "Market Research Analysis",
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
      
      // Add Data Interface
      "add_data.title": "Add Your Business Data",
      "add_data.subtitle": "Simply speak, type, or upload documents - we'll handle the rest",
      "add_data.voice_title": "Speak Naturally",
      "add_data.voice_description": "Just tell us about your transaction",
      "add_data.upload_title": "Upload Document",
      "add_data.upload_description": "Invoice, receipt, or photo",
      "add_data.text_title": "Type Naturally",
      "add_data.text_description": "Describe your transaction in plain text",
      "add_data.text_placeholder": "e.g., 'Paid $500 to ABC Corp for office supplies on March 15th via bank transfer'",
      "add_data.step1": "Choose Your Method",
      "add_data.step1_desc": "Voice, upload, or type - whatever feels natural to you",
      "add_data.step2": "We Extract the Data",
      "add_data.step2_desc": "Our AI understands your input and extracts transaction details",
      "add_data.step3": "Automatically Organized",
      "add_data.step3_desc": "Your data is categorized and ready for financial insights",
      "add_data.recording": "Recording...",
      "add_data.tap_to_record": "Tap to record",
      "add_data.processing": "Processing...",
      "add_data.process_voice": "Process Voice",
      "add_data.process_text": "Process Text",
      "add_data.click_to_upload": "Click to upload",
      "add_data.file_types": "JPG, PNG, PDF",
      "add_data.data_extracted": "✓ Data extracted successfully",
      "add_data.vendor": "Vendor",
      "add_data.amount": "Amount",
      
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
      "error.unable_connect": "Tidak dapat terhubung ke layanan backend di localhost:8080",
      "button.retry_connection": "Coba Lagi Koneksi",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Tambah Data",
      "nav.invoices": "Buat Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "Rekomendasi Keuangan AI",
      "dashboard.market_research": "Analisis Riset Pasar",
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
      
      // Add Data Interface
      "add_data.title": "Tambahkan Data Bisnis Anda",
      "add_data.subtitle": "Cukup bicara, ketik, atau unggah dokumen - kami akan menangani sisanya",
      "add_data.voice_title": "Bicara Secara Alami",
      "add_data.voice_description": "Ceritakan saja tentang transaksi Anda",
      "add_data.upload_title": "Unggah Dokumen",
      "add_data.upload_description": "Invoice, kuitansi, atau foto",
      "add_data.text_title": "Ketik Secara Alami",
      "add_data.text_description": "Jelaskan transaksi Anda dalam teks biasa",
      "add_data.text_placeholder": "mis., 'Bayar $500 ke ABC Corp untuk persediaan kantor pada 15 Maret melalui transfer bank'",
      "add_data.step1": "Pilih Metode Anda",
      "add_data.step1_desc": "Suara, unggah, atau ketik - apa pun yang terasa natural untuk Anda",
      "add_data.step2": "Kami Ekstrak Datanya",
      "add_data.step2_desc": "AI kami memahami input Anda dan mengekstrak detail transaksi",
      "add_data.step3": "Terorganisir Otomatis",
      "add_data.step3_desc": "Data Anda dikategorikan dan siap untuk wawasan keuangan",
      "add_data.recording": "Merekam...",
      "add_data.tap_to_record": "Ketuk untuk merekam",
      "add_data.processing": "Memproses...",
      "add_data.process_voice": "Proses Suara",
      "add_data.process_text": "Proses Teks",
      "add_data.click_to_upload": "Klik untuk mengunggah",
      "add_data.file_types": "JPG, PNG, PDF",
      "add_data.data_extracted": "✓ Data berhasil diekstrak",
      "add_data.vendor": "Vendor",
      "add_data.amount": "Jumlah",
      
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
      "error.unable_connect": "ไม่สามารถเชื่อมต่อกับบริการ backend ที่ localhost:8080",
      "button.retry_connection": "ลองเชื่อมต่อใหม่",
      
      // Navigation tabs
      "nav.dashboard": "แดชบอร์ด",
      "nav.transactions": "เพิ่มข้อมูล",
      "nav.invoices": "สร้างใบแจ้งหนี้",
      
      // Dashboard
      "dashboard.ai_recommendations": "คำแนะนำการเงินจาก AI",
      "dashboard.market_research": "การวิเคราะห์การวิจัยตลาด",
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
      
      // Add Data Interface
      "add_data.title": "เพิ่มข้อมูลธุรกิจของคุณ",
      "add_data.subtitle": "แค่พูด พิมพ์ หรืออัปโหลดเอกสาร - เราจะจัดการส่วนที่เหลือ",
      "add_data.voice_title": "พูดธรรมชาติ",
      "add_data.voice_description": "แค่บอกเราเกี่ยวกับธุรกรรมของคุณ",
      "add_data.upload_title": "อัปโหลดเอกสาร",
      "add_data.upload_description": "ใบแจ้งหนี้ ใบเสร็จ หรือรูปภาพ",
      "add_data.text_title": "พิมพ์ธรรมชาติ",
      "add_data.text_description": "อธิบายธุรกรรมของคุณในข้อความธรรมดา",
      "add_data.text_placeholder": "เช่น 'จ่าย $500 ให้ ABC Corp สำหรับอุปกรณ์สำนักงานเมื่อ 15 มีนาคม ผ่านการโอนเงิน'",
      "add_data.step1": "เลือกวิธีของคุณ",
      "add_data.step1_desc": "เสียง อัปโหลด หรือพิมพ์ - อะไรก็ได้ที่รู้สึกธรรมชาติสำหรับคุณ",
      "add_data.step2": "เราสกัดข้อมูล",
      "add_data.step2_desc": "AI ของเราเข้าใจการป้อนข้อมูลของคุณและสกัดรายละเอียดธุรกรรม",
      "add_data.step3": "จัดระเบียบอัตโนมัติ",
      "add_data.step3_desc": "ข้อมูลของคุณถูกจัดหมวดหมู่และพร้อมสำหรับข้อมูลเชิงลึกทางการเงิน",
      "add_data.recording": "กำลังบันทึก...",
      "add_data.tap_to_record": "แตะเพื่อบันทึก",
      "add_data.processing": "กำลังประมวลผล...",
      "add_data.process_voice": "ประมวลผลเสียง",
      "add_data.process_text": "ประมวลผลข้อความ",
      "add_data.click_to_upload": "คลิกเพื่ออัปโหลด",
      "add_data.file_types": "JPG, PNG, PDF",
      "add_data.data_extracted": "✓ สกัดข้อมูลสำเร็จแล้ว",
      "add_data.vendor": "ผู้ขาย",
      "add_data.amount": "จำนวน",
      
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
      "error.unable_connect": "Hindi makakonekta sa backend services sa localhost:8080",
      "button.retry_connection": "Subukan Ulit ang Koneksyon",
      
      // Navigation tabs
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Magdagdag ng Data",
      "nav.invoices": "Lumikha ng Invoice",
      
      // Dashboard
      "dashboard.ai_recommendations": "AI Financial Recommendations",
      "dashboard.market_research": "Market Research Analysis",
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
      
      // Add Data Interface
      "add_data.title": "Idagdag ang Data ng Inyong Negosyo",
      "add_data.subtitle": "Magsalita lang, mag-type, o mag-upload ng mga dokumento - aasikaso namin ang iba",
      "add_data.voice_title": "Magsalita nang Natural",
      "add_data.voice_description": "Ikwento lang ang tungkol sa inyong transaction",
      "add_data.upload_title": "Mag-upload ng Dokumento",
      "add_data.upload_description": "Invoice, resibo, o larawan",
      "add_data.text_title": "Mag-type nang Natural",
      "add_data.text_description": "Ilarawan ang inyong transaction sa simpleng teksto",
      "add_data.text_placeholder": "halimbawa, 'Nagbayad ng $500 sa ABC Corp para sa office supplies noong March 15 sa pamamagitan ng bank transfer'",
      "add_data.step1": "Pumili ng Paraan",
      "add_data.step1_desc": "Boses, upload, o type - kahit ano ang comfortable para sa inyo",
      "add_data.step2": "Kukunin Namin ang Data",
      "add_data.step2_desc": "Naiintindihan ng aming AI ang inyong input at kinukuha ang mga detalye ng transaction",
      "add_data.step3": "Automatic na Organized",
      "add_data.step3_desc": "Naka-categorize na ang inyong data at handa na para sa financial insights",
      "add_data.recording": "Nagre-record...",
      "add_data.tap_to_record": "I-tap para mag-record",
      "add_data.processing": "Ginagawa...",
      "add_data.process_voice": "I-process ang Boses",
      "add_data.process_text": "I-process ang Teksto",
      "add_data.click_to_upload": "I-click para mag-upload",
      "add_data.file_types": "JPG, PNG, PDF",
      "add_data.data_extracted": "✓ Matagumpay na nakuha ang data",
      "add_data.vendor": "Vendor",
      "add_data.amount": "Halaga",
      
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

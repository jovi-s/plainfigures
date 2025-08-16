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
      "language.select": "Select Language"
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
      "language.select": "Pilih Bahasa"
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
      "language.select": "เลือกภาษา"
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
      "language.select": "Pumili ng Wika"
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

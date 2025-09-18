import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceApiClient } from "@/api/client";
import { InvoiceData } from "@/api/types";
import { Upload, FileImage, FileText, X, Check, Camera, Database, CheckCircle } from "lucide-react";
import { TransactionList } from "@/components/TransactionList";

interface RecordTransactionsProps {
  onTransactionCreated: () => void;
  onDataExtracted: (data: InvoiceData) => void;
  refreshTrigger: number;
}

export function RecordTransactions({ 
  onDataExtracted, 
  refreshTrigger 
}: RecordTransactionsProps) {
  const { t } = useTranslation();
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // General state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);

  // Clear messages after a delay
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  };


  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setExtractedData(null);
      setError(null);
      
      // Create preview URL for images and PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const previewUrl = URL.createObjectURL(file);
        setImagePreviewUrl(previewUrl);
      } else {
        setImagePreviewUrl(null);
      }
      
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      let response;
      
      if (file.type.startsWith('image/')) {
        response = await FinanceApiClient.uploadInvoiceImage(file);
      } else if (file.type === 'application/pdf') {
        response = await FinanceApiClient.uploadInvoicePDF(file);
      } else {
        throw new Error('Unsupported file type. Please upload an image or PDF.');
      }

      if (response.invoice_data) {
        setExtractedData(response.invoice_data);
        onDataExtracted(response.invoice_data);
        setSuccessMessage("File processed successfully!");
        clearMessages();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setError(null);
    setSavedToDb(false);
    
    // Clean up image preview URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSaveToDatabase = async () => {
    if (!extractedData) return;
    
    setIsSavingToDb(true);
    setError(null);
    
    try {
      const result = await FinanceApiClient.saveExtractedInvoiceData(extractedData);
      
      if (result.success) {
        setSavedToDb(true);
        setSuccessMessage(`Data saved successfully! Invoice ID: ${result.data?.invoice_id}`);
        clearMessages();
      } else {
        setError(result.error || 'Failed to save data to database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data to database');
    } finally {
      setIsSavingToDb(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-600" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <FileText className="h-8 w-8 text-neutral-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header with intro */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-800">{t('add_data.title')}</h1>
        <p className="text-neutral-600">
          {t('add_data.subtitle')}
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {/* File Upload and Extracted Data Section */}
      <div className={`grid gap-6 ${uploadedFile ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* File Upload Card */}
        <Card className="border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">{t('add_data.upload_title')}</CardTitle>
            <p className="text-sm text-neutral-600">
              {t('add_data.upload_description')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!uploadedFile ? (
              <div
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-neutral-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700">
                  {t('add_data.click_to_upload')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {t('add_data.file_types')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(uploadedFile)}
                      <div>
                        <p className="font-medium text-xs">{uploadedFile.name}</p>
                        <p className="text-xs text-neutral-500">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUploading ? (
                        <div className="text-blue-600 text-xs">{t('add_data.processing')}</div>
                      ) : extractedData ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : null}
                      <Button onClick={clearFile} variant="ghost" size="sm">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Preview Card - Show for both images and PDFs */}
        {uploadedFile && imagePreviewUrl && (
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {uploadedFile.type.startsWith('image/') ? (
                  <FileImage className="h-5 w-5 text-orange-600" />
                ) : (
                  <FileText className="h-5 w-5 text-orange-600" />
                )}
                {uploadedFile.type.startsWith('image/') 
                  ? t('add_data.image_preview_title') 
                  : t('add_data.pdf_preview_title')
                }
              </CardTitle>
              <p className="text-sm text-neutral-600">
                {uploadedFile.type.startsWith('image/') 
                  ? t('add_data.image_preview_description') 
                  : t('add_data.pdf_preview_description')
                }
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-3">
                {uploadedFile.type.startsWith('image/') ? (
                  // Image Preview
                  <div className="relative max-w-full max-h-96 overflow-hidden rounded-lg border border-neutral-200">
                    <img
                      src={imagePreviewUrl}
                      alt={uploadedFile.name}
                      className="max-w-full max-h-96 object-contain"
                    />
                  </div>
                ) : uploadedFile.type === 'application/pdf' ? (
                  // PDF Preview with fallback
                  <div className="w-full">
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <iframe
                        src={imagePreviewUrl}
                        className="w-full h-96"
                        title={uploadedFile.name}
                        onError={() => {
                          // Fallback: show PDF icon and download link if iframe fails
                          console.log('PDF preview failed, showing fallback');
                        }}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <a
                        href={imagePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        {t('add_data.open_pdf_new_tab')}
                      </a>
                    </div>
                  </div>
                ) : null}
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-700">{uploadedFile.name}</p>
                  <p className="text-xs text-neutral-500">{formatFileSize(uploadedFile.size)}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {uploadedFile.type.startsWith('image/') ? 'Image' : 'PDF Document'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Data Display Card */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {t('add_data.extracted_data_title')}
            </CardTitle>
            <p className="text-sm text-neutral-600">
              {t('add_data.extracted_data_description')}
            </p>
          </CardHeader>
          <CardContent>
            {isUploading ? (
              <div className="flex items-center justify-center py-8 text-neutral-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>{t('add_data.processing')}</span>
              </div>
            ) : extractedData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">{t('add_data.data_extracted')}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {extractedData.vendor && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.vendor')}
                      </label>
                      <p className="text-sm font-medium text-neutral-800 mt-1">{extractedData.vendor}</p>
                    </div>
                  )}
                  
                  {extractedData.issue_date && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.issue_date')}
                      </label>
                      <p className="text-sm font-medium text-neutral-800 mt-1">{extractedData.issue_date}</p>
                    </div>
                  )}
                  
                  {extractedData.due_date && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.due_date')}
                      </label>
                      <p className="text-sm font-medium text-neutral-800 mt-1">{extractedData.due_date}</p>
                    </div>
                  )}
                  
                  {extractedData.total && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <label className="text-xs font-medium text-green-600 uppercase tracking-wide">
                        {t('add_data.amount')}
                      </label>
                      <p className="text-lg font-bold text-green-700 mt-1">
                        {extractedData.currency || 'SGD'} {extractedData.total}
                      </p>
                    </div>
                  )}
                  
                  {extractedData.subtotal && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.subtotal')}
                      </label>
                      <p className="text-sm font-medium text-neutral-800 mt-1">
                        {extractedData.currency || 'SGD'} {extractedData.subtotal}
                      </p>
                    </div>
                  )}
                  
                  {extractedData.tax && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.tax')}
                      </label>
                      <p className="text-sm font-medium text-neutral-800 mt-1">
                        {extractedData.currency || 'SGD'} {extractedData.tax}
                      </p>
                    </div>
                  )}
                  
                  {extractedData.line_items && extractedData.line_items.length > 0 && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.line_items')}
                      </label>
                      <div className="mt-2 space-y-2">
                        {extractedData.line_items.map((item, index) => (
                          <div key={index} className="text-xs border-l-2 border-neutral-300 pl-2">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-neutral-600">
                              Qty: {item.qty} × {extractedData.currency || 'SGD'} {item.unit_price}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {extractedData.raw_text && (
                    <div className="p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {t('add_data.raw_text')}
                      </label>
                      <p className="text-xs text-neutral-700 mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {extractedData.raw_text}
                      </p>
                    </div>
                  )}

                  {/* Add to Database Button - moved here after raw text */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleSaveToDatabase}
                      disabled={isSavingToDb || savedToDb}
                      variant={savedToDb ? "secondary" : "default"}
                      size="sm"
                      className={savedToDb ? "bg-green-100 text-green-700 border-green-300" : ""}
                    >
                      {isSavingToDb ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          {t('add_data.saving')}
                        </>
                      ) : savedToDb ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('add_data.saved')}
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          {t('add_data.save_to_db')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                <FileText className="h-12 w-12 mb-3" />
                <p className="text-sm">{t('add_data.no_data_extracted')}</p>
                <p className="text-xs mt-1">{t('add_data.upload_file_to_see_data')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList key={`record-transactions-${refreshTrigger}`} />
        </CardContent>
      </Card>
    </div>
  );
}

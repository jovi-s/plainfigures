import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceApiClient } from "@/api/client";
import { InvoiceData } from "@/api/types";
import { Mic, MicOff, Send, Upload, FileImage, FileText, X, Check, MessageSquare, Camera } from "lucide-react";
import { TransactionList } from "@/components/TransactionList";

interface RecordTransactionsProps {
  onTransactionCreated: () => void;
  onDataExtracted: (data: InvoiceData) => void;
  refreshTrigger: number;
}

export function RecordTransactions({ 
  onTransactionCreated,
  onDataExtracted, 
  refreshTrigger 
}: RecordTransactionsProps) {
  const { t } = useTranslation();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Natural text input state
  const [naturalTextInput, setNaturalTextInput] = useState("");
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  // General state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear messages after a delay
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  };

  // Handle voice recording toggle
  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    setError(null);
    if (isRecording) {
      console.log("Stopping voice recording...");
      // Stop recording logic will go here
    } else {
      console.log("Starting voice recording...");
      // Start recording logic will go here
    }
  };

  // Handle transcription submission
  const handleTranscriptionSubmit = async () => {
    if (!transcriptionText.trim()) return;
    
    setIsProcessingText(true);
    setError(null);
    
    try {
      console.log("Processing voice transcription:", transcriptionText);
      // TODO: Send to backend for processing
      setSuccessMessage("Voice input processed successfully!");
      setTranscriptionText("");
      onTransactionCreated();
      clearMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process voice input");
    } finally {
      setIsProcessingText(false);
    }
  };

  // Handle natural text input submission
  const handleNaturalTextSubmit = async () => {
    if (!naturalTextInput.trim()) return;
    
    setIsProcessingText(true);
    setError(null);
    
    try {
      console.log("Processing natural text:", naturalTextInput);
      // TODO: Send to backend for processing
      setSuccessMessage("Text input processed successfully!");
      setNaturalTextInput("");
      onTransactionCreated();
      clearMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process text input");
    } finally {
      setIsProcessingText(false);
    }
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setExtractedData(null);
      setError(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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

      {/* Main input methods grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Voice Input */}
        <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Mic className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">{t('add_data.voice_title')}</CardTitle>
            <p className="text-sm text-neutral-600">
              {t('add_data.voice_description')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button
                onClick={handleVoiceToggle}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="w-20 h-20 rounded-full"
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              <p className="mt-2 text-sm font-medium">
                {isRecording ? t('add_data.recording') : t('add_data.tap_to_record')}
              </p>
            </div>

            {transcriptionText && (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <p className="text-sm text-neutral-700">{transcriptionText}</p>
                </div>
                <Button
                  onClick={handleTranscriptionSubmit}
                  disabled={!transcriptionText.trim() || isProcessingText}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isProcessingText ? t('add_data.processing') : t('add_data.process_voice')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
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
                
                {extractedData && (
                  <div className="text-xs space-y-2">
                    <p className="font-medium text-green-600">{t('add_data.data_extracted')}</p>
                    {extractedData.vendor && (
                      <p><strong>{t('add_data.vendor')}:</strong> {extractedData.vendor}</p>
                    )}
                    {extractedData.total && (
                      <p><strong>{t('add_data.amount')}:</strong> {extractedData.currency || 'SGD'} {extractedData.total}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Natural Text Input */}
        <Card className="border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">{t('add_data.text_title')}</CardTitle>
            <p className="text-sm text-neutral-600">
              {t('add_data.text_description')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={naturalTextInput}
              onChange={(e) => setNaturalTextInput(e.target.value)}
              placeholder={t('add_data.text_placeholder')}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleNaturalTextSubmit}
              disabled={!naturalTextInput.trim() || isProcessingText}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isProcessingText ? t('add_data.processing') : t('add_data.process_text')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-neutral-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-1">{t('add_data.step1')}</h3>
              <p className="text-neutral-600">
                {t('add_data.step1_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-1">{t('add_data.step2')}</h3>
              <p className="text-neutral-600">
                {t('add_data.step2_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-1">{t('add_data.step3')}</h3>
              <p className="text-neutral-600">
                {t('add_data.step3_desc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

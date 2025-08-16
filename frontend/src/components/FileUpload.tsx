import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FinanceApiClient } from '@/api/client';
import { InvoiceData } from '@/api/types';
import { Upload, FileImage, FileText, X, Check } from 'lucide-react';

interface FileUploadProps {
  onDataExtracted: (data: InvoiceData) => void;
}

export function FileUpload({ onDataExtracted }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <Card>
      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
          <strong>Note:</strong> For development purposes, extracted data is not sent to the backend yet.
        </div>
      </div>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
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

        {/* Upload area */}
        {!uploadedFile ? (
          <div
            onClick={triggerFileSelect}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-400 transition-colors"
          >
            <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700 mb-2">
              Upload Invoice Image or PDF
            </p>
            <p className="text-sm text-neutral-500">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Supports: JPG, PNG, PDF
            </p>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(uploadedFile)}
                <div>
                  <p className="font-medium text-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUploading ? (
                  <div className="text-blue-600 text-sm">Processing...</div>
                ) : extractedData ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : null}
                <Button onClick={clearFile} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Extracted data preview */}
        {extractedData && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Extracted Data</h3>
            
            {extractedData.raw_text && (
              <div>
                <label className="block text-sm font-medium mb-1">Raw Text</label>
                <Textarea
                  value={extractedData.raw_text}
                  readOnly
                  rows={4}
                  className="bg-neutral-50"
                />
              </div>
            )}

            {(extractedData.vendor || extractedData.total || extractedData.currency) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {extractedData.vendor && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor</label>
                    <p className="text-sm bg-neutral-50 p-2 rounded border">
                      {extractedData.vendor}
                    </p>
                  </div>
                )}
                
                {extractedData.total && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Total</label>
                    <p className="text-sm bg-neutral-50 p-2 rounded border">
                      {extractedData.currency || 'SGD'} {extractedData.total}
                    </p>
                  </div>
                )}
                
                {extractedData.issue_date && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <p className="text-sm bg-neutral-50 p-2 rounded border">
                      {extractedData.issue_date}
                    </p>
                  </div>
                )}
              </div>
            )}

            {extractedData.line_items && extractedData.line_items.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Line Items</label>
                <div className="space-y-2">
                  {extractedData.line_items.map((item, index) => (
                    <div key={index} className="text-sm bg-neutral-50 p-2 rounded border">
                      <strong>{item.description}</strong> - Qty: {item.qty} × {item.unit_price}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!uploadedFile && (
          <Button onClick={triggerFileSelect} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

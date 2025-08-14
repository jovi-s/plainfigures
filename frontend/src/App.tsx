import { useState, useEffect } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { CashflowSummary } from "@/components/CashflowSummary";
import { FileUpload } from "@/components/FileUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinanceApiClient } from "@/api/client";
import { Customer, Supplier, InvoiceData } from "@/api/types";
import { Building2, TrendingUp, Upload, FileText, RefreshCw } from "lucide-react";

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load customers and suppliers data
  const loadData = async () => {
    try {
      const [customersResponse, suppliersResponse] = await Promise.all([
        FinanceApiClient.getCustomers(),
        FinanceApiClient.getSuppliers(),
      ]);

      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data);
      }

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Check backend health
  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      await FinanceApiClient.healthCheck();
      return true;
    } catch (error) {
      console.log("Backend not ready yet:", error);
      return false;
    }
  };

  // Handle transaction creation
  const handleTransactionCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle file upload data extraction
  const handleDataExtracted = (data: InvoiceData) => {
    console.log('Extracted invoice data:', data);
    // Could open a modal or form to review and confirm the extracted data
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsCheckingBackend(true);
      // Check if backend is ready with retry logic
      const maxAttempts = 30; // 1 minute with 2-second intervals
      let attempts = 0;
      while (attempts < maxAttempts) {
        const isReady = await checkBackendHealth();
        if (isReady) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          await loadData();
          return;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setIsCheckingBackend(false);
      console.error("Backend failed to start within 1 minute");
    };
    initializeApp();
  }, []);

  // Loading screen component
  const BackendLoadingScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl border border-neutral-200 shadow-lg">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-neutral-800">
              plainfigures
            </h1>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-neutral-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-neutral-600">
                Connecting to backend services...
              </p>
              <p className="text-sm text-neutral-500">
                This may take a moment on first startup
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Error screen component
  const BackendErrorScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Backend Unavailable</h2>
        <p className="text-neutral-600">
          Unable to connect to backend services at localhost:8000
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    </div>
  );

  // Show loading or error states
  if (isCheckingBackend) {
    return (
      <div className="min-h-screen bg-neutral-50 flex">
        <BackendLoadingScreen />
      </div>
    );
  }

  if (!isBackendReady) {
    return (
      <div className="min-h-screen bg-neutral-50 flex">
        <BackendErrorScreen />
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-neutral-800">
                  plainfigures
                </h1>
                <p className="text-sm text-neutral-500">
                  Manage your business finances with AI assistance
                </p>
              </div>
            </div>
            <div className="text-sm text-neutral-500">
              Backend: <span className="text-green-600 font-medium">Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Record Transactions
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Invoice
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Generate A Invoice
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashflowSummary key={refreshTrigger} />
              <TransactionList key={refreshTrigger} />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <TransactionForm
                  customers={customers}
                  suppliers={suppliers}
                  onTransactionCreated={handleTransactionCreated}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionList key={refreshTrigger} />
              </div>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileUpload onDataExtracted={handleDataExtracted} />
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Supported Formats</h3>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Images: JPG, PNG</li>
                      <li>• Documents: PDF</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">What We Extract</h3>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Vendor/supplier information</li>
                      <li>• Invoice dates and amounts</li>
                      <li>• Line items and descriptions</li>
                      <li>• Tax amounts and totals</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Processing</h3>
                    <p className="text-sm text-neutral-600">
                      Files are processed using OCR and AI to extract structured data.
                      You can review and edit the extracted information before saving.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">
                  Invoice creation and management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
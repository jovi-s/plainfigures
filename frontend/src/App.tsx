import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CashflowSummary } from "@/components/CashflowSummary";
import { FileUpload } from "@/components/FileUpload";
// import { AIRecommendations } from "@/components/AIRecommendations";
// import { UserProfile } from "@/components/UserProfile";
import { OpenAIRecommendations } from "@/components/OpenAIRecommendations";
import { RecordTransactions } from "@/components/RecordTransactions";
import { TransactionList } from "@/components/TransactionList";
import { GenerateInvoice } from "@/components/GenerateInvoice";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinanceApiClient } from "@/api/client";
import { Customer, Supplier, InvoiceData } from "@/api/types";
import { Building2, TrendingUp, Upload, FileText, RefreshCw } from "lucide-react";

export default function App() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // AI Recommendations caching
  const [cachedRecommendations, setCachedRecommendations] = useState<any[]>([]);
  const [recommendationsCacheTime, setRecommendationsCacheTime] = useState<number>(0);

  // Cache management functions
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  


  const setCachedRecommendationsData = (recommendations: any[]) => {
    try {
      const now = Date.now();
      localStorage.setItem('aiRecommendations', JSON.stringify(recommendations));
      localStorage.setItem('aiRecommendationsTimestamp', now.toString());
      setCachedRecommendations(recommendations);
      setRecommendationsCacheTime(now);
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  };

  const clearRecommendationsCache = () => {
    try {
      localStorage.removeItem('aiRecommendations');
      localStorage.removeItem('aiRecommendationsTimestamp');
      setCachedRecommendations([]);
      setRecommendationsCacheTime(0);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const refreshRecommendations = () => {
    clearRecommendationsCache();
    // This will trigger a fresh fetch in the SimpleAIRecommendations component
    setRefreshTrigger(prev => prev + 1);
  };

  // Load cached recommendations on app initialization
  useEffect(() => {
    // Clear any existing cache on app start to prevent stale generic recommendations
    clearRecommendationsCache();
    // Note: Recommendations will be fetched fresh when the component mounts
  }, []);

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
              {t('header.title')}
            </h1>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-neutral-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-neutral-600">
                {t('loading.connecting')}
              </p>
              <p className="text-sm text-neutral-500">
                {t('loading.first_startup')}
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
        <h2 className="text-2xl font-bold text-red-600">{t('error.backend_unavailable')}</h2>
        <p className="text-neutral-600">
          {t('error.unable_connect')}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('button.retry_connection')}
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
                  {t('header.title')}
                </h1>
                <p className="text-sm text-neutral-500">
                  {t('header.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguagePicker />
              <div className="text-sm text-neutral-500">
                {t('header.backend_status')}: <span className="text-green-600 font-medium">{t('header.connected')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
            <strong>Note:</strong> {t('note.currency')}
          </div>
        </div>
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('nav.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('nav.transactions')}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('nav.upload')}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('nav.invoices')}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">

            
            {/* User Profile - DISABLED - causing crashes */}
            {/* <div className="mb-6">
              <UserProfile userId="1" />
            </div> */}
            
            {/* Simple AI Recommendations - NEW: GPT-4o powered with caching */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('dashboard.ai_recommendations')}</h2>
                <div className="flex items-center gap-3">
                  {cachedRecommendations.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span>{t('dashboard.cache')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        Date.now() - recommendationsCacheTime < CACHE_DURATION 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {Math.round((Date.now() - recommendationsCacheTime) / 60000)}{t('dashboard.minutes_ago')}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshRecommendations}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {t('dashboard.refresh')}
                  </Button>
                </div>
              </div>
              <OpenAIRecommendations 
                cachedRecommendations={cachedRecommendations}
                onRecommendationsReceived={setCachedRecommendationsData}
                isCacheValid={Date.now() - recommendationsCacheTime < CACHE_DURATION}
                refreshTrigger={refreshTrigger}
              />
            </div>
            
            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashflowSummary key={`cashflow-${refreshTrigger}`} />
              <TransactionList key={`dashboard-transactions-${refreshTrigger}`} />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <RecordTransactions
              customers={customers}
              suppliers={suppliers}
              onTransactionCreated={handleTransactionCreated}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileUpload onDataExtracted={handleDataExtracted} />
              <Card>
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
                    <strong>Note:</strong> {t('note.image_uploads')}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{t('upload.instructions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{t('upload.supported_formats')}</h3>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• {t('upload.formats.images')}</li>
                      <li>• {t('upload.formats.documents')}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{t('upload.what_extract')}</h3>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• {t('upload.extract.vendor')}</li>
                      <li>• {t('upload.extract.dates')}</li>
                      <li>• {t('upload.extract.items')}</li>
                      <li>• {t('upload.extract.tax')}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{t('upload.processing')}</h3>
                    <p className="text-sm text-neutral-600">
                      {t('upload.processing_desc')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <GenerateInvoice customers={customers} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
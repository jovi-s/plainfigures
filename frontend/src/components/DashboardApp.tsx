import { useState, useEffect } from "react";
import { CashflowSummary } from "@/components/CashflowSummary";
import { UserProfile } from "@/components/UserProfile";
import { OpenAIRecommendations } from "@/components/OpenAIRecommendations";
import { MarketResearch } from "@/components/MarketResearch";
import { AICharts } from "@/components/AICharts";
import { EnhancedRecommendations } from "@/components/EnhancedRecommendations";
import { RecordTransactions } from "@/components/RecordTransactions";
import { TransactionList } from "@/components/TransactionList";
import { GenerateInvoice } from "@/components/GenerateInvoice";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FinanceApiClient } from "@/api/client";
import { Customer, InvoiceData } from "@/api/types";
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  RefreshCw, 
  LogOut, 
  User,
  Settings
} from "lucide-react";

interface User {
  id: string;
  email: string;
  company_name: string;
  owner_name: string;
  industry: string;
  country: string;
  hasCompletedOnboarding: boolean;
}

interface DashboardAppProps {
  user: User | null;
  onLogout: () => void;
}

export function DashboardApp({ user, onLogout }: DashboardAppProps) {
  // Simple fallback function for text
  const getText = (_key: string, fallback: string) => fallback;
  
  // Add error boundary and debugging
  console.log('DashboardApp rendering with user:', user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // AI Recommendations caching
  const [cachedRecommendations, setCachedRecommendations] = useState<any[]>([]);
  const [recommendationsCacheTime, setRecommendationsCacheTime] = useState<number>(0);

  // Market Research caching
  const [cachedMarketResearch, setCachedMarketResearch] = useState<string>('');
  const [marketResearchCacheTime, setMarketResearchCacheTime] = useState<number>(0);
  const [enhancedRecommendations, setEnhancedRecommendations] = useState<any>(null);
  const [showEnhancedRecommendations, setShowEnhancedRecommendations] = useState<boolean>(false);

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

  const setCachedMarketResearchData = (research: string) => {
    try {
      const now = Date.now();
      localStorage.setItem('marketResearch', research);
      localStorage.setItem('marketResearchTimestamp', now.toString());
      setCachedMarketResearch(research);
      setMarketResearchCacheTime(now);
    } catch (error) {
      console.error('Error caching market research:', error);
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

  const clearMarketResearchCache = () => {
    try {
      localStorage.removeItem('marketResearch');
      localStorage.removeItem('marketResearchTimestamp');
      setCachedMarketResearch('');
      setMarketResearchCacheTime(0);
    } catch (error) {
      console.error('Error clearing market research cache:', error);
    }
  };

  // Handle integration of market research with AI recommendations
  const handleIntegrateWithRecommendations = async (marketData: string) => {
    try {
      console.log('Integrating market research with AI recommendations...');
      const response = await FinanceApiClient.getEnhancedRecommendations(marketData);
      
      if (response.success && response.data) {
        setEnhancedRecommendations(response.data);
        setShowEnhancedRecommendations(true);
        
        // Scroll to enhanced recommendations section
        setTimeout(() => {
          const element = document.getElementById('enhanced-recommendations');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        console.error('Failed to generate enhanced recommendations:', response.error);
      }
    } catch (error) {
      console.error('Error integrating recommendations:', error);
    }
  };

  const refreshRecommendations = () => {
    clearRecommendationsCache();
    setRefreshTrigger(prev => prev + 1);
  };

  const refreshMarketResearch = () => {
    clearMarketResearchCache();
    setRefreshTrigger(prev => prev + 1);
  };

  // Load cached data on app initialization
  useEffect(() => {
    try {
      // Load cached recommendations
      const cachedRecs = localStorage.getItem('aiRecommendations');
      const recsTimestamp = localStorage.getItem('aiRecommendationsTimestamp');
      
      if (cachedRecs && recsTimestamp) {
        const timestamp = parseInt(recsTimestamp);
        const isRecsValid = Date.now() - timestamp < CACHE_DURATION;
        
        if (isRecsValid) {
          const recommendations = JSON.parse(cachedRecs);
          setCachedRecommendations(recommendations);
          setRecommendationsCacheTime(timestamp);
          console.log('Loaded cached recommendations from localStorage');
        } else {
          localStorage.removeItem('aiRecommendations');
          localStorage.removeItem('aiRecommendationsTimestamp');
        }
      }
      
      // Load cached market research
      const cachedResearch = localStorage.getItem('marketResearch');
      const researchTimestamp = localStorage.getItem('marketResearchTimestamp');
      
      if (cachedResearch && researchTimestamp) {
        const timestamp = parseInt(researchTimestamp);
        const isResearchValid = Date.now() - timestamp < CACHE_DURATION;
        
        if (isResearchValid) {
          setCachedMarketResearch(cachedResearch);
          setMarketResearchCacheTime(timestamp);
          console.log('Loaded cached market research from localStorage');
        } else {
          localStorage.removeItem('marketResearch');
          localStorage.removeItem('marketResearchTimestamp');
        }
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      clearRecommendationsCache();
      clearMarketResearchCache();
    }
  }, []);

  // Load customers data
  const loadData = async () => {
    try {
      const customersResponse = await FinanceApiClient.getCustomers();

      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data);
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
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsCheckingBackend(true);
      const maxAttempts = 30;
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
              {getText('header.title', 'plainfigures')}
            </h1>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-neutral-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-neutral-600">
                {getText('loading.connecting', 'Connecting to backend...')}
              </p>
              <p className="text-sm text-neutral-500">
                {getText('loading.first_startup', 'This may take a moment on first startup')}
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
        <h2 className="text-2xl font-bold text-red-600">{getText('error.backend_unavailable', 'Backend Unavailable')}</h2>
        <p className="text-neutral-600">
          {getText('error.unable_connect', 'Unable to connect to the backend server')}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {getText('button.retry_connection', 'Retry Connection')}
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
                  {getText('header.title', 'plainfigures')}
                </h1>
                <p className="text-sm text-neutral-500">
                  {getText('header.subtitle', 'SME Finance Management')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguagePicker />
              
              {/* User info and logout */}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-neutral-900">
                      {user.owner_name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {user.company_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onLogout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-neutral-500">
                {getText('header.backend_status', 'Backend Status')}: <span className="text-green-600 font-medium">{getText('header.connected', 'Connected')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
            <strong>Note:</strong> {getText('note.currency', 'All amounts are automatically converted to SGD for analysis')}
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {getText('nav.dashboard', 'Dashboard')}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Add Data
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {getText('nav.invoices', 'Invoices')}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* User Profile */}
            {user && (
              <div className="mb-6">
                <UserProfile userId={user.id} userData={user} />
              </div>
            )}
            
            {/* Simple AI Recommendations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{getText('dashboard.ai_recommendations', 'AI Recommendations')}</h2>
                <div className="flex items-center gap-3">
                  {cachedRecommendations.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span>{getText('dashboard.cache', 'Cache')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        Date.now() - recommendationsCacheTime < CACHE_DURATION 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {Math.round((Date.now() - recommendationsCacheTime) / 60000)}{getText('dashboard.minutes_ago', ' minutes ago')}
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
                    {getText('dashboard.refresh', 'Refresh')}
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

            {/* AI Recommendation Charts */}
            <AICharts refreshTrigger={refreshTrigger} />

            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashflowSummary key={`cashflow-${refreshTrigger}`} />
              <TransactionList key={`dashboard-transactions-${refreshTrigger}`} />
            </div>

            {/* Market Research */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{getText('dashboard.market_research', 'Market Research')}</h2>
                <div className="flex items-center gap-3">
                  {cachedMarketResearch && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span>{getText('dashboard.cache', 'Cache')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        Date.now() - marketResearchCacheTime < CACHE_DURATION 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {Math.round((Date.now() - marketResearchCacheTime) / 60000)}{getText('dashboard.minutes_ago', ' minutes ago')}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshMarketResearch}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {getText('dashboard.refresh', 'Refresh')}
                  </Button>
                </div>
              </div>
              <MarketResearch 
                cachedMarketResearch={cachedMarketResearch}
                onMarketResearchReceived={setCachedMarketResearchData}
                isCacheValid={Date.now() - marketResearchCacheTime < CACHE_DURATION}
                refreshTrigger={refreshTrigger}
                onIntegrateWithRecommendations={handleIntegrateWithRecommendations}
              />

              {/* Enhanced Recommendations */}
              {showEnhancedRecommendations && enhancedRecommendations && (
                <div className="mt-6">
                  <EnhancedRecommendations 
                    data={enhancedRecommendations}
                    onClose={() => setShowEnhancedRecommendations(false)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Add Data Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <RecordTransactions
              onTransactionCreated={handleTransactionCreated}
              onDataExtracted={handleDataExtracted}
              refreshTrigger={refreshTrigger}
            />
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

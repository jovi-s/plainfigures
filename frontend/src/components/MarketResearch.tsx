import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FinanceApiClient } from '@/api/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Search, 
  TrendingUp, 
  MapPin, 
  Users, 
  DollarSign, 
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Building2,
  Zap,
  Globe,
  Lightbulb,
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MarketResearchProps {
  cachedMarketResearch?: string;
  onMarketResearchReceived?: (research: string) => void;
  isCacheValid?: boolean;
  refreshTrigger?: number;
  onIntegrateWithRecommendations?: (marketData: string) => void;
}

export function MarketResearch({ 
  cachedMarketResearch = '', 
  onMarketResearchReceived, 
  isCacheValid = false,
  refreshTrigger = 0,
  onIntegrateWithRecommendations
}: MarketResearchProps) {
  const [marketResearch, setMarketResearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedSections, setParsedSections] = useState<any[]>([]);
  const [isIntegrating, setIsIntegrating] = useState(false);

  // Parse market research content into structured sections
  const parseMarketResearch = (content: string) => {
    if (!content) return [];

    const sections = [];
    const lines = content.split('\n').filter(line => line.trim());
    let currentSection = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for numbered sections (1., 2., etc.)
      const sectionMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: sectionMatch[1],
          title: sectionMatch[2],
          content: [] as string[],
          icon: getSectionIcon(sectionMatch[2])
        };
      }
      // Check for subsections with bullets or dashes
      else if (trimmedLine.match(/^[-•*]\s+/) || trimmedLine.match(/^\w+:/)) {
        if (currentSection) {
          currentSection.content.push(trimmedLine.replace(/^[-•*]\s+/, ''));
        }
      }
      // Regular content
      else if (trimmedLine && currentSection) {
        currentSection.content.push(trimmedLine);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const getSectionIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('economic') || titleLower.includes('trend')) return TrendingUp;
    if (titleLower.includes('market size') || titleLower.includes('growth')) return BarChart3;
    if (titleLower.includes('competitive') || titleLower.includes('competition')) return Target;
    if (titleLower.includes('customer') || titleLower.includes('demand')) return Users;
    if (titleLower.includes('pricing') || titleLower.includes('cost') || titleLower.includes('revenue')) return DollarSign;
    if (titleLower.includes('investment') || titleLower.includes('funding')) return Building2;
    if (titleLower.includes('regulatory') || titleLower.includes('policy')) return AlertCircle;
    if (titleLower.includes('supply') || titleLower.includes('operational')) return Zap;
    if (titleLower.includes('technology') || titleLower.includes('digital')) return Globe;
    if (titleLower.includes('partnership') || titleLower.includes('opportunity')) return CheckCircle;
    return Lightbulb;
  };

  useEffect(() => {
    const loadMarketResearch = async () => {
      try {
        // If we have valid cached research, use it
        if (isCacheValid && cachedMarketResearch) {
          setMarketResearch(cachedMarketResearch);
          setParsedSections(parseMarketResearch(cachedMarketResearch));
          setIsLoading(false);
          return;
        }

        // DISABLED: Auto-loading market research on startup
        // This was causing slow app startup times
        setIsLoading(false);
        return;

        // setIsLoading(true);
        // setError(null)
        
        // const response = await FinanceApiClient.getMarketResearch();
        
        // if (response.success && response.data) {
        //   const researchContent = response.data;
        //   setMarketResearch(researchContent);
        //   setParsedSections(parseMarketResearch(researchContent));
          
        //   if (onMarketResearchReceived) {
        //     onMarketResearchReceived(researchContent);
        //   }
        // } else {
        //   setError(response.error || 'Failed to load market research');
        // }
      } catch (err) {
        setError('Failed to load market research');
        console.error('Market research error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketResearch();
  }, [cachedMarketResearch, isCacheValid, onMarketResearchReceived, refreshTrigger]);

  // Handle integration with AI recommendations
  const handleIntegrateWithRecommendations = async () => {
    if (!marketResearch.trim() || !onIntegrateWithRecommendations) return;
    
    setIsIntegrating(true);
    try {
      await onIntegrateWithRecommendations(marketResearch);
    } catch (error) {
      console.error('Integration failed:', error);
    } finally {
      setIsIntegrating(false);
    }
  };

  // Manual load function for when user wants to trigger research
  const handleManualLoad = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting market research request...');
      const response = await FinanceApiClient.getMarketResearch();
      console.log('Market research response:', response);
      
      if (response.success && response.data) {
        const researchContent = response.data;
        console.log('Market research content received:', researchContent?.length + ' characters');
        setMarketResearch(researchContent);
        setParsedSections(parseMarketResearch(researchContent));
        
        if (onMarketResearchReceived) {
          onMarketResearchReceived(researchContent);
        }
      } else {
        console.error('Market research failed:', response.error);
        setError(response.error || 'Failed to load market research');
      }
    } catch (err) {
      console.error('Market research error:', err);
      setError('Failed to load market research');
    } finally {
      setIsLoading(false);
    }
  };

  // Show a simple card with load button when no research is loaded
  if (!marketResearch && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Market Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Research Available</h3>
            <p className="text-gray-600 mb-6">
              Get comprehensive market insights for your business. This feature uses AI to research current market conditions, trends, and opportunities.
            </p>
            <Button onClick={handleManualLoad} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Load Market Research
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Search className="h-5 w-5" />
            Market Research Analysis
          </CardTitle>
          <p className="text-sm text-emerald-700">
            Powered by LangGraph & Gemini • Analyzing market opportunities...
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-emerald-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-2 bg-emerald-100 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-emerald-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-emerald-100 rounded w-4/5 mb-1"></div>
                <div className="h-3 bg-emerald-100 rounded w-3/5"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 bg-red-50 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            Market Research Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-red-700 text-sm">{error}</p>
            <p className="text-red-600 text-xs">
              Make sure your backend is running and the Gemini API key is configured
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketResearch) {
    return (
      <Card className="mb-6 bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Search className="h-5 w-5" />
            Market Research Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">No market research data available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg">
            <Search className="h-5 w-5" />
            Sunrise Trading Co.
          </CardTitle>
          <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-700">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Singapore • Import/Export
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Electronics Hardware • Growth Stage
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              25 Employees • $850K Revenue
            </span>
          </div>
          <p className="text-xs text-emerald-600">
            Powered by LangGraph & Gemini • Real-time market intelligence
          </p>
        </CardHeader>
      </Card>

      {/* Research Sections */}
      {parsedSections.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {parsedSections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id || index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                    <IconComponent className="h-4 w-4 text-emerald-600" />
                    <span className="flex-1">{section.title}</span>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {section.id}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {section.content.map((item: string, itemIndex: number) => {
                      // Check if it's a key-value pair (like "Market Size: $X billion")
                      const keyValueMatch = item.match(/^([^:]+):\s*(.+)$/);
                      if (keyValueMatch) {
                        return (
                          <div key={itemIndex} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-900 text-sm mb-1">
                              {keyValueMatch[1]}
                            </div>
                            <div className="text-gray-700 text-sm">
                              {keyValueMatch[2]}
                            </div>
                          </div>
                        );
                      }
                      
                      // Regular content
                      return (
                        <p key={itemIndex} className="text-gray-700 text-sm leading-relaxed">
                          {item}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          }          )}
        </div>
      ) : (
        // Fallback: display raw content if parsing fails
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-5 w-5" />
              Research Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="text-gray-700 text-sm leading-relaxed"
                components={{
                  h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-3">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-semibold text-gray-800 mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-medium text-gray-700 mb-2">{children}</h3>,
                  p: ({children}) => <p className="mb-2 text-gray-700">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({children}) => <li className="text-gray-700">{children}</li>,
                  strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                  code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  pre: ({children}) => <pre className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                  blockquote: ({children}) => <blockquote className="border-l-4 border-emerald-200 pl-3 py-1 bg-emerald-50 mb-2">{children}</blockquote>,
                  table: ({children}) => <div className="overflow-x-auto mb-2"><table className="min-w-full border border-gray-200">{children}</table></div>,
                  thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
                  th: ({children}) => <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>,
                  td: ({children}) => <td className="border border-gray-200 px-3 py-2 text-sm text-gray-700">{children}</td>,
                }}
              >
                {marketResearch}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Button */}
      {marketResearch && onIntegrateWithRecommendations && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 text-sm">
                    Integrate Market Intelligence
                  </h3>
                  <p className="text-purple-700 text-xs mt-1">
                    Combine market research with AI recommendations for enhanced strategic insights
                  </p>
                </div>
              </div>
              <Button
                onClick={handleIntegrateWithRecommendations}
                disabled={isIntegrating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm"
              >
                {isIntegrating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Integrating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Enhanced Recommendations
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

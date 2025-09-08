import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FinanceApiClient } from '@/api/client';
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
  Lightbulb
} from 'lucide-react';

interface MarketResearchProps {
  cachedMarketResearch?: string;
  onMarketResearchReceived?: (research: string) => void;
  isCacheValid?: boolean;
  refreshTrigger?: number;
}

export function MarketResearch({ 
  cachedMarketResearch = '', 
  onMarketResearchReceived, 
  isCacheValid = false,
  refreshTrigger = 0 
}: MarketResearchProps) {
  const [marketResearch, setMarketResearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedSections, setParsedSections] = useState<any[]>([]);

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

        setIsLoading(true);
        setError(null);
        
        const response = await FinanceApiClient.getMarketResearch();
        
        if (response.success && response.data) {
          const researchContent = response.data;
          setMarketResearch(researchContent);
          setParsedSections(parseMarketResearch(researchContent));
          
          if (onMarketResearchReceived) {
            onMarketResearchReceived(researchContent);
          }
        } else {
          setError(response.error || 'Failed to load market research');
        }
      } catch (err) {
        setError('Failed to load market research');
        console.error('Market research error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketResearch();
  }, [cachedMarketResearch, isCacheValid, onMarketResearchReceived, refreshTrigger]);

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Search className="h-5 w-5" />
            Market Research Analysis
          </CardTitle>
          <p className="text-sm text-emerald-700">
            Powered by LangGraph & Gemini 2.0 Flash • Analyzing market opportunities...
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
            Market Research Analysis
          </CardTitle>
          <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-700">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Singapore • Beauty & Personal Care
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Hair Salon • Growth Stage
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              65 Employees • $500K Revenue
            </span>
          </div>
          <p className="text-xs text-emerald-600">
            Powered by LangGraph & Gemini 2.0 Flash • Real-time market intelligence
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
          })}
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
              <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed font-sans">
                {marketResearch}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

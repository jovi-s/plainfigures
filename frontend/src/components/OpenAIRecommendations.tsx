import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FinanceApiClient } from '@/api/client';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action_items: string[];
  data_reasoning?: string;
  is_fallback?: boolean;
}

interface OpenAIRecommendationsProps {
  cachedRecommendations?: Recommendation[];
  onRecommendationsReceived?: (recommendations: Recommendation[]) => void;
  isCacheValid?: boolean;
  refreshTrigger?: number;
}

export function OpenAIRecommendations({ 
  cachedRecommendations = [], 
  onRecommendationsReceived, 
  isCacheValid = false,
  refreshTrigger = 0 
}: OpenAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        // If we have valid cached recommendations, use them
        if (isCacheValid && cachedRecommendations.length > 0) {
          setRecommendations(cachedRecommendations);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        
        const response = await FinanceApiClient.getOpenAIRecommendations();
        
        if (response.success && response.data && response.data.recommendations) {
          const newRecommendations = response.data.recommendations;
          setRecommendations(newRecommendations);
          
          // Only cache if recommendations are data-driven (not generic fallback)
          const hasDataReasoning = newRecommendations.some(rec => rec.data_reasoning);
          const hasFallbackFlag = newRecommendations.some(rec => rec.is_fallback);
          const hasFinancialData = newRecommendations.some(rec => 
            rec.description.includes('$') || rec.title.includes('Current')
          );
          
          const isDataDriven = hasDataReasoning || (hasFinancialData && !hasFallbackFlag);
          
          if (onRecommendationsReceived && isDataDriven) {
            onRecommendationsReceived(newRecommendations);
            console.log('Cached data-driven recommendations');
          } else {
            console.warn('Received generic/fallback recommendations, not caching', {
              hasDataReasoning,
              hasFallbackFlag,
              hasFinancialData
            });
          }
        } else {
          setError(response.error || 'Failed to load recommendations');
        }
      } catch (err) {
        setError('Failed to load AI recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [cachedRecommendations, isCacheValid, onRecommendationsReceived, refreshTrigger]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800'; 
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-purple-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-purple-100 rounded w-1/2"></div>
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
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm">{error}</p>
          <p className="text-red-600 text-xs mt-1">
            Make sure your OpenAI API key is configured in the .env file
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return (
      <Card className="mb-6 bg-gray-50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">No recommendations available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
          <Lightbulb className="h-4 w-4" />
          AI Financial Recommendations
        </CardTitle>
        <p className="text-xs text-purple-700">
          Powered by GPT-4o • {recommendations.some(rec => rec.is_fallback) 
            ? 'Generic recommendations (API issue)' 
            : 'Based on your current financial data'}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 flex-1">
                  {getPriorityIcon(rec.priority)}
                  <h4 className="font-medium text-gray-900 text-sm truncate">{rec.title}</h4>
                </div>
                <Badge className={`${getPriorityColor(rec.priority)} text-xs px-1.5 py-0.5`}>
                  {rec.priority}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-700 mb-2 line-clamp-2">{rec.description}</p>
              
              {rec.data_reasoning && (
                <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                  <span className="font-medium text-blue-800">Data Analysis: </span>
                  <span className="text-blue-700">{rec.data_reasoning}</span>
                </div>
              )}
              
              {rec.action_items && rec.action_items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Actions:</p>
                  <ul className="space-y-0.5">
                    {rec.action_items.slice(0, 2).map((item, itemIndex) => (
                      <li key={itemIndex} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5 text-xs">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                    {rec.action_items.length > 2 && (
                      <li className="text-xs text-gray-500 italic">+{rec.action_items.length - 2} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

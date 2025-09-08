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

interface Visualizations {
  charts: {
    priority_breakdown?: string;
    financial_health_gauge?: string;
    impact_projections?: string;
    action_timeline?: string;
  };
  insights: {
    summary?: any;
    key_metrics?: any;
    projections?: any;
  };
  error?: string;
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
  const [visualizations, setVisualizations] = useState<Visualizations | null>(null);
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
          const newVisualizations = response.data.visualizations;
          
          setRecommendations(newRecommendations);
          setVisualizations(newVisualizations);
          
          // Only cache if recommendations are data-driven (not generic fallback)
          const hasDataReasoning = newRecommendations.some((rec: Recommendation) => rec.data_reasoning);
          const hasFallbackFlag = newRecommendations.some((rec: Recommendation) => rec.is_fallback);
          const hasFinancialData = newRecommendations.some((rec: Recommendation) => 
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
            <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-purple-100 min-h-[280px] flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 flex-1">
                  {getPriorityIcon(rec.priority)}
                  <h4 className="font-medium text-gray-900 text-sm truncate">{rec.title}</h4>
                </div>
                <Badge className={`${getPriorityColor(rec.priority)} text-xs px-1.5 py-0.5`}>
                  {rec.priority}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-700 mb-2 line-clamp-3">{rec.description}</p>
              
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
                    {rec.action_items.slice(0, 4).map((item, itemIndex) => (
                      <li key={itemIndex} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-purple-500 mt-0.5 text-xs">•</span>
                        <span className="line-clamp-2">{item}</span>
                      </li>
                    ))}
                    {rec.action_items.length > 4 && (
                      <li className="text-xs text-gray-500 italic">+{rec.action_items.length - 4} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* AI Recommendation Visualizations */}
        {visualizations && visualizations.charts && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium text-purple-900 mb-3">📊 Visual Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Priority Breakdown */}
              {visualizations.charts.priority_breakdown && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Priority & Action Distribution</h4>
                  <img 
                    src={`data:image/png;base64,${visualizations.charts.priority_breakdown}`}
                    alt="Priority Breakdown Chart"
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              
              {/* Financial Health Gauges */}
              {visualizations.charts.financial_health_gauge && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Financial Health Dashboard</h4>
                  <img 
                    src={`data:image/png;base64,${visualizations.charts.financial_health_gauge}`}
                    alt="Financial Health Gauges"
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              
              {/* Impact Projections */}
              {visualizations.charts.impact_projections && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Projected Impact Analysis</h4>
                  <img 
                    src={`data:image/png;base64,${visualizations.charts.impact_projections}`}
                    alt="Impact Projections"
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              
              {/* Action Timeline */}
              {visualizations.charts.action_timeline && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Implementation Timeline</h4>
                  <img 
                    src={`data:image/png;base64,${visualizations.charts.action_timeline}`}
                    alt="Action Timeline"
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
            
            {/* Key Insights */}
            {visualizations.insights && visualizations.insights.summary && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100 mt-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">💡 Key Insights</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {visualizations.insights.summary.total_recommendations || 0}
                    </div>
                    <div className="text-gray-600">Recommendations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {visualizations.insights.summary.total_action_items || 0}
                    </div>
                    <div className="text-gray-600">Action Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {visualizations.insights.key_metrics?.expense_ratio?.toFixed(1) || 0}%
                    </div>
                    <div className="text-gray-600">Expense Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {visualizations.insights.summary.financial_health || 'N/A'}
                    </div>
                    <div className="text-gray-600">Health Status</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

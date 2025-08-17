import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinanceApiClient } from '@/api/client';
import { Lightbulb, RefreshCw, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';

interface Recommendation {
  type: 'AP_REDUCTION' | 'AR_INCREASE' | 'CASHFLOW_PROJECTION';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface AIRecommendationsProps {
  userId?: string;
}

export function AIRecommendations({ userId = "1" }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call our new AI recommendations endpoint
      const response = await FinanceApiClient.getAIRecommendations(userId);
      
      if (response.success && response.data) {
        setRecommendations(response.data.recommendations);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate recommendations on component mount
    generateRecommendations();
  }, [userId]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Target className="h-4 w-4 text-orange-500" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Lightbulb className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AP_REDUCTION': return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'AR_INCREASE': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'CASHFLOW_PROJECTION': return <Target className="h-4 w-4 text-purple-600" />;
      default: return <Lightbulb className="h-4 w-4 text-neutral-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Financial Recommendations</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecommendations}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-neutral-500">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-neutral-600">
                Analyzing your financial data and researching recommendations...
              </p>
            </div>
          </div>
        )}

        {!isLoading && recommendations.length === 0 && !error && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">
              Click "Refresh" to generate AI-powered financial recommendations
            </p>
          </div>
        )}

        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-gradient-to-r from-neutral-50 to-neutral-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-neutral-900">
                        {rec.title}
                      </h3>
                      {getPriorityIcon(rec.priority)}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">
                      {rec.description}
                    </p>
                    {rec.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-neutral-700 mb-1">
                          Action Items:
                        </h4>
                        <ul className="text-xs text-neutral-600 space-y-1">
                          {rec.actionItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

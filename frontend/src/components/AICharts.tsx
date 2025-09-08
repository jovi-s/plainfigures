import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceApiClient } from '@/api/client';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Globe, 
  RefreshCw, 
  AlertCircle,
  Brain,
  Target,
  Activity,
  DollarSign
} from 'lucide-react';

interface ChartData {
  charts: {
    cashflow_trend: string;
    category_breakdown: string;
    currency_analysis: string;
  };
  insights: {
    summary_stats: {
      total_transactions: number;
      date_range: { start: string; end: string };
      total_income_sgd: number;
      total_expenses_sgd: number;
      net_cashflow_sgd: number;
    };
    forecasting: {
      next_30_days_trend: string;
      model_accuracy: number;
      predicted_end_value: number;
      confidence: string;
    };
    patterns: {
      most_expensive_category: string;
      most_profitable_category: string;
      dominant_currency: string;
      average_transaction_size: number;
    };
    recommendations: Array<{
      type: string;
      message: string;
      priority: string;
    }>;
  };
  metadata: {
    generated_at: string;
    chart_count: number;
    data_points: number;
  };
}

interface AIChartsProps {
  refreshTrigger?: number;
}

export function AICharts({ refreshTrigger = 0 }: AIChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await FinanceApiClient.getAICharts();
      if (response.success && response.data) {
        setChartData(response.data);
      } else {
        setError(response.error || 'Failed to load charts');
      }
    } catch (err) {
      setError('Failed to load AI charts and forecasts');
      console.error('Error loading charts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, [refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <Activity className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Brain className="h-5 w-5" />
            AI Charts & Forecasting
          </CardTitle>
          <p className="text-xs text-indigo-700">
            Powered by scikit-learn • Real-time data analysis & predictions
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-indigo-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-indigo-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
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
            AI Charts & Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm">{error}</p>
          <Button onClick={loadCharts} variant="outline" className="mt-3">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Summary */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="h-5 w-5" />
                AI Financial Intelligence
              </CardTitle>
              <p className="text-xs text-indigo-700">
                Powered by scikit-learn • Real-time analysis of {chartData.metadata.data_points} transactions
              </p>
            </div>
            <Button onClick={loadCharts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Net Cashflow</span>
              </div>
              <p className={`text-lg font-bold ${chartData.insights.summary_stats.net_cashflow_sgd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(chartData.insights.summary_stats.net_cashflow_sgd)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">30-Day Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(chartData.insights.forecasting.next_30_days_trend)}
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(chartData.insights.forecasting.predicted_end_value)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Model Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {(chartData.insights.forecasting.model_accuracy * 100).toFixed(1)}%
                </span>
                <Badge className={getConfidenceColor(chartData.insights.forecasting.confidence)}>
                  {chartData.insights.forecasting.confidence}
                </Badge>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Avg Transaction</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(chartData.insights.patterns.average_transaction_size)}
              </p>
            </div>
          </div>

          {/* AI Recommendations */}
          {chartData.insights.recommendations.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-600" />
                AI Insights
              </h4>
              <div className="space-y-2">
                {chartData.insights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <AlertCircle className={`h-4 w-4 mt-0.5 ${rec.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <span className="text-sm text-gray-700">{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Interactive Charts & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cashflow" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cashflow" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cashflow & Forecast
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Category Analysis
              </TabsTrigger>
              <TabsTrigger value="currencies" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Currency Breakdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cashflow" className="mt-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-2">
                  <img 
                    src={`data:image/png;base64,${chartData.charts.cashflow_trend}`}
                    alt="Cashflow Trend Analysis with 30-Day Forecast"
                    className="w-full h-auto rounded"
                  />
                </div>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <strong>Forecast Analysis:</strong> The model predicts your cashflow will {chartData.insights.forecasting.next_30_days_trend} over the next 30 days, 
                  reaching approximately {formatCurrency(chartData.insights.forecasting.predicted_end_value)}. 
                  Confidence level: {chartData.insights.forecasting.confidence} ({(chartData.insights.forecasting.model_accuracy * 100).toFixed(1)}% accuracy).
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-2">
                  <img 
                    src={`data:image/png;base64,${chartData.charts.category_breakdown}`}
                    alt="Category Breakdown Analysis"
                    className="w-full h-auto rounded"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-red-50 p-3 rounded">
                    <strong>Highest Expense Category:</strong> {chartData.insights.patterns.most_expensive_category}
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <strong>Top Revenue Source:</strong> {chartData.insights.patterns.most_profitable_category}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="currencies" className="mt-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-2">
                  <img 
                    src={`data:image/png;base64,${chartData.charts.currency_analysis}`}
                    alt="Multi-Currency Analysis"
                    className="w-full h-auto rounded"
                  />
                </div>
                <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                  <strong>Currency Insights:</strong> Your dominant currency is {chartData.insights.patterns.dominant_currency}. 
                  All values are automatically converted to SGD for consistent analysis and forecasting.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

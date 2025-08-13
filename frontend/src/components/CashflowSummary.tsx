import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceApiClient } from '@/api/client';
import { CashflowSummary as ICashflowSummary } from '@/api/types';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

export function CashflowSummary() {
  const [summary, setSummary] = useState<ICashflowSummary | null>(null);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await FinanceApiClient.getCashflowSummary(undefined, lookbackDays);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [lookbackDays]);

  const formatAmount = (amount: number) => {
    // For very large numbers in summary cards, use compact notation
    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SGD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getNetTrendIcon = (net: number) => {
    if (net > 0) return <TrendingUp className="h-6 w-6 text-green-600" />;
    if (net < 0) return <TrendingDown className="h-6 w-6 text-red-600" />;
    return <DollarSign className="h-6 w-6 text-neutral-600" />;
  };

  const getNetColor = (net: number) => {
    if (net > 0) return 'text-green-600';
    if (net < 0) return 'text-red-600';
    return 'text-neutral-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-500">Loading summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadSummary} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-neutral-500">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topCategories = Object.entries(summary.by_category)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cashflow Summary</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={lookbackDays.toString()} onValueChange={(value) => setLookbackDays(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadSummary} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Income</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(summary.totals.in)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(summary.totals.out)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">Net</p>
                <p className={`text-lg font-bold ${getNetColor(summary.totals.net)}`}>
                  {formatAmount(summary.totals.net)}
                </p>
              </div>
              <div className="flex-shrink-0">
                {getNetTrendIcon(summary.totals.net)}
              </div>
            </div>
          </div>
        </div>

        {/* Top expense categories */}
        {topCategories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Expense Categories</h3>
            <div className="space-y-2">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <span className="font-medium text-sm">{category}</span>
                  <span className="text-red-600 font-semibold">{formatAmount(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="text-center text-sm text-neutral-500 pt-4 border-t">
          <p>Based on {summary.rows_considered} transactions in the last {lookbackDays} days</p>
        </div>
      </CardContent>
    </Card>
  );
}

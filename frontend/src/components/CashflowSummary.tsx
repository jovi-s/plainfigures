import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinanceApiClient } from '@/api/client';
import { CashflowSummary as ICashflowSummary } from '@/api/types';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Info } from 'lucide-react';

export function CashflowSummary() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<ICashflowSummary | null>(null);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await FinanceApiClient.getCashflowSummary(undefined, lookbackDays);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cashflow.try_again'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [lookbackDays]);

  const formatAmount = (amount: number, currency: string = 'SGD') => {
    // For very large numbers in summary cards, use compact notation
    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderCurrencyBreakdown = (type: 'in' | 'out') => {
    if (!summary?.by_currency || !showCurrencyBreakdown) return null;
    
    const currencies = Object.entries(summary.by_currency)
      .filter(([, amounts]) => amounts[type] > 0)
      .sort(([,a], [,b]) => b[type] - a[type]);
    
    if (currencies.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {currencies.map(([currency, amounts]) => (
          <div key={currency} className="text-xs text-neutral-600 flex justify-between">
            <span>{currency}:</span>
            <span>{formatAmount(amounts[type], currency)}</span>
          </div>
        ))}
      </div>
    );
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
          <CardTitle>{t('cashflow.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-500">{t('cashflow.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('cashflow.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadSummary} variant="outline">
              {t('cashflow.try_again')}
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
          <CardTitle>{t('cashflow.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-neutral-500">
            <p>{t('cashflow.no_data')}</p>
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
        <div>
          <CardTitle>{t('cashflow.title')}</CardTitle>
          <p className="text-sm text-neutral-500 mt-1">{t('cashflow.amounts_converted')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowCurrencyBreakdown(!showCurrencyBreakdown)} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <Info className="h-3 w-3 mr-1" />
{showCurrencyBreakdown ? t('cashflow.hide_breakdown') : t('cashflow.show_breakdown')} {t('cashflow.breakdown')}
          </Button>
          <Select value={lookbackDays.toString()} onValueChange={(value) => setLookbackDays(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('cashflow.last_7_days')}</SelectItem>
              <SelectItem value="30">{t('cashflow.last_30_days')}</SelectItem>
              <SelectItem value="90">{t('cashflow.last_90_days')}</SelectItem>
              <SelectItem value="365">{t('cashflow.last_year')}</SelectItem>
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
                <p className="text-sm font-medium text-green-800">{t('cashflow.income')}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(summary.totals.in)}
                </p>
                {renderCurrencyBreakdown('in')}
              </div>
              <TrendingUp className="h-6 w-6 text-green-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">{t('cashflow.expenses')}</p>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(summary.totals.out)}
                </p>
                {renderCurrencyBreakdown('out')}
              </div>
              <TrendingDown className="h-6 w-6 text-red-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">{t('cashflow.net')}</p>
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
            <h3 className="text-lg font-semibold mb-3">{t('cashflow.top_categories')}</h3>
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
          <p>{t('cashflow.based_on_transactions', { count: summary.rows_considered, days: lookbackDays })}</p>
        </div>
      </CardContent>
    </Card>
  );
}

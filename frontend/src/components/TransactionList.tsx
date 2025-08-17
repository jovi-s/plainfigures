import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FinanceApiClient } from '@/api/client';
import { Transaction } from '@/api/types';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

export function TransactionList() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    console.log('TransactionList: Starting to load transactions...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await FinanceApiClient.getTransactions("1");
      console.log('TransactionList: API response:', response);
      console.log('TransactionList: Response success:', response.success);
      console.log('TransactionList: Response data:', response.data);
      console.log('TransactionList: Response error:', response.error);
      
      if (response.success && response.data) {
        console.log('TransactionList: Data is array:', Array.isArray(response.data));
        console.log('TransactionList: Data length:', response.data.length);
        
        // Sort by date descending (newest first)
        const parseDate = (dateString: string): Date => {
          // Handle dd-mm-yyyy format
          if (dateString.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            const [day, month, year] = dateString.split('-');
            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          }
          // Legacy support for M/D/YY format
          if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
            const [month, day, year] = dateString.split('/');
            const fullYear = `20${year}`;
            return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          }
          return new Date(dateString);
        };
        
        const sorted = response.data.sort((a, b) => {
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          console.log('Sorting dates:', a.date, '->', dateA, 'vs', b.date, '->', dateB);
          return dateB.getTime() - dateA.getTime();
        });
        console.log('TransactionList: Setting transactions:', sorted);
        setTransactions(sorted);
      } else {
        console.log('TransactionList: API response not successful or no data');
        console.log('TransactionList: Setting error message');
        setError(response.error || t('transactions.no_transactions'));
      }
    } catch (err) {
      console.error('TransactionList: Error loading transactions:', err);
      setError(err instanceof Error ? err.message : t('transactions.try_again'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Handle various date formats from CSV
    let date: Date;
    
    // Check if it's in dd-mm-yyyy format (like 11-08-2025)
    if (dateString.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      const [day, month, year] = dateString.split('-');
      date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      // Legacy support for M/D/YY format (like 11/8/25)
      const [month, day, year] = dateString.split('/');
      // Assume 20xx for 2-digit years
      const fullYear = `20${year}`;
      date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if parsing fails
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-500">{t('transactions.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadTransactions} variant="outline">
              {t('transactions.try_again')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('transactions.title')}</CardTitle>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center p-8 text-neutral-500">
            <p>{t('transactions.no_transactions')}</p>
            <p className="text-sm mt-2">{t('transactions.add_first')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.direction === 'IN' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.direction === 'IN' ? (
                        <ArrowUpCircle className="h-4 w-4" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {transaction.category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {t(`transactions.${transaction.direction.toLowerCase()}`)}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-neutral-500 mt-1">
                        {formatDate(transaction.date)} • {transaction.payment_method}
                      </div>
                      
                      {transaction.description && (
                        <div className="text-xs text-neutral-600 mt-1 truncate max-w-[200px]">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.direction === 'IN' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.direction === 'IN' ? '+' : '-'}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </div>
                    
                    {transaction.tax_amount && transaction.tax_amount > 0 && (
                      <div className="text-xs text-neutral-500">
                        {t('transactions.tax')}: {formatAmount(transaction.tax_amount, transaction.currency)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

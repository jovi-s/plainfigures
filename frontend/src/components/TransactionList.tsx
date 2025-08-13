import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FinanceApiClient } from '@/api/client';
import { Transaction } from '@/api/types';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    console.log('TransactionList: Starting to load transactions...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await FinanceApiClient.getTransactions();
      console.log('TransactionList: API response:', response);
      if (response.success && response.data) {
        // Sort by date descending (newest first)
        const sorted = response.data.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        console.log('TransactionList: Setting transactions:', sorted);
        setTransactions(sorted);
      } else {
        console.log('TransactionList: API response not successful or no data');
        setError('No transaction data received');
      }
    } catch (err) {
      console.error('TransactionList: Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-500">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadTransactions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center p-8 text-neutral-500">
            <p>No transactions found</p>
            <p className="text-sm mt-2">Add your first transaction to get started</p>
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
                          {transaction.direction}
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
                        Tax: {formatAmount(transaction.tax_amount, transaction.currency)}
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

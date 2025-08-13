import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceApiClient } from '@/api/client';
import { TransactionCreateRequest, Customer, Supplier } from '@/api/types';

interface TransactionFormProps {
  customers: Customer[];
  suppliers: Supplier[];
  onTransactionCreated: () => void;
}

export function TransactionForm({ customers, suppliers, onTransactionCreated }: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<TransactionCreateRequest>>({
    user_id: 'user_1', // Default user
    date: new Date().toISOString().split('T')[0],
    direction: 'OUT',
    currency: 'SGD',
    amount: 0,
    category: '',
    payment_method: 'Bank Transfer',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || formData.amount <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await FinanceApiClient.createTransaction(formData as TransactionCreateRequest);
      setFormData({
        ...formData,
        amount: 0,
        category: '',
        description: '',
        counterparty_id: '',
        document_reference: '',
        tax_amount: 0,
      });
      onTransactionCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof TransactionCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Direction</label>
              <Select 
                value={formData.direction} 
                onValueChange={(value) => updateFormData('direction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Income (IN)</SelectItem>
                  <SelectItem value="OUT">Expense (OUT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => updateFormData('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                  <SelectItem value="THB">THB - Thai Baht</SelectItem>
                  <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                  <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                  <SelectItem value="MMK">MMK - Myanmar Kyat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Revenue">Sales Revenue</SelectItem>
                  <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                  <SelectItem value="Professional Services">Professional Services</SelectItem>
                  <SelectItem value="Marketing Expenses">Marketing Expenses</SelectItem>
                  <SelectItem value="Equipment Purchase">Equipment Purchase</SelectItem>
                  <SelectItem value="Staff Salaries">Staff Salaries</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Office Rent">Office Rent</SelectItem>
                  <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Counterparty</label>
              <Select 
                value={formData.counterparty_id} 
                onValueChange={(value) => updateFormData('counterparty_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select counterparty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} (Customer)
                    </SelectItem>
                  ))}
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} (Supplier)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => updateFormData('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tax Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_amount || 0}
                onChange={(e) => updateFormData('tax_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Transaction description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Document Reference</label>
            <Input
              value={formData.document_reference || ''}
              onChange={(e) => updateFormData('document_reference', e.target.value)}
              placeholder="Invoice number, receipt ID, etc."
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

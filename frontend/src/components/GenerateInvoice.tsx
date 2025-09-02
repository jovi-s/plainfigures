import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, Plus, Trash2, Mic, MicOff, Send, FileText } from "lucide-react";
import { Customer } from "@/api/types";
import jsPDF from "jspdf";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface GenerateInvoiceProps {
  customers: Customer[];
}

export function GenerateInvoice({ customers }: GenerateInvoiceProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0.10; // 10% tax rate - could be configurable
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    setIssueDate(today.toISOString().split('T')[0]);
    setDueDate(twoWeeksLater.toISOString().split('T')[0]);
    
    // Generate invoice number
    const invoiceNum = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setInvoiceNumber(invoiceNum);
  }, []);

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Handle voice recording toggle
  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Stop recording logic will go here
      console.log("Stopping voice recording...");
    } else {
      // Start recording logic will go here
      console.log("Starting voice recording...");
    }
  };

  // Handle transcription submission
  const handleTranscriptionSubmit = () => {
    console.log("Submitting invoice transcription:", transcriptionText);
    // Backend processing logic will go here
    // For now, we'll just clear the transcription
    setTranscriptionText("");
  };

  const generatePDF = () => {
    if (!selectedCustomer || lineItems.some(item => !item.description || item.quantity <= 0)) {
      alert("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const selectedCustomerData = customers.find(c => c.customer_id === selectedCustomer);
      
      // Company Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE", 20, 30);
      
      // Company Info (you can customize this)
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text("Your Company Name", 20, 45);
      pdf.text("123 Business Street", 20, 55);
      pdf.text("City, State 12345", 20, 65);
      pdf.text("Phone: (555) 123-4567", 20, 75);
      pdf.text("Email: info@yourcompany.com", 20, 85);

      // Invoice Info
      pdf.setFont("helvetica", "bold");
      pdf.text("Invoice #:", 140, 45);
      pdf.setFont("helvetica", "normal");
      pdf.text(invoiceNumber, 170, 45);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Issue Date:", 140, 55);
      pdf.setFont("helvetica", "normal");
      pdf.text(issueDate, 170, 55);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Due Date:", 140, 65);
      pdf.setFont("helvetica", "normal");
      pdf.text(dueDate, 170, 65);

      // Customer Info
      pdf.setFont("helvetica", "bold");
      pdf.text("Bill To:", 20, 105);
      pdf.setFont("helvetica", "normal");
      if (selectedCustomerData) {
        pdf.text(selectedCustomerData.name, 20, 115);
        if (selectedCustomerData.address_line1) {
          pdf.text(selectedCustomerData.address_line1, 20, 125);
          if (selectedCustomerData.address_line2) {
            pdf.text(selectedCustomerData.address_line2, 20, 135);
          }
        }
        if (selectedCustomerData.email) {
          pdf.text(selectedCustomerData.email, 20, 135);
        }
      }

      // Line Items Table Header
      const tableStartY = 155;
      pdf.setFont("helvetica", "bold");
      pdf.text("Description", 20, tableStartY);
      pdf.text("Qty", 120, tableStartY);
      pdf.text("Unit Price", 140, tableStartY);
      pdf.text("Amount", 170, tableStartY);
      
      // Draw header line
      pdf.line(20, tableStartY + 3, 190, tableStartY + 3);

      // Line Items
      pdf.setFont("helvetica", "normal");
      let currentY = tableStartY + 15;
      
      lineItems.forEach((item) => {
        if (item.description) {
          pdf.text(item.description.substring(0, 40), 20, currentY);
          pdf.text(item.quantity.toString(), 120, currentY);
          pdf.text(`$${item.unit_price.toFixed(2)}`, 140, currentY);
          pdf.text(`$${item.amount.toFixed(2)}`, 170, currentY);
          currentY += 10;
        }
      });

      // Totals
      const totalsY = currentY + 10;
      pdf.line(120, totalsY - 5, 190, totalsY - 5);
      
      pdf.setFont("helvetica", "normal");
      pdf.text("Subtotal:", 140, totalsY);
      pdf.text(`$${subtotal.toFixed(2)}`, 170, totalsY);
      
      pdf.text("Tax (10%):", 140, totalsY + 10);
      pdf.text(`$${taxAmount.toFixed(2)}`, 170, totalsY + 10);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Total:", 140, totalsY + 20);
      pdf.text(`$${total.toFixed(2)}`, 170, totalsY + 20);

      // Notes
      if (notes) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Notes:", 20, totalsY + 40);
        pdf.setFont("helvetica", "normal");
        const splitNotes = pdf.splitTextToSize(notes, 170);
        pdf.text(splitNotes, 20, totalsY + 50);
      }

      // Download PDF
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Invoice Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 mb-4">
            Generate invoices using voice input. Speak your customer details, line items, and invoice information.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceToggle}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              <div>
                <p className="font-medium">
                  {isRecording ? "Recording..." : "Click to start recording"}
                </p>
                <p className="text-sm text-neutral-500">
                  {isRecording ? "Click again to stop" : "Speak your invoice details"}
                </p>
              </div>
            </div>

            {transcriptionText && (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <p className="text-sm text-neutral-700">{transcriptionText}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleTranscriptionSubmit}
                    disabled={!transcriptionText.trim()}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Process Voice Input
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Invoice Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manual Invoice Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Number</label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Issue Date</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button onClick={addLineItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Unit Price *</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <Input
                      value={`$${item.amount.toFixed(2)}`}
                      disabled
                      className="bg-neutral-50"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      onClick={() => removeLineItem(index)}
                      variant="outline"
                      size="sm"
                      disabled={lineItems.length === 1}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms..."
              rows={3}
            />
          </div>

          {/* Generate PDF Button */}
          <div className="flex justify-end">
            <Button
              onClick={generatePDF}
              disabled={isGenerating || !selectedCustomer}
              className="px-6"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

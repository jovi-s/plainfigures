import { useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Customer, Supplier } from "@/api/types";
import { Mic, MicOff, Send } from "lucide-react";

interface RecordTransactionsProps {
  customers: Customer[];
  suppliers: Supplier[];
  onTransactionCreated: () => void;
  refreshTrigger: number;
}

export function RecordTransactions({ 
  customers, 
  suppliers, 
  onTransactionCreated, 
  refreshTrigger 
}: RecordTransactionsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");

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
    console.log("Submitting transcription:", transcriptionText);
    // Backend processing logic will go here
    setTranscriptionText("");
  };

  return (
    <div className="space-y-6">
      {/* Simple test content */}
      <Card>
        <CardHeader>
          <CardTitle>Record Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 mb-4">
            This tab is working! You can record transactions using voice input or text input below.
          </p>
          
          {/* Voice Input Section */}
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
                  {isRecording ? "Click again to stop" : "Speak your transaction details"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTranscriptionSubmit}
                disabled={!transcriptionText.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Process Transaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Transaction Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            customers={customers}
            suppliers={suppliers}
            onTransactionCreated={onTransactionCreated}
          />
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList key={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}

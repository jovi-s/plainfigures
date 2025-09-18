'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import { Messages } from '@/components/Messages';
import { MultimodalInput } from '@/components/MultimodalInput';
import { FinanceApiClient } from '@/api/client';
import { generateUUID } from '@/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatProps {
  id: string;
  initialMessages?: ChatMessage[];
  isReadonly?: boolean;
  userContext?: any;
  className?: string;
}

export function Chat({
  id,
  initialMessages = [],
  isReadonly = false,
  userContext = {},
  className = "",
}: ChatProps) {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await FinanceApiClient.ragQuery(content, userContext);
      
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: response.data.answer || response.data.response || "I received your question but couldn't generate a response.",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Chat API error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to the server';
      setError(errorMessage);
      setShowErrorAlert(true);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const stop = () => {
    setIsLoading(false);
  };

  const regenerate = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        // Remove the last assistant message and regenerate
        setMessages(prev => {
          const lastAssistantIndex = prev.map(m => m.role).lastIndexOf('assistant');
          if (lastAssistantIndex !== -1) {
            return prev.slice(0, lastAssistantIndex);
          }
          return prev;
        });
        sendMessage(lastUserMessage.content);
      }
    }
  };

  return (
    <>
      <div className={`flex h-screen min-w-0 flex-col bg-background ${className}`}>
        {/* Header - Fixed height */}
        <div className="shrink-0">
          <ChatHeader
            chatId={id}
            isReadonly={isReadonly}
          />
        </div>

        {/* Messages area - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Messages
            chatId={id}
            messages={messages}
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            isLoading={isLoading}
            sendMessage={sendMessage}
          />
        </div>

        {/* Input area - Fixed height */}
        <div className="shrink-0 border-t border-gray-200 bg-background p-4">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              stop={stop}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
              onSubmit={handleSubmit}
            />
          )}
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      <AlertDialog
        open={showErrorAlert}
        onOpenChange={setShowErrorAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>
              {error || "Sorry, I'm having trouble connecting to the server. Please try again later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowErrorAlert(false);
                setError(null);
              }}
            >
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

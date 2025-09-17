'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CopyCheck, RefreshCw, User, Bot, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils';
import type { ChatMessage } from './Chat';

export interface MessagesProps {
  chatId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  regenerate: () => void;
  isReadonly?: boolean;
  isLoading?: boolean;
  sendMessage?: (content: string) => void;
}

const MessageBubble = ({ 
  message, 
  onCopy, 
  onRegenerate, 
  copied, 
  canRegenerate, 
  isReadonly 
}: {
  message: ChatMessage;
  onCopy: (text: string, id: string) => void;
  onRegenerate?: () => void;
  copied: boolean;
  canRegenerate: boolean;
  isReadonly: boolean;
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "group flex gap-3 px-4 py-6",
      isUser ? "bg-gray-50" : "bg-white"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border shadow-sm",
        isUser ? "bg-blue-500 text-white" : "bg-white text-gray-700"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 space-y-2 min-w-0">
        <div className="prose prose-sm max-w-none break-words word-wrap-break-word">
          {isUser ? (
            <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="text-gray-900"
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children, className }) => (
                  className ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-100 p-3">
                      <code className="text-sm">{children}</code>
                    </pre>
                  ) : (
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">{children}</code>
                  )
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        {!isReadonly && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(message.content, message.id)}
              className="h-7 px-2 text-xs"
            >
              {copied ? (
                <CopyCheck className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            
            {!isUser && canRegenerate && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-3 px-4 py-6 bg-white">
    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border shadow-sm bg-white text-gray-700">
      <Bot className="h-4 w-4" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
        <span className="text-sm text-gray-500">AI is thinking...</span>
      </div>
    </div>
  </div>
);

export function Messages({
  messages,
  regenerate,
  isReadonly = false,
  isLoading = false,
  sendMessage,
}: MessagesProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRegenerate = () => {
    regenerate();
  };

  const lastMessage = messages[messages.length - 1];
  const canRegenerate = lastMessage?.role === 'assistant';

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Start a conversation</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Ask questions about your business data and get AI-powered insights.
            </p>
          </div>
        </div>
        
        {/* Starter Questions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Try asking:</h4>
          <div className="space-y-2">
            {[
              "What initiatives can I rely on to offset cost pressures?",
              "Research through my data and tell me how to make more money?",
              "What should I look for in a business partner in Southeast Asia?",
              "What are 3 key tips to expand my business to Southeast Asia?"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage?.(question)}
                className="w-full text-left p-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="divide-y divide-gray-200">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopy}
            onRegenerate={index === messages.length - 1 ? handleRegenerate : undefined}
            copied={copiedMessageId === message.id}
            canRegenerate={canRegenerate && index === messages.length - 1}
            isReadonly={isReadonly}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
      </div>
    </div>
  );
}


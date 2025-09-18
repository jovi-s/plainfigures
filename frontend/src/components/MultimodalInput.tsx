'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/autoresize-textarea';
import { ArrowUpIcon, StopCircleIcon } from 'lucide-react';
import { cn } from '@/utils';
import type { ChatMessage } from './Chat';

export interface MultimodalInputProps {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage: (content: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  placeholder?: string;
  className?: string;
}

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  sendMessage,
  placeholder = "Ask about your business data...",
  className,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage(input);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative flex w-full items-end overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <AutoResizeTextarea
            ref={textareaRef}
            value={input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[44px] resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
            rows={1}
          />
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {isLoading ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stop}
                className="h-8 w-8 rounded-full p-0 hover:bg-red-50"
              >
                <StopCircleIcon className="h-4 w-4 text-red-500" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={!canSend}
                className={cn(
                  "h-8 w-8 rounded-full p-0",
                  canSend
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-400 hover:bg-gray-50"
                )}
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-center">
          <p className="text-xs text-gray-500">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </form>
    </div>
  );
}

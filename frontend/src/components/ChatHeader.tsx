'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare, RotateCcw } from 'lucide-react';

export interface ChatHeaderProps {
  chatId: string;
  isReadonly?: boolean;
  title?: string;
  subtitle?: string;
}

export function ChatHeader({
  isReadonly = false,
  title = "AI Assistant"
}: ChatHeaderProps) {
  const handleNewChat = () => {
    window.location.reload();
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
        
        {!isReadonly && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

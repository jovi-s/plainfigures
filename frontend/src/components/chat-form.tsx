"use client"

import React from "react"

import { cn } from "@/utils"
import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import { FinanceApiClient } from "@/api/client"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatFormProps extends React.ComponentProps<"div"> {
  userContext?: any
}

export function ChatForm({ className, userContext = {}, ...props }: ChatFormProps) {
  const [input, setInput] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
      }
      
      setMessages(prev => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setError(null)

      try {
        // Call the RAG API with the user's question and context
        const response = await FinanceApiClient.ragQuery(input, userContext)
        
        if (response.success && response.data) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.answer || response.data.response || "I received your question but couldn't generate a response."
          }
          
          setMessages(prev => [...prev, assistantMessage])
        } else {
          // Handle API error
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${response.error || 'Unknown error occurred'}`
          }
          
          setMessages(prev => [...prev, errorMessage])
        }
      } catch (err) {
        console.error('Chat API error:', err)
        setError(err as Error)
        
        // Add error message to chat
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting to the server. Please try again later."
        }
        
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const header = (
    <div className="flex flex-col gap-3 text-center p-4">
      <h2 className="text-lg font-semibold leading-none tracking-tight">AI Assistant</h2>
      <p className="text-muted-foreground text-xs">
        Ask questions about your business data and get AI-powered insights.
      </p>
    </div>
  )

  const messageList = (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            data-role={message.role}
            className="max-w-[85%] rounded-lg px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-gray-100 data-[role=user]:bg-blue-500 data-[role=assistant]:text-gray-800 data-[role=user]:text-white"
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 self-start">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-white border-l border-gray-200",
        className,
      )}
      {...props}
    >
      <div className="border-b border-gray-200">
        {messages.length === 0 && header}
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error: {error.message}
          </div>
        )}
        {messages.length > 0 ? messageList : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Start a conversation to get AI-powered insights about your business.
          </div>
        )}
      </div>
      <TooltipProvider>
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 p-4"
        >
          <div className="relative flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <AutoResizeTextarea
              onKeyDown={handleKeyDown}
              onChange={(v: string) => setInput(v)}
              value={input}
              placeholder="Ask about your business..."
              className="placeholder:text-gray-400 flex-1 bg-transparent focus:outline-none resize-none"
              disabled={isLoading}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit"
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-8 w-8 rounded-full p-0 hover:bg-blue-50"
                  disabled={!input.trim() || isLoading}
                >
                  <ArrowUpIcon size={16} className={input.trim() && !isLoading ? "text-blue-600" : "text-gray-400"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={12}>
                {isLoading ? "Sending..." : "Send message"}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            AI can make mistakes. Consider checking important information.
          </div>
        </form>
      </TooltipProvider>
    </div>
  )
}

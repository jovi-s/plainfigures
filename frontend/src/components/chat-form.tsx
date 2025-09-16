"use client"

import React from "react"
import { Chat } from "@/components/Chat"
import { generateUUID } from "@/utils"

interface ChatFormProps extends React.ComponentProps<"div"> {
  userContext?: any
}

export function ChatForm({ className, userContext = {}, ...props }: ChatFormProps) {
  const chatId = React.useMemo(() => generateUUID(), [])

  return (
    <Chat 
      id={chatId}
      initialMessages={[]}
      userContext={userContext}
      className={`w-full ${className || ''}`}
      {...props}
    />
  )
}

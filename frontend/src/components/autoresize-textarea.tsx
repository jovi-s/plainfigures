"use client"

import { cn } from "@/utils"
import { useRef, useEffect, forwardRef, type TextareaHTMLAttributes } from "react"

interface AutoResizeTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(function AutoResizeTextarea({ className, value, onChange, ...props }, ref) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = ref || internalRef

  const resizeTextarea = () => {
    const textarea = typeof textareaRef === 'function' ? null : textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => {
    resizeTextarea()
  }, [value])

  return (
    <textarea
      {...props}
      value={value}
      ref={textareaRef}
      rows={1}
      onChange={(e) => {
        onChange(e.target.value)
        resizeTextarea()
      }}
      className={cn("resize-none min-h-4 max-h-80", className)}
    />
  )
})

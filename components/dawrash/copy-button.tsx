'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CopyButton({ value, label = 'account number' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Copied ${label}`)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy. Please copy manually.')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="rounded-full border-gold/40 text-gold hover:bg-accent hover:text-gold"
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

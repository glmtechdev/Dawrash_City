'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resendMagicLink } from '@/app/actions'
import { MailCheck, CircleAlert } from 'lucide-react'

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const hasExpiredError = params.get('error') === 'link_expired'

  const [isPending, startTransition] = useTransition()
  const [resendState, setResendState] = useState<'idle' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState('')

  function handleResend() {
    if (!email || isPending) return
    startTransition(async () => {
      const result = await resendMagicLink(email)
      if (result.status === 'sent') {
        setResendState('sent')
      } else {
        setResendState('error')
        setResendError(result.message)
      }
    })
  }

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-gold">
          <MailCheck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Check Your Email</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We sent a sign-in link to{' '}
          <span className="font-semibold text-foreground">
            {email || 'your registered email'}
          </span>
          . Click it to continue setting up your land savings.
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          The link expires in 10 minutes. Check your spam folder if you don't see it.
        </p>

        {hasExpiredError && (
          <Alert variant="destructive" className="mt-6 rounded-2xl text-left">
            <CircleAlert />
            <AlertDescription>
              That link has expired or already been used. Request a new one below.
            </AlertDescription>
          </Alert>
        )}

        {resendState === 'sent' && (
          <p className="mt-6 text-sm font-semibold text-success">
            New link sent. Check your inbox.
          </p>
        )}

        {resendState === 'error' && (
          <p className="mt-6 text-sm text-destructive">{resendError}</p>
        )}

        {/* Resend */}
        {resendState !== 'sent' && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending || !email}
            className="mt-6 text-sm font-semibold text-gold hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Resending...' : 'Resend link'}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong address?{' '}
        <Link href="/register" className="font-semibold text-gold hover:underline">
          Re-enter your email
        </Link>
      </p>
    </>
  )
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyContent />
      </Suspense>
    </AuthShell>
  )
}

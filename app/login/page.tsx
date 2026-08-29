'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldCheck, CircleAlert, Sparkles, Smartphone } from 'lucide-react'

const glmErrorMessages: Record<string, string> = {
  config: 'SSO is not configured correctly. Please contact support.',
  config_svc: 'SSO service key is not configured in Vercel. Please add SUPABASE_SERVICE_ROLE_KEY to environment variables.',
  missing_token: 'Sign-in token missing. Please open Dawrash City from the GLM Members app.',
  invalid_token: 'Your session token has expired. Please return to the GLM app and tap "Open Dawrash City" again.',
  session_failed: 'Could not create your Dawrash session. Please try again from the GLM app.',
  link_expired: 'Sign-in link expired or invalid. Please tap "Open Dawrash City" in your GLM app again.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const glmError = searchParams.get('error')

  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Dawrash City Access</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Dawrash City is accessible exclusively for verified GLM church members through Single Sign-On (SSO).
        </p>

        {glmError && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert className="size-4" />
            <AlertTitle>Access Error</AlertTitle>
            <AlertDescription>
              {glmErrorMessages[glmError] ?? 'An unexpected error occurred. Please sign in via the GLM app.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">How to Sign In</h2>
              <ol className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground list-decimal pl-4">
                <li>Open the <strong>GLM Members App</strong> on your phone or computer.</li>
                <li>Go to your <strong>Profile</strong> screen.</li>
                <li>Tap the <strong>"Open Dawrash City"</strong> button to launch your dashboard.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center text-xs text-gold">
          <Sparkles className="inline-block size-3.5 mr-1" />
          No password or separate account required — your GLM church membership is your identity.
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need assistance with your church membership?{' '}
        <span className="font-semibold text-foreground">Contact support or your pastor.</span>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}


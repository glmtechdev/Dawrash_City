'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { checkMembership } from '@/app/actions'
import { Mail, ArrowRight, CircleAlert, MailCheck } from 'lucide-react'

const glmErrorMessages: Record<string, string> = {
  config: 'SSO is not configured correctly. Please contact support.',
  missing_token: 'Sign-in link was invalid. Please try again from the Members app.',
  invalid_token: 'Your session has expired. Please go back and click the button again.',
  session_failed: 'Could not create your session. Please try again.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sent' | 'not_member' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Error passed from /auth/glm redirect (e.g. ?error=config, ?error=invalid_token)
  const glmError = searchParams.get('error')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return

    startTransition(async () => {
      const result = await checkMembership(email)

      if (result.status === 'link_sent') {
        setState('sent')
        setTimeout(
          () => router.push(`/verify?email=${encodeURIComponent(result.email)}`),
          900,
        )
      } else if (result.status === 'not_member') {
        setState('not_member')
      } else {
        setState('error')
        setErrorMessage(result.message)
      }
    })
  }

  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Enter your church email and we will send you a secure sign-in link.
        </p>

        {glmError && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {glmErrorMessages[glmError] ?? 'An unexpected error occurred. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {state === 'not_member' && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert />
            <AlertTitle>Access unavailable</AlertTitle>
            <AlertDescription>
              This email is not registered. Use the link below to verify your membership first.
            </AlertDescription>
          </Alert>
        )}

        {state === 'error' && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {state === 'sent' && (
          <Alert className="mt-6 rounded-2xl border-transparent bg-success/10 text-success">
            <MailCheck className="size-4" />
            <AlertTitle className="text-success">Link sent</AlertTitle>
            <AlertDescription className="text-success/80">
              Check your email and click the sign-in link. Redirecting you now.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Church email</FieldLabel>
              <InputGroup className="h-12 rounded-2xl">
                <InputGroupAddon>
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@glm.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state !== 'idle') setState('idle')
                  }}
                  disabled={isPending || state === 'sent'}
                />
              </InputGroup>
            </Field>
            <Button
              type="submit"
              size="lg"
              disabled={isPending || state === 'sent'}
              className="h-12 rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Sending link
                </>
              ) : (
                <>
                  Send Sign-in Link
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        First time here?{' '}
        <Link href="/register" className="font-semibold text-gold hover:underline">
          Verify your membership
        </Link>
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

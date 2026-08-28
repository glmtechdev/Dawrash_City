'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Mail, ArrowRight, CircleCheck, CircleAlert } from 'lucide-react'

// Demo directory of registered church emails.
const REGISTERED = new Set([
  'daniel.okafor@glm.org',
  'grace.adeyemi@glm.org',
  'emmanuel.bello@glm.org',
])

type State = 'idle' | 'loading' | 'error' | 'success'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    setTimeout(() => {
      if (REGISTERED.has(email.trim().toLowerCase())) {
        setState('success')
        setTimeout(() => router.push(`/verify?email=${encodeURIComponent(email.trim())}`), 1200)
      } else {
        setState('error')
      }
    }, 1100)
  }

  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <Mail className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Verify Your Membership</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Enter your registered church email to check your membership status.
        </p>

        {state === 'error' ? (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert />
            <AlertTitle>Not a registered member</AlertTitle>
            <AlertDescription>
              This email is not registered in our system. Please contact your pastor.
            </AlertDescription>
          </Alert>
        ) : null}

        {state === 'success' ? (
          <Alert className="mt-6 rounded-2xl border-transparent bg-success/10 text-success">
            <CircleCheck />
            <AlertTitle className="text-success">Membership verified</AlertTitle>
            <AlertDescription className="text-success/80">
              Check your email for your login link. Redirecting you now.
            </AlertDescription>
          </Alert>
        ) : null}

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
                  placeholder="you@glm.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === 'error') setState('idle')
                  }}
                  disabled={state === 'loading' || state === 'success'}
                />
              </InputGroup>
            </Field>
            <Button
              type="submit"
              size="lg"
              disabled={state === 'loading' || state === 'success'}
              className="h-12 rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90"
            >
              {state === 'loading' ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Checking membership
                </>
              ) : (
                <>
                  Check My Membership
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gold hover:underline">
            Login
          </Link>
        </p>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not a member?{' '}
        <span className="font-medium text-foreground">Contact your pastor.</span>
      </p>
    </AuthShell>
  )
}

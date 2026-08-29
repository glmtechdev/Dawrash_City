'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { checkMembership } from '@/app/actions'
import { Mail, ArrowRight, CircleCheck, CircleAlert } from 'lucide-react'

type State = 'idle' | 'not_member' | 'error' | 'link_sent'

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return

    startTransition(async () => {
      const result = await checkMembership(email)

      if (result.status === 'link_sent') {
        setState('link_sent')
        // Small pause so the success state is visible, then navigate
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
          <Mail className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Check Your Access</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Enter your registered church email to continue.
        </p>

        {state === 'not_member' && (
          <Alert variant="destructive" className="mt-6 rounded-2xl">
            <CircleAlert />
            <AlertTitle>Not registered</AlertTitle>
            <AlertDescription>
              This email is not in our members list. Contact your pastor to be added.
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

        {state === 'link_sent' && (
          <Alert className="mt-6 rounded-2xl border-transparent bg-success/10 text-success">
            <CircleCheck />
            <AlertTitle className="text-success">Membership verified</AlertTitle>
            <AlertDescription className="text-success/80">
              Check your email for your login link. Redirecting you now.
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
                  disabled={isPending || state === 'link_sent'}
                />
              </InputGroup>
            </Field>
            <Button
              type="submit"
              size="lg"
              disabled={isPending || state === 'link_sent'}
              className="h-12 rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90"
            >
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Checking membership
                </>
              ) : (
                <>
                  Check Membership
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have access?{' '}
        <Link href="/login" className="font-semibold text-gold hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Not a member?{' '}
        <span className="font-medium text-foreground">Contact your pastor.</span>
      </p>
    </AuthShell>
  )
}

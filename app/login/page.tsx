'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setTimeout(() => router.push('/dashboard'), 900)
  }

  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <Lock className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Sign in to track your land savings and record new payments.
        </p>

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
                  defaultValue="daniel.okafor@glm.org"
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <InputGroup className="h-12 rounded-2xl">
                <InputGroupAddon>
                  <Lock className="size-4 text-muted-foreground" aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  defaultValue="password"
                />
              </InputGroup>
            </Field>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90"
            >
              {loading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Signing in
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need to verify first?{' '}
          <Link href="/register" className="font-semibold text-gold hover:underline">
            Check your membership
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

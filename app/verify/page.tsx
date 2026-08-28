'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { Button } from '@/components/ui/button'
import { MailCheck, ArrowRight } from 'lucide-react'

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? 'your registered email'
  const [resent, setResent] = useState(false)

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-gold">
          <MailCheck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Check Your Email</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We sent a verification link to{' '}
          <span className="font-semibold text-foreground">{email}</span>. Click it to continue
          setting up your land savings.
        </p>

        {/* Demo shortcut — walkable without a real inbox */}
        <Button
          render={<Link href="/onboarding/plots" />}
          size="lg"
          className="mt-8 h-12 w-full rounded-full bg-gold text-base text-gold-foreground hover:bg-gold/90"
        >
          Open the link
          <ArrowRight data-icon="inline-end" />
        </Button>

        <button
          type="button"
          onClick={() => setResent(true)}
          className="mt-6 text-sm font-semibold text-gold hover:underline"
        >
          {resent ? 'Verification email resent' : 'Resend email'}
        </button>
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

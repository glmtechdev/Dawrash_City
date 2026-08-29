'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/dawrash/auth-shell'
import { ShieldCheck, Smartphone } from 'lucide-react'

function VerifyContent() {
  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-gold">
          <ShieldCheck className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">SSO Verification</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Dawrash City authenticates member identity directly via the GLM Members App.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-left">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">Open from GLM App</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                To complete sign-in, open the GLM Members App and tap <strong>"Open Dawrash City"</strong> in your profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need instructions?{' '}
        <Link href="/login" className="font-semibold text-gold hover:underline">
          Return to sign-in guide
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


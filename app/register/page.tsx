'use client'

import { AuthShell } from '@/components/dawrash/auth-shell'
import { Mail, Smartphone } from 'lucide-react'

export default function RegisterPage() {
  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        {/* Icon */}
        <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-gold">
          <Mail className="size-7" aria-hidden />
        </span>

        {/* Heading */}
        <h1 className="mt-5 font-serif text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Membership Access
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Dawrash City is integrated directly with the Gospel Labour Ministry (GLM) member portal.
        </p>

        {/* Instructions */}
        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">Access via GLM App</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                All registered GLM church members are automatically granted access. Log in to your GLM Members App and tap{' '}
                <strong className="text-foreground">&quot;Open Dawrash City&quot;</strong> in your profile.
              </p>
            </div>
          </div>
        </div>

        {/* GLM link */}
        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center text-sm text-muted-foreground">
          Already a GLM member?{' '}
          <a
            href="https://members.glmhq.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#e53e3e] hover:underline"
          >
            Open GLM Members App
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not yet a member?{' '}
        <span className="font-semibold text-foreground">Speak to your pastor to get registered.</span>
      </p>
    </AuthShell>
  )
}

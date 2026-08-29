'use client'

import { AuthShell } from '@/components/dawrash/auth-shell'
import { Mail, Smartphone } from 'lucide-react'

export default function RegisterPage() {
  return (
    <AuthShell>
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
          <Mail className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">Membership Access</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Dawrash City registration is integrated directly with the Gospel Labour Ministry (GLM) member portal.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Smartphone className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">Access via GLM App</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                All registered GLM church members are automatically granted access. Log in to your GLM Members App and tap <strong>"Open Dawrash City"</strong> in your profile.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center text-sm text-muted-foreground">
          Already a GLM member?{' '}
          <a
            href="https://members-dbase.vercel.app"
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


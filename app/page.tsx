'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Brand } from '@/components/dawrash/brand'
import {
  ShieldCheck,
  Building2,
  ScrollText,
  ArrowRight,
  Lock,
  Layers,
  LandPlot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DeckTab = 'hero' | 'allocation' | 'covenant'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<DeckTab>('hero')

  // Support keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveTab((curr) => (curr === 'hero' ? 'allocation' : curr === 'allocation' ? 'covenant' : 'hero'))
      } else if (e.key === 'ArrowLeft') {
        setActiveTab((curr) => (curr === 'covenant' ? 'allocation' : curr === 'allocation' ? 'hero' : 'covenant'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#0a1017] text-foreground select-none">
      {/* Background Architectural Canvas */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/dawrash-hero.png"
          alt="Dawrash City Master Survey"
          fill
          priority
          className="object-cover object-center brightness-[0.78] contrast-[1.08] transition-transform duration-1000 ease-out"
        />
        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070c12]/90 via-[#0f1923]/60 to-[#070c12]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(201,154,59,0.12),transparent_70%)]" />
      </div>

      {/* Screen Frame Container */}
      <div className="relative z-10 mx-auto flex h-[100svh] max-w-6xl flex-col justify-between px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-7 sm:pb-7">
        {/* Top Header */}
        <header className="flex shrink-0 items-center justify-between">
          <Brand tone="light" subtitle />
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 active:scale-95 sm:text-sm"
          >
            Sign In
          </Link>
        </header>

        {/* Center Content Deck Area */}
        <div className="relative my-auto flex w-full flex-1 items-center justify-center py-4 sm:py-6">
          {/* TAB 1: HERO / EMOTIONAL PRIMING */}
          {activeTab === 'hero' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex w-full max-w-2xl flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 shadow-sm backdrop-blur-md sm:text-xs">
                <ShieldCheck className="size-3.5 text-[#e5b85c]" />
                <span>Gospel Labour Ministry Exclusive</span>
              </div>

              <h1 className="font-serif text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl">
                Own Your Place in{' '}
                <span className="block bg-gradient-to-r from-[#edd39b] via-[#c99a3b] to-[#b38528] bg-clip-text text-5xl text-transparent drop-shadow-sm sm:text-6xl md:text-8xl">
                  Dawrash City
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
                A dedicated community for GLM church members to acquire surveyed, documented land with flexible, self-paced contributions.
              </p>

              {/* Quick Spec Highlights */}
              <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">Fixed Rate</p>
                  <p className="font-serif text-base font-bold text-gold sm:text-lg">₦2,000,000 / Plot</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">Allocation</p>
                  <p className="font-serif text-base font-bold text-white sm:text-lg">No Plot Limit</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">Payments</p>
                  <p className="font-serif text-base font-bold text-white sm:text-lg">No Deadlines or Penalties</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLOT ALLOCATION & SPECIFIC TERMS */}
          {activeTab === 'allocation' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                <LandPlot className="size-3" />
                <span>Land Terms & Parameters</span>
              </div>

              <h2 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Documented Ownership Without Commercial Pressure
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition-all hover:border-gold/40 sm:flex-col sm:p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white sm:mt-3.5 sm:text-lg">Surveyed & Reserved</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Plots are officially surveyed and registered under GLM trusteeship from your initial contribution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition-all hover:border-gold/40 sm:flex-col sm:p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white sm:mt-3.5 sm:text-lg">Dedicated Account</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      Each member receives dedicated payment details to direct all land savings contributions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md transition-all hover:border-gold/40 sm:flex-col sm:p-5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white sm:mt-3.5 sm:text-lg">Zero Interest or Fees</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">
                      100% of your contributions go toward your land target. No hidden maintenance or interest charges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THE COVENANT ROADMAP */}
          {activeTab === 'covenant' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                <ScrollText className="size-3" />
                <span>The 4-Step Covenant</span>
              </div>

              <h2 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                From Church Member to Certificate Holder
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gold/20 font-serif text-xs font-bold text-gold">
                    01
                  </span>
                  <h4 className="mt-2.5 font-serif text-base font-bold text-white">Church SSO</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                    Confirm your GLM registered email to unlock member access.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gold/20 font-serif text-xs font-bold text-gold">
                    02
                  </span>
                  <h4 className="mt-2.5 font-serif text-base font-bold text-white">Plot Count</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                    Lock in your plots at the fixed ₦2,000,000 rate — as many as you want.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gold/20 font-serif text-xs font-bold text-gold">
                    03
                  </span>
                  <h4 className="mt-2.5 font-serif text-base font-bold text-white">Digital Covenant</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                    Sign the timestamped legal agreement online.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gold/20 font-serif text-xs font-bold text-gold">
                    04
                  </span>
                  <h4 className="mt-2.5 font-serif text-base font-bold text-white">Live Savings</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                    Save via bank transfer at your own pace and receive your title certificate upon full payment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pinned Action & Navigation Deck */}
        <div className="shrink-0 space-y-4 pt-2">
          {/* Main Action Bar */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            {/* Primary Ergonomic CTA */}
            <Link
              href="/register"
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#b5820b] via-[#d4a849] to-[#9e700a] px-8 py-3.5 text-sm font-bold text-[#1c1404] shadow-lg shadow-black/40 transition-all duration-300 hover:brightness-110 active:scale-[0.98] sm:w-auto sm:text-base"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {/* Segmented Screen Switcher (Deck Navigation) */}
            <nav
              aria-label="Deck tabs"
              className="flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-lg"
            >
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  activeTab === 'hero'
                    ? 'bg-gold text-gold-foreground font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('allocation')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  activeTab === 'allocation'
                    ? 'bg-gold text-gold-foreground font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <span className="sm:hidden">Allocation</span>
                <span className="hidden sm:inline">Land Allocation</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('covenant')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  activeTab === 'covenant'
                    ? 'bg-gold text-gold-foreground font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <span className="sm:hidden">Covenant</span>
                <span className="hidden sm:inline">Covenant Steps</span>
              </button>
            </nav>
          </div>

          {/* Bottom Trust & Exclusivity Footnote */}
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <div className="flex items-center gap-1.5">
              <Lock className="size-3 text-[#e5b85c]/80" />
              <span>Gospel Labour Ministry &middot; Members Only</span>
            </div>
            <p>Dawrash City &copy; 2026</p>
          </div>
        </div>
      </div>
    </main>
  )
}



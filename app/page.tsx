import Link from 'next/link'
import Image from 'next/image'
import { Brand } from '@/components/dawrash/brand'
import {
  ShieldCheck,
  HandCoins,
  Users,
  ArrowRight,
  Sparkles,
  Compass,
  Lock,
  ChevronDown,
} from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Land Ownership',
    body: 'Every plot is surveyed, legally documented, and reserved exclusively in your name from the day you begin saving.',
    tag: 'Verified Allocation',
  },
  {
    icon: HandCoins,
    title: 'Flexible Contributions',
    body: 'Contribute at your own pace directly by bank transfer. Zero penalties, no fixed deadlines, and transparent tracking.',
    tag: '100% Interest-Free',
  },
  {
    icon: Users,
    title: 'Sanctuary Community',
    body: 'An exclusive fellowship open solely to registered members of Gospel Labour Ministry, building the Dawrash City legacy together.',
    tag: 'Faith & Legacy',
  },
]

const steps = [
  {
    n: '01',
    title: 'Verify Membership',
    body: 'Confirm your registered church email to activate your verified allocation portal.',
  },
  {
    n: '02',
    title: 'Select Your Plots',
    body: 'Choose 1 to 3 prime plots and lock in your transparent milestone savings target.',
  },
  {
    n: '03',
    title: 'Sign Digital Covenant',
    body: 'Accept allocation terms with an immutable, timestamped digital signature.',
  },
  {
    n: '04',
    title: 'Save At Your Pace',
    body: 'Transfer funds smoothly and watch your live allocation progress bar reach 100%.',
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-gold/20 selection:text-gold">
      {/* Hero Section */}
      <section className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden">
        {/* Background Image with Ambient Luxury Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/dawrash-hero.png"
            alt="Dawrash City Master Plan and Scenic Architecture"
            fill
            priority
            className="object-cover object-center brightness-[0.85] contrast-[1.05]"
          />
          {/* Top header vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1017]/90 via-[#0f1923]/60 to-[#0a1017]/95" />
          {/* Subtle radial warmth for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(201,154,59,0.08),transparent_60%)]" />
        </div>

        {/* Top Navigation */}
        <div className="relative z-20 mx-auto w-full max-w-6xl px-6 pt-6 pb-4 sm:pt-8">
          <header className="flex items-center justify-between">
            <Brand tone="light" subtitle />
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 active:scale-95"
              >
                Sign In
              </Link>
            </div>
          </header>
        </div>

        {/* Hero Content Area */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 md:py-16">
          <div className="max-w-2xl">
            {/* Pill Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-white/90 shadow-sm backdrop-blur-md">
              <Sparkles className="size-3.5 text-[#e5b85c]" />
              <span>Gospel Labour Ministry Exclusive</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
              Own Your Place in{' '}
              <span className="block bg-gradient-to-r from-[#edd39b] via-[#c99a3b] to-[#b38528] bg-clip-text text-transparent drop-shadow-sm">
                Dawrash City
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
              A serene faith sanctuary where believers live, grow, and build generational heritage together.
            </p>

            {/* Primary & Secondary CTAs (Matching Luxury Ergonomics) */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#b5820b] via-[#d4a849] to-[#9e700a] px-8 py-4 text-base font-semibold text-[#1c1404] shadow-lg shadow-black/30 transition-all duration-300 hover:brightness-110 hover:shadow-[#b5820b]/25 active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href="#how-it-works"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/5 px-6 py-4 text-sm font-medium text-white/90 backdrop-blur-md transition-all duration-200 hover:border-white/45 hover:bg-white/15 hover:text-white active:scale-[0.98]"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white transition-transform group-hover:scale-110">
                  <Compass className="size-3.5" />
                </div>
                <span>Explore Master Plan</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Scroll Indicator */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-[#e5b85c]/80" />
            <span>Private Members-Only Programme</span>
          </div>
          <a
            href="#features"
            aria-label="Scroll to discover features"
            className="flex items-center gap-1 text-white/60 transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">Learn More</span>
            <ChevronDown className="size-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative mx-auto max-w-6xl scroll-mt-8 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Why Dawrash City</p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Land ownership founded on integrity and covenant
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Designed specifically for members to secure documented property with full peace of mind.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-md hover:shadow-gold/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-gold-foreground">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-bold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative scroll-mt-8 bg-secondary py-20 text-secondary-foreground md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                <span>The Journey</span>
              </div>
              <h2 className="mt-4 text-balance font-serif text-3xl font-bold tracking-tight md:text-4xl">
                Four clear steps from member to titleholder
              </h2>
              <p className="mt-5 max-w-md text-pretty leading-relaxed text-secondary-foreground/75">
                Every transaction and signed covenant is recorded transparently on your dashboard. No hidden charges or surprise adjustments.
              </p>

              <div className="relative mt-8 hidden overflow-hidden rounded-3xl border border-white/10 shadow-2xl lg:block">
                <Image
                  src="/images/dawrash-land.png"
                  alt="Surveyed plot allocation within Dawrash City"
                  width={640}
                  height={420}
                  className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="font-medium">Phase 1 Master Survey Complete</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur-sm">Reserved Plots</span>
                </div>
              </div>
            </div>

            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((s) => (
                <li
                  key={s.n}
                  className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:bg-white/[0.07]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#b5820b] to-[#735004] font-serif text-sm font-bold text-white shadow-md">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary-foreground/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 flex flex-col items-center justify-center gap-4 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#b5820b] via-[#d4a849] to-[#9e700a] px-9 py-4 text-base font-semibold text-[#1c1404] shadow-xl transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
            >
              <span>Verify Your Membership</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-secondary-foreground/50">Requires an active church registered email</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-center sm:flex-row sm:text-left">
          <Brand />
          <p className="text-xs text-muted-foreground">
            Dawrash City &copy; 2026. Gospel Labour Ministry. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}


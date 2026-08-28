import Link from 'next/link'
import Image from 'next/image'
import { Brand } from '@/components/dawrash/brand'
import { Button } from '@/components/ui/button'
import { ShieldCheck, HandCoins, Users, ArrowRight, ArrowDown } from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure Land Ownership',
    body: 'Every plot is surveyed, documented, and reserved in your name from the day you begin saving.',
  },
  {
    icon: HandCoins,
    title: 'Flexible Payments',
    body: 'Contribute at your own pace by bank transfer. No fixed deadlines, no penalties, no hidden charges.',
  },
  {
    icon: Users,
    title: 'Exclusive Community',
    body: 'Open only to registered members of Gospel Labour Ministry, building the Dawrash City vision together.',
  },
]

const steps = [
  { n: '1', title: 'Verify your membership', body: 'Confirm your registered church email to check your access.' },
  { n: '2', title: 'Select your plots', body: 'Choose one to three plots and lock in your savings target.' },
  { n: '3', title: 'Sign the digital covenant', body: 'Accept the terms with a timestamped, recorded signature.' },
  { n: '4', title: 'Save at your own pace', body: 'Transfer from any bank and watch your progress build.' },
]

export default function LandingPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <Image
          src="/images/dawrash-hero.png"
          alt="Aerial view of the planned Dawrash City land"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/70 to-navy/90" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 py-8">
          <header className="flex items-center justify-between">
            <Brand tone="light" subtitle />
            <Button
              render={<Link href="/login" />}
              variant="ghost"
              className="hidden rounded-full text-navy-foreground hover:bg-white/10 hover:text-navy-foreground sm:inline-flex"
            >
              Sign In
            </Button>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16">
            <p className="mb-5 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-navy-foreground/80">
              Members Only Programme
            </p>
            <h1 className="max-w-3xl text-balance font-serif text-5xl font-bold leading-[1.05] text-navy-foreground sm:text-6xl md:text-7xl">
              Own Your Land in <span className="text-gold">Dawrash</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-navy-foreground/75">
              An exclusive land ownership programme for registered members of Gospel Labour Ministry
              building the Dawrash City vision.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/login" />}
                size="lg"
                className="rounded-full bg-gold px-7 text-base text-gold-foreground hover:bg-gold/90"
              >
                Member Login
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                render={<Link href="#how-it-works" />}
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-transparent px-7 text-base text-navy-foreground hover:bg-white/10 hover:text-navy-foreground"
              >
                Learn More
                <ArrowDown data-icon="inline-end" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-navy-foreground/55">Only open to registered church members.</p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Why Dawrash</p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
            Land ownership built on real commitment
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-gold">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 font-serif text-xl font-bold text-foreground">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-secondary py-20 text-secondary-foreground md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">How It Works</p>
              <h2 className="mt-3 text-balance font-serif text-3xl font-bold md:text-4xl">
                Four steps from member to landowner
              </h2>
              <p className="mt-5 max-w-md text-pretty leading-relaxed text-secondary-foreground/70">
                Each stage is documented, recorded, and straightforward. No guesswork, no surprises.
              </p>
              <div className="relative mt-9 hidden overflow-hidden rounded-3xl lg:block">
                <Image
                  src="/images/dawrash-land.png"
                  alt="A surveyed plot of land within Dawrash City"
                  width={640}
                  height={420}
                  className="h-64 w-full object-cover"
                />
              </div>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((s) => (
                <li key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-gold font-serif text-lg font-bold text-gold-foreground">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-14 flex justify-center">
            <Button
              render={<Link href="/register" />}
              size="lg"
              className="rounded-full bg-gold px-8 text-base text-gold-foreground hover:bg-gold/90"
            >
              Verify Your Membership
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <Brand />
          <p className="text-sm text-muted-foreground">Dawrash City &copy; 2026. Members Only Programme.</p>
        </div>
      </footer>
    </main>
  )
}

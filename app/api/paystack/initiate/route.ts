import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amountKobo, intendedAmountKobo, email: bodyEmail, memberId: bodyMemberId } = body || {}

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return new Response(JSON.stringify({ error: 'Missing PAYSTACK_SECRET_KEY' }), { status: 500 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Enforce authenticated session if available
    const email = user?.email || bodyEmail
    const memberId = user?.id || bodyMemberId

    if (!amountKobo || !email) {
      return new Response(JSON.stringify({ error: 'Missing amountKobo or email' }), { status: 400 })
    }

    const resp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        metadata: { member_id: memberId, intended_amount_kobo: intendedAmountKobo ?? null },
      }),
    })

    const data = await resp.json()
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Paystack initialize failed', data }), { status: 502 })
    }

    return new Response(JSON.stringify({ data }), { status: 200 })
  } catch (err) {
    console.error('[paystack/initiate] error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}

export const runtime = 'nodejs'

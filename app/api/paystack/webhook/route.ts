import crypto from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return new Response('Missing PAYSTACK_SECRET_KEY', { status: 500 })

  const signature = req.headers.get('x-paystack-signature') || ''
  const raw = await req.text()

  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  const hashBuffer = Buffer.from(hash, 'utf8')
  const sigBuffer = Buffer.from(signature, 'utf8')

  if (
    hashBuffer.length !== sigBuffer.length ||
    !crypto.timingSafeEqual(hashBuffer, sigBuffer)
  ) {
    console.warn('[paystack/webhook] signature mismatch')
    return new Response('signature mismatch', { status: 400 })
  }

  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch (err) {
    console.error('[paystack/webhook] json parse error', err)
    return new Response('bad payload', { status: 400 })
  }

  const event = payload.event
  const data = payload.data

  // Only process successful charge events. Ignore transfers, subscriptions, etc.
  if (event !== 'charge.success') {
    console.log(`[paystack/webhook] ignored event=${event}`)
    return new Response('ignored', { status: 200 })
  }

  try {
    const supabase = createSupabaseAdminClient()

    // Map Paystack data to our transactions table shape
    const reference = String(data.reference ?? data.trxref ?? '')
    const amountCharged = Number(data.amount ?? 0) // in kobo
    const status = String(data.status ?? '')
    const memberId = data.metadata?.member_id ?? null
    const intendedAmount = Number(data.metadata?.intended_amount_kobo ?? data.metadata?.intendedAmountKobo ?? 0)
    const paidAt = data.paid_at ?? data.transaction_date ?? new Date().toISOString()

    if (!reference) {
      console.warn('[paystack/webhook] no reference in payload')
      return new Response('no reference', { status: 400 })
    }

    // Net credit to record: prefer intended amount (what we track as savings),
    // fall back to gross charged amount if metadata is absent.
    const recordedAmount = intendedAmount > 0 ? intendedAmount : amountCharged
    // Fee = gross - net (only meaningful when intendedAmount is present)
    const feeKobo = intendedAmount > 0 ? amountCharged - intendedAmount : 0

    const { error: upsertError } = await supabase.from('transactions').upsert(
      [
        {
          reference,
          amount_kobo: recordedAmount,
          intended_amount_kobo: intendedAmount > 0 ? intendedAmount : null,
          charged_amount_kobo: amountCharged,
          fee_kobo: feeKobo > 0 ? feeKobo : null,
          member_id: memberId,
          method: 'Paystack',
          status: status === 'success' ? 'confirmed' : status,
          paid_at: paidAt,
        },
      ],
      { onConflict: 'reference' },
    )

    if (upsertError) {
      console.error('[paystack/webhook] upsert error', upsertError.message)
      return new Response('db error', { status: 500 })
    }

    // ── Auto-complete: mark profile as completed if full target is reached ──
    // Only attempt if we have a member_id and this transaction was successful.
    if (memberId && status === 'success') {
      try {
        // Fetch the member's plot target
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plots, status')
          .eq('id', memberId)
          .maybeSingle()

        if (profileError) {
          console.warn('[paystack/webhook] could not fetch profile for completion check:', profileError.message)
        } else if (profile && profile.status !== 'completed') {
          // Sum all confirmed transactions for this member (including this one)
          const { data: txRows, error: txError } = await supabase
            .from('transactions')
            .select('amount_kobo')
            .eq('member_id', memberId)
            .eq('status', 'confirmed')

          if (txError) {
            console.warn('[paystack/webhook] could not fetch transactions for completion check:', txError.message)
          } else {
            // Each personal plot costs ₦2M (personal ₦1M + church ₦1M)
            const PAYMENT_PER_PERSONAL_PLOT_KOBO = 2_000_000 * 100
            const totalConfirmedKobo = (txRows ?? []).reduce((sum, t) => sum + Number(t.amount_kobo ?? 0), 0)
            const targetKobo = (profile.plots ?? 0) * PAYMENT_PER_PERSONAL_PLOT_KOBO

            if (targetKobo > 0 && totalConfirmedKobo >= targetKobo) {
              const { error: completeError } = await supabase
                .from('profiles')
                .update({ status: 'completed' })
                .eq('id', memberId)

              if (completeError) {
                console.warn('[paystack/webhook] could not set status=completed:', completeError.message)
              } else {
                console.log(`[paystack/webhook] member ${memberId} marked as completed`)
              }
            }
          }
        }
      } catch (completionErr) {
        // Non-fatal. Don't fail the webhook response over a completion check.
        console.error('[paystack/webhook] completion check error', completionErr)
      }
    }

    console.log(`[paystack/webhook] processed event=${event} reference=${reference} status=${status}`)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[paystack/webhook] unexpected error', err)
    return new Response('internal error', { status: 500 })
  }
}

export const runtime = 'nodejs'

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

  try {
    const supabase = createSupabaseAdminClient()

    // Map Paystack data to our transactions table shape
    const reference = String(data.reference ?? data.trxref ?? '')
    const amountCharged = Number(data.amount ?? 0) // paystack amount is in kobo (smallest unit)
    const status = String(data.status ?? '')
    const memberId = data.metadata?.member_id ?? null
    const intendedAmount = Number(data.metadata?.intended_amount_kobo ?? data.metadata?.intendedAmountKobo ?? 0)
    const paidAt = data.paid_at ?? data.transaction_date ?? new Date().toISOString()

    if (!reference) {
      console.warn('[paystack/webhook] no reference in payload')
      return new Response('no reference', { status: 400 })
    }

    // Upsert transaction by reference
    // If the client sent an intended amount (net credit), record that as amount_kobo. Otherwise, fall back to charged amount.
    const recordedAmount = intendedAmount > 0 ? intendedAmount : amountCharged

    const { error } = await supabase.from('transactions').upsert(
      [
        {
          reference,
          amount_kobo: recordedAmount,
          member_id: memberId,
          method: 'Paystack',
          status: status === 'success' ? 'confirmed' : status,
          paid_at: paidAt,
        },
      ],
      { onConflict: 'reference' },
    )

    if (error) {
      console.error('[paystack/webhook] upsert error', error.message)
      return new Response('db error', { status: 500 })
    }

    console.log(`[paystack/webhook] processed event=${event} reference=${reference} status=${status}`)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[paystack/webhook] unexpected error', err)
    return new Response('internal error', { status: 500 })
  }
}

export const runtime = 'nodejs'

import { ImageResponse } from 'next/og'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: '#0F1923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/dawarshIcon.png`}
          width={42}
          height={42}
          style={{ objectFit: 'contain' }}
          alt=""
        />
      </div>
    ),
    { ...size },
  )
}

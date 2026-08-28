import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#0F1923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Simple house/land mark in gold */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          {/* Roof */}
          <path d="M10 3L18 10H15V17H5V10H2L10 3Z" fill="#8B6914" />
        </svg>
      </div>
    ),
    { ...size },
  )
}

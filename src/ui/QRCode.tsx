// Minimal QR code using the qrcode library bundled inline via data URL
// We use a Canvas approach so there's no extra dep
import { useEffect, useRef } from 'react'

// Tiny QR code generator — uses an external CDN script loaded once
declare global { interface Window { QRCode: any } }

export function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    // Encode as a data-only display using img with a public QR API (no external script needed)
    const img = document.createElement('img')
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=ffffff&bgcolor=1a1d27`
    img.alt = `QR code for ${value}`
    img.width = size
    img.height = size
    img.className = 'rounded-lg'
    ref.current.appendChild(img)
  }, [value, size])

  return <div ref={ref} aria-label={`QR code: ${value}`} />
}

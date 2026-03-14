/**
 * ShareModal - QR code + Web Share API for transferring codes between devices
 *
 * Usage:
 *   <ShareModal url={shareUrl} onClose={() => setOpen(false)} />
 *
 * The URL should include ?d=... and/or ?s=... params so the receiving device
 * hydrates automatically when the link is opened.
 */

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

export default function ShareModal({ url, title = 'Share Assessment', onClose }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [qrError, setQrError] = useState(false)

  // Render QR code into canvas once the modal is shown
  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(() => setQrError(true))
  }, [url])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text in a temp input
      const inp = document.createElement('input')
      inp.value = url
      document.body.appendChild(inp)
      inp.select()
      document.execCommand('copy')
      document.body.removeChild(inp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWebShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title: 'Trajectory PFA', url })
    } catch {
      // User cancelled or share failed - no-op
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-600">
          Scan the QR code on your other device to load this data automatically,
          or tap the share / copy button to send the link.
        </p>

        {/* QR code */}
        <div className="flex justify-center">
          {qrError ? (
            <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-xs text-center px-4">
              QR code unavailable. Use the copy button below.
            </div>
          ) : (
            <canvas ref={canvasRef} className="rounded-lg border border-gray-200" />
          )}
        </div>

        {/* URL preview (truncated) */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 break-all font-mono border border-gray-200">
          {url.length > 120 ? url.slice(0, 120) + '...' : url}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {supportsShare && (
            <button
              type="button"
              onClick={handleWebShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              Share via Device
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Opening this link loads your codes automatically - no manual paste needed.
        </p>
      </div>
    </div>
  )
}

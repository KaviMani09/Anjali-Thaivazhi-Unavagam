import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import toast from 'react-hot-toast'

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [lastResult, setLastResult] = useState('')
  const lastResultRef = useRef('')
  const [cameraError, setCameraError] = useState(null)

  useEffect(() => {
    lastResultRef.current = lastResult
  }, [lastResult])

  useEffect(() => {
    let rafId = null
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    async function setup() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(new Error('Camera API not available in this browser.'))
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // Wait for metadata before playing to reduce play() race conditions
          await new Promise((resolve) => {
            const v = videoRef.current
            if (!v) return resolve()
            const onMeta = () => {
              v.removeEventListener('loadedmetadata', onMeta)
              resolve()
            }
            v.addEventListener('loadedmetadata', onMeta)
          })
          try {
            await videoRef.current.play()
          } catch (err) {
            // Ignore benign "play interrupted by a new load request" warnings
            const msg = String(err?.message || '')
            if (msg.includes('The play() request was interrupted by a new load request')) {
              // do not surface as camera error
            } else {
              setCameraError(err)
              return
            }
          }
        }
      } catch (err) {
        setCameraError(err)
        return
      }

      const scan = () => {
        if (!videoRef.current || !ctx) {
          rafId = requestAnimationFrame(scan)
          return
        }

        const video = videoRef.current
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) {
          rafId = requestAnimationFrame(scan)
          return
        }

        canvas.width = w
        canvas.height = h
        ctx.drawImage(video, 0, 0, w, h)
        const imageData = ctx.getImageData(0, 0, w, h)

        try {
          const code = jsQR(imageData.data, w, h)
          if (code && code.data && code.data !== lastResultRef.current) {
            setLastResult(code.data)
            lastResultRef.current = code.data
            onScan?.(code.data)
            toast.success('QR scanned.')
          }
        } catch {
          // ignore decode errors
        }

        rafId = requestAnimationFrame(scan)
      }

      rafId = requestAnimationFrame(scan)
    }

    setup()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [onScan])

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-amber-200 overflow-hidden bg-black/80">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          muted
          playsInline
        />
      </div>
      <div className="text-xs text-gray-600">
        Allow camera access and hold the customer&apos;s payment QR code steadily within the frame.
      </div>
      {lastResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-gray-800 break-all">
          <div className="font-semibold text-gray-900 mb-1">Last scanned value</div>
          {lastResult}
        </div>
      )}
      {cameraError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          Unable to access camera: {cameraError.message || 'check browser permissions.'}
        </div>
      )}
    </div>
  )
}



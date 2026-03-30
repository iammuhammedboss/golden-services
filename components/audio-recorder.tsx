'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onRecorded: (url: string) => void
  disabled?: boolean
}

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })

      chunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        await uploadAudio(blob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied. Please enable microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const uploadAudio = async (blob: Blob) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, `voice-note-${Date.now()}.webm`)
      formData.append('upload_preset', 'golden_services')
      formData.append('resource_type', 'auto')

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
      )

      if (res.ok) {
        const data = await res.json()
        onRecorded(data.secure_url)
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Failed to upload audio:', error)
    } finally {
      setUploading(false)
      setDuration(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Uploading...</span>
      </div>
    )
  }

  if (recording) {
    return (
      <button
        onClick={stopRecording}
        className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-white shadow-lg animate-pulse"
      >
        <div className="h-3 w-3 rounded-full bg-white" />
        <span className="text-sm font-medium">{formatDuration(duration)}</span>
        <span className="text-xs">Tap to stop</span>
      </button>
    )
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:opacity-50"
      title="Record voice note"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  )
}

interface AudioPlayerProps {
  url: string
  onRemove?: () => void
}

export function AudioPlayer({ url, onRemove }: AudioPlayerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-accent p-2">
      <audio controls src={url} className="h-8 flex-1" style={{ minWidth: 0 }} />
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

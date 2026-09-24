import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'

export const AdminErrorContext = createContext<(status: number) => void>(() => {})
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fields = error.errors.map(item => item.message || item.reason).filter(Boolean).join(' · ')
    return [error.message, fields].filter(Boolean).join(' — ')
  }
  return error instanceof Error ? error.message : '요청을 처리하지 못했어요. 다시 시도해 주세요.'
}

export function useAdminResource<T>(load: () => Promise<T>) {
  const onAccessError = useContext(AdminErrorContext)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sequence = useRef(0)
  const refresh = useCallback(async () => {
    const id = ++sequence.current
    setLoading(true)
    setError('')
    try {
      const value = await load()
      if (id === sequence.current) setData(value)
    } catch (reason) {
      if (id !== sequence.current) return
      setError(errorMessage(reason))
      if (reason instanceof ApiError && [401, 403].includes(reason.status)) onAccessError(reason.status)
    } finally {
      if (id === sequence.current) setLoading(false)
    }
  }, [load, onAccessError])
  const cancel = useCallback(() => { sequence.current++ }, [])
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => { if (active) void refresh() })
    return () => { active = false; cancel() }
  }, [refresh, cancel])
  return { data, loading, error, refresh }
}

export function useAdminAction() {
  const onAccessError = useContext(AdminErrorContext)
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const run = async (action: () => Promise<void>, message: string) => {
    if (locked.current) return false
    locked.current = true
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(message)
      return true
    } catch (reason) {
      setError(errorMessage(reason))
      if (reason instanceof ApiError && [401, 403].includes(reason.status)) onAccessError(reason.status)
      return false
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return { busy, error, success, run }
}

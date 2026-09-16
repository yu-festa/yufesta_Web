import { useEffect, useRef, useState } from 'react'
import { watchCurrentLocation } from '../utils/location'
import type { LocationState } from '../utils/location'

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationState>({ status: 'idle', position: null, message: '' })
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => () => stopRef.current?.(), [])

  function requestLocation() {
    stopRef.current?.()
    stopRef.current = watchCurrentLocation(navigator.geolocation, window.isSecureContext, setLocation)
  }

  return { location, requestLocation }
}

import { useEffect, useState } from "react"
import type { CallRecord } from "@/types"

const API_URL = "https://69b30b45e224ec066bdb55a0.mockapi.io/api/v1/cdr"

export function useCalls() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setCalls)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { calls, loading, error }
}
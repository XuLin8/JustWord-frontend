import { useRef } from 'react'

export const useAlert = () => {
  const lastAlertTime = useRef(0)

  const showAlert = (message: string) => {
    const now = Date.now()
    if (now - lastAlertTime.current > 500) {
      alert(message)
      lastAlertTime.current = now
    }
  }

  return { showAlert }
}
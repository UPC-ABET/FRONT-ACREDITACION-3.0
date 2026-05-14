import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuthGuard(enabled = true) {
    const router = useRouter()
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        if (!enabled) {
            setChecking(false)
            return
        }
        const token = localStorage.getItem('bearerToken')
        if (!token) {
            setChecking(true)
            router.replace('/auth/login')
        } else {
            setChecking(false)
        }
    }, [enabled, router])

    return checking
}

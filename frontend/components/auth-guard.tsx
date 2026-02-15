"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { checkNGOCookieThunk } from "@/lib/redux/slices/ngo-auth-slice"
import { AuthModal } from "./auth-modal"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const dispatch = useDispatch<AppDispatch>()

  const walletState = useSelector((state: RootState) => state.wallet)
  const ngoAuth = useSelector((state: RootState) => state.ngoAuth)

  useEffect(() => {
    setMounted(true)
    // Check for existing NGO authentication on mount
    dispatch(checkNGOCookieThunk())
  }, [dispatch])

  if (!mounted) {
    return <>{children}</>
  }

  // Don't force auth modal - let users browse freely
  // Auth modal will be shown when they try to donate or create tasks
  return <>{children}</>
}

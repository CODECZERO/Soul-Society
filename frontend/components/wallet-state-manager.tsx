"use client"

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/lib/redux/store'
import { restoreWalletState } from '@/lib/redux/slices/wallet-slice'
import { checkNGOCookieThunk } from '@/lib/redux/slices/ngo-auth-slice'

/**
 * Component to restore wallet and auth state from localStorage/cookies on app load
 * This ensures state persists across page refreshes
 */
export function WalletStateManager() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Restore wallet connection from localStorage
    dispatch(restoreWalletState())
    
    // Restore NGO authentication from cookies
    dispatch(checkNGOCookieThunk())
    
    console.log('State restoration complete')
  }, [dispatch])

  // This component doesn't render anything
  return null
}

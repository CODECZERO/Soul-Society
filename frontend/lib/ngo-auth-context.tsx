"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { type NGOProfile } from "./redux/slices/ngo-auth-slice"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { loginNGO, signupNGO, logoutNGO, checkNGOCookieThunk } from "@/lib/redux/slices/ngo-auth-slice"


interface NGOAuthContextType {
  isAuthenticated: boolean
  ngoProfile: NGOProfile | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (ngoData: Omit<NGOProfile, "id" | "createdAt"> & { password: string; phoneNo: string }) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

const NGOAuthContext = createContext<NGOAuthContextType | undefined>(undefined)

export function NGOAuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, ngoProfile, isLoading, error } = useSelector((state: RootState) => state.ngoAuth)

  useEffect(() => {
    // Check for existing NGO session on mount
    dispatch(checkNGOCookieThunk())
  }, [dispatch])

  const login = async (email: string, password: string) => {
    const result = await dispatch(loginNGO({ email, password }))
    if (loginNGO.rejected.match(result)) {
      throw new Error(result.payload as string)
    }
  }

  const signup = async (ngoData: Omit<NGOProfile, "id" | "createdAt"> & { password: string; phoneNo: string }) => {
    const result = await dispatch(signupNGO(ngoData))
    if (signupNGO.rejected.match(result)) {
      throw new Error(result.payload as string)
    }
  }

  const logout = () => {
    dispatch(logoutNGO())
  }

  const checkAuth = () => {
    dispatch(checkNGOCookieThunk())
  }

  return (
    <NGOAuthContext.Provider
      value={{
        isAuthenticated,
        ngoProfile,
        isLoading,
        error,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </NGOAuthContext.Provider>
  )
}

export function useNGOAuth() {
  const context = useContext(NGOAuthContext)
  if (!context) {
    throw new Error("useNGOAuth must be used within NGOAuthProvider")
  }
  return context
}

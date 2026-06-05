"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { API_BASE_URL } from "@/lib/api"
import { parseUserFromApi, type ProfileUpdatePayload } from "@/lib/user-api"

export interface Address {
  id: string
  name: string
  street: string
  street_number: string
  postal_code: string
  district: string
  city: string
  state: string
  country: string
  address_details?: string
  latitude?: string
  longitude?: string
  is_default_address: boolean
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  accessToken?: string
  address?: Address
}

interface UserContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("Loaded user from localStorage:", parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login API response:", data)

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      const userDataFromAPI = data.data?.user

      if (!userDataFromAPI) {
        throw new Error("Invalid response: user data not found")
      }

      const userData = parseUserFromApi(
        userDataFromAPI,
        data.data?.access_token || "",
      )

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      console.log("User saved to localStorage")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const persistUser = useCallback((userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }, [])

  const refreshUser = useCallback(async () => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      throw new Error("Usuário não autenticado")
    }

    const parsed = JSON.parse(storedUser) as User
    if (!parsed.accessToken) {
      throw new Error("Usuário não autenticado")
    }

    const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
      headers: {
        Authorization: `Bearer ${parsed.accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Não foi possível carregar o perfil")
    }

    const userData = parseUserFromApi(data.data, parsed.accessToken)
    persistUser(userData)
  }, [persistUser])

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        throw new Error("Usuário não autenticado")
      }

      const parsed = JSON.parse(storedUser) as User
      if (!parsed.accessToken) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsed.accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível atualizar o perfil")
      }

      const userData = parseUserFromApi(data.data, parsed.accessToken)
      persistUser(userData)
    },
    [persistUser],
  )

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}


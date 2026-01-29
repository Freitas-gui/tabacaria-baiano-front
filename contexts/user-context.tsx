"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { API_BASE_URL } from "@/lib/api"

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
      
      const userData: User = {
        id: userDataFromAPI.id || "",
        name: userDataFromAPI.name || "",
        email: userDataFromAPI.email || email,
        phone: userDataFromAPI.phone || "",
        accessToken: data.data?.access_token || "",
        address: userDataFromAPI.address ? {
          id: userDataFromAPI.address.id || "",
          name: userDataFromAPI.address.name || "",
          street: userDataFromAPI.address.street || "",
          street_number: userDataFromAPI.address.street_number || "",
          postal_code: userDataFromAPI.address.postal_code || "",
          district: userDataFromAPI.address.district || "",
          city: userDataFromAPI.address.city || "",
          state: userDataFromAPI.address.state || "",
          country: userDataFromAPI.address.country || "",
          address_details: userDataFromAPI.address.address_details,
          latitude: userDataFromAPI.address.latitude,
          longitude: userDataFromAPI.address.longitude,
          is_default_address: userDataFromAPI.address.is_default_address || false,
        } : undefined,
      }

      console.log("Parsed user data:", userData)
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

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
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


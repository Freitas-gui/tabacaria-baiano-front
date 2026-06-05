"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { resolveCdnUrl } from "@/lib/cdn"

interface CartItem {
  id: string
  name: string
  price: string
  image: string
  quantity: number
  pharmacyProductId?: string | null
  pharmacyName?: string | null
  stock?: number | null
  variationOptionId?: string | null
  variationOptionName?: string | null
  variationTypeName?: string | null
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  getTotalItems: () => number
  getTotalPrice: () => number
  clearCart: () => void
}

export type { CartItem }

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "cartItems"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart)
        setItems(parsedCart)
      } catch (error) {
        console.error("Error parsing cart data:", error)
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isInitialized])

  const isSameVariation = (
    itemOptionId: string | null | undefined,
    itemOptionName: string | null | undefined,
    newOptionId: string | null | undefined,
    newOptionName: string | null | undefined,
  ): boolean => {
    if (itemOptionId && newOptionId) return itemOptionId === newOptionId
    if (itemOptionName && newOptionName) return itemOptionName === newOptionName
    const itemHas = !!(itemOptionId || itemOptionName)
    const newHas = !!(newOptionId || newOptionName)
    if (!itemHas && !newHas) return true
    return false
  }

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const itemWithValidImage = {
        ...newItem,
        image:
          resolveCdnUrl(newItem.image) ||
          "/placeholder.svg?height=200&width=200",
        quantity: 1,
      }

      const baseProductId = newItem.id.split("-").slice(0, -1).join("-")

      const existingItemIndex = currentItems.findIndex((item) => {
        const sameVariation = isSameVariation(
          item.variationOptionId,
          item.variationOptionName,
          newItem.variationOptionId,
          newItem.variationOptionName,
        )
        if (newItem.pharmacyProductId && item.pharmacyProductId) {
          return item.pharmacyProductId === newItem.pharmacyProductId && sameVariation
        }
        const itemBaseProductId = item.id.split("-").slice(0, -1).join("-")
        return itemBaseProductId === baseProductId && sameVariation
      })

      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems]
        const existingItem = updatedItems[existingItemIndex]
        const newQuantity = existingItem.quantity + 1
        
        const stockToCheck = newItem.stock !== undefined && newItem.stock !== null 
          ? newItem.stock 
          : existingItem.stock;
        
        if (stockToCheck !== null && stockToCheck !== undefined && newQuantity > stockToCheck) {
          return currentItems
        }
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          stock: newItem.stock !== undefined && newItem.stock !== null ? newItem.stock : existingItem.stock,
          variationOptionId: newItem.variationOptionId ?? existingItem.variationOptionId,
          variationOptionName: newItem.variationOptionName ?? existingItem.variationOptionName,
          variationTypeName: newItem.variationTypeName ?? existingItem.variationTypeName,
        }
        return updatedItems
      }

      return [...currentItems, itemWithValidImage]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.id === id) {
          if (item.stock !== null && item.stock !== undefined && quantity > item.stock) {
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    })
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = Number.parseFloat(item.price.replace(",", "."))
      return total + price * item.quantity
    }, 0)
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalItems,
        getTotalPrice,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

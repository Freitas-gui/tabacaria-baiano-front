"use client"

import { useCart } from "@/contexts/cart-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CartDebug() {
  const { items } = useCart()

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card className="mt-4 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm text-blue-600">Cart Debug (Development Only)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs">
          <p className="mb-2">Total items in cart: {items.length}</p>
          {items.map((item, index) => (
            <div key={item.id} className="mb-2 p-2 bg-gray-50 rounded">
              <p>
                <strong>Item {index + 1}:</strong>
              </p>
              <p>ID: {item.id}</p>
              <p>Name: {item.name}</p>
              <p>Price: R$ {item.price}</p>
              <p>Quantity: {item.quantity}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

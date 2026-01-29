"use client";

import type React from "react";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function CheckoutForm() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } =
    useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    paymentMethod: "credit",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Show modal alert with the success message
    if (typeof window !== "undefined") {
      const modal = document.createElement("dialog");
      modal.style.padding = "2rem";
      modal.style.borderRadius = "8px";
      modal.innerHTML = `
      <div style="text-align:center;">
        <h2 style="color:#16a34a; font-size:1.5rem; margin-bottom:1rem;">Pedido realizado com sucesso!</h2>
        <p style="margin-bottom:1rem;">${items.length} produtos foram comprados.<br>Você receberá um email de confirmação.</p>
        <button id="close-modal" style="background:#16a34a; color:white; padding:0.5rem 1.5rem; border:none; border-radius:4px; font-size:1rem; cursor:pointer;">OK</button>
      </div>
      `;
      document.body.appendChild(modal);
      // @ts-ignore
      modal.showModal();
      modal.querySelector("#close-modal")?.addEventListener("click", () => {
        // @ts-ignore
        modal.close();
        modal.remove();
      });
    }
    clearCart();
    router.push("/pedidos");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-theme-primary mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-gray-600 mb-8">
            Adicione alguns produtos para continuar com a compra.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="btn-theme-primary"
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-theme-primary mb-8">
        Finalizar Compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Cart Items */}
        <div>
          <Card>
            <CardHeader className="">
              <CardTitle className="text-theme-primary">
                Seus Produtos ({items.length} itens)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 border rounded"
                  >
                    <div className="text-xs text-gray-500 w-8">
                      #{index + 1}
                    </div>

                    <Image
                      src={item.image || "/placeholder.svg?height=80&width=80"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg?height=80&width=80";
                      }}
                    />

                    <div className="flex-1">
                      <h3 className="font-medium text-theme-primary text-sm">
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-theme-primary">
                        R$ {item.price}
                      </p>
                      <p className="text-sm text-theme-secondary">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-theme-secondary">
                        Subtotal: R${" "}
                        {(
                          Number.parseFloat(item.price.replace(",", ".")) *
                          item.quantity
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                      </p>
                      <p className="text-xs text-gray-400">ID: {item.id}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="text-theme-secondary hover:bg-theme-primary"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="text-theme-secondary hover:bg-theme-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-theme-primary">Total:</span>
                <span className="text-theme-primary">
                  R$ {getTotalPrice().toFixed(2).replace(".", ",")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div>
          <Card>
            <CardHeader className="bg-theme-primary">
              <CardTitle className="text-theme-primary">
                Dados de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Nome Completo *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Seu nome completo"
                    className="focus:border-theme-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="seu@email.com"
                    className="focus:border-theme-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Telefone *
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="(11) 99999-9999"
                    className="focus:border-theme-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Endereço *
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Rua, número, complemento"
                    className="focus:border-theme-secondary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">
                      Cidade *
                    </label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="Sua cidade"
                      className="focus:border-theme-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-primary mb-1">
                      CEP *
                    </label>
                    <Input
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      placeholder="00000-000"
                      className="focus:border-theme-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">
                    Forma de Pagamento *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-secondary focus:border-theme-secondary"
                    required
                  >
                    <option value="credit">Cartão de Crédito</option>
                    <option value="debit">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto Bancário</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-theme-primary py-3 text-lg"
                >
                  {isSubmitting
                    ? "Processando..."
                    : `Finalizar Compra - R$ ${getTotalPrice()
                        .toFixed(2)
                        .replace(".", ",")} (${items.length} produtos)`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

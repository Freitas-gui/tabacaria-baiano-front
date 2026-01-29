"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Calendar,
  MapPin,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status:
    | "Entregue"
    | "Saiu para entrega"
    | "Preparando"
    | "Confirmado"
    | "Cancelado";
  items: OrderItem[];
  total: string;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDelivery?: string;
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "CF-2024-001",
    date: "2024-01-15",
    status: "Entregue",
    items: [
      {
        id: "1",
        name: "Paracetamol 500mg 20 Comprimidos",
        price: "8,90",
        quantity: 2,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "2",
        name: "Ibuprofeno 600mg 10 Comprimidos",
        price: "15,90",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
    ],
    total: "33,70",
    deliveryAddress: "Rua das Flores, 123 - Centro, São Paulo - SP",
    paymentMethod: "Cartão de Crédito",
  },
  {
    id: "2",
    orderNumber: "CF-2024-002",
    date: "2024-01-20",
    status: "Saiu para entrega",
    items: [
      {
        id: "3",
        name: "Creme para Pentear Elseve Liso dos Sonhos 250ml",
        price: "17,94",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "4",
        name: "Protetor Solar La Roche Posay FPS 60",
        price: "89,90",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
    ],
    total: "107,84",
    deliveryAddress: "Av. Paulista, 456 - Bela Vista, São Paulo - SP",
    paymentMethod: "PIX",
    estimatedDelivery: "Hoje até 18:00",
  },
  {
    id: "3",
    orderNumber: "CF-2024-003",
    date: "2024-01-22",
    status: "Preparando",
    items: [
      {
        id: "5",
        name: "Whey Protein 900g",
        price: "89,90",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "6",
        name: "Óleo de Coco Extra Virgem 500ml",
        price: "25,90",
        quantity: 2,
        image: "/placeholder.svg?height=80&width=80",
      },
    ],
    total: "141,70",
    deliveryAddress: "Rua Augusta, 789 - Consolação, São Paulo - SP",
    paymentMethod: "Cartão de Débito",
    estimatedDelivery: "Amanhã até 16:00",
  },
  {
    id: "4",
    orderNumber: "CF-2024-004",
    date: "2024-01-10",
    status: "Confirmado",
    items: [
      {
        id: "7",
        name: "Glicosímetro Accu-Chek Active",
        price: "45,90",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "8",
        name: "Tiras Reagentes Glicemia 50un",
        price: "89,90",
        quantity: 1,
        image: "/placeholder.svg?height=80&width=80",
      },
    ],
    total: "135,80",
    deliveryAddress: "Rua da Consolação, 321 - República, São Paulo - SP",
    paymentMethod: "Boleto Bancário",
    estimatedDelivery: "2-3 dias úteis",
  },
];

export function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "Entregue":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Saiu para entrega":
        return <Truck className="w-4 h-4 text-blue-600" />;
      case "Preparando":
        return <Package className="w-4 h-4 text-orange-600" />;
      case "Confirmado":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Cancelado":
        return <Clock className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Entregue":
        return "bg-green-100 text-green-800 border-green-200";
      case "Saiu para entrega":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Preparando":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Confirmado":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (selectedOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedOrder(null)}
            className="mb-4"
          >
            ← Voltar aos Pedidos
          </Button>
          <h1 className="text-3xl font-bold text-theme-primary">
            Detalhes do Pedido
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="bg-theme-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-theme-primary">
                      Pedido {selectedOrder.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-theme-secondary mt-1">
                      Realizado em {formatDate(selectedOrder.date)}
                    </p>
                  </div>
                  <Badge
                    className={`${getStatusColor(selectedOrder.status)} border`}
                  >
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedOrder.status)}
                      <span>{selectedOrder.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center space-x-4">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="rounded border"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-theme-primary">
                            {item.name}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">
                              Quantidade: {item.quantity}
                            </span>
                            <span className="font-semibold text-theme-primary">
                              R$ {item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                      {index < selectedOrder.items.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-theme-primary">Total:</span>
                  <span className="text-theme-primary">
                    R$ {selectedOrder.total}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Info Sidebar */}
          <div className="space-y-6">
            {/* Delivery Status */}
            {selectedOrder.estimatedDelivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-theme-primary flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-theme-secondary" />
                      <span className="text-sm">
                        {selectedOrder.estimatedDelivery}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-theme-secondary mt-0.5" />
                      <span className="text-sm">
                        {selectedOrder.deliveryAddress}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-theme-primary flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedOrder.paymentMethod}</p>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-theme-primary">
                  Status do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className={`flex items-center space-x-3 ${
                      selectedOrder.status === "Confirmado" ||
                      selectedOrder.status === "Preparando" ||
                      selectedOrder.status === "Saiu para entrega" ||
                      selectedOrder.status === "Entregue"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedOrder.status === "Confirmado" ||
                        selectedOrder.status === "Preparando" ||
                        selectedOrder.status === "Saiu para entrega" ||
                        selectedOrder.status === "Entregue"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Pedido Confirmado</span>
                  </div>
                  <div
                    className={`flex items-center space-x-3 ${
                      selectedOrder.status === "Preparando" ||
                      selectedOrder.status === "Saiu para entrega" ||
                      selectedOrder.status === "Entregue"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedOrder.status === "Preparando" ||
                        selectedOrder.status === "Saiu para entrega" ||
                        selectedOrder.status === "Entregue"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Preparando Pedido</span>
                  </div>
                  <div
                    className={`flex items-center space-x-3 ${
                      selectedOrder.status === "Saiu para entrega" ||
                      selectedOrder.status === "Entregue"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedOrder.status === "Saiu para entrega" ||
                        selectedOrder.status === "Entregue"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Saiu para Entrega</span>
                  </div>
                  <div
                    className={`flex items-center space-x-3 ${
                      selectedOrder.status === "Entregue"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedOrder.status === "Entregue"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-sm">Entregue</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-primary mb-2">
          Meus Pedidos
        </h1>
        <p className="text-gray-600">Acompanhe o status dos seus pedidos</p>
      </div>

      {mockOrders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Você ainda não fez nenhum pedido.
            </p>
            <Button className="btn-theme-primary">Começar a Comprar</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <Card
              key={order.id}
              className="card-hover transition-shadow" // cursor-pointer"
              //onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-theme-primary">
                      Pedido {order.orderNumber}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4" />
                        <span>
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`${getStatusColor(order.status)} border mb-2`}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </div>
                    </Badge>
                    <div className="text-lg font-bold text-theme-primary">
                      R$ {order.total}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded border"
                      />
                      <div className="text-xs text-gray-600">
                        <div className="font-medium truncate max-w-[120px]">
                          {item.name}
                        </div>
                        <div>Qtd: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{order.items.length - 3}{" "}
                      {order.items.length - 3 === 1 ? "item" : "itens"}
                    </div>
                  )}
                </div>

                {order.estimatedDelivery && (
                  <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                    <Clock className="w-4 h-4" />
                    <span>Previsão de entrega: {order.estimatedDelivery}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-4 pt-4 border-t">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[400px]">
                    {order.deliveryAddress}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

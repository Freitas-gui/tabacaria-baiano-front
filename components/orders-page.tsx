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
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { API_BASE_URL } from "@/lib/api";
import { PixPaymentPanel } from "@/components/pix-payment-panel";
import type { PixPaymentPayload } from "@/lib/pix-payment";
import {
  buildPixPaymentPayload,
  clearStoredPixPaymentForOrder,
  isAwaitingPixPayment,
  readStoredPixPaymentForOrder,
} from "@/lib/pix-payment";

interface VariationOption {
  typeName: string;
  optionName: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image: string;
  pharmacyName?: string | null;
  variationOption?: VariationOption | null;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status:
    | "Entregue"
    | "Saiu para entrega"
    | "Preparando"
    | "Aguardando Confirmação"
    | "Confirmado"
    | "Cancelado";
  items: OrderItem[];
  total: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus?: string | null;
  paymentProvider?: string | null;
  pixPayment?: PixPaymentPayload | null;
  estimatedDelivery?: string;
}

function mapApiOrder(order: any): Order {
  const items: OrderItem[] =
    order.products?.map((product: any) => ({
      id: product.id || product.product?.id || "",
      name: product.product?.name || "Produto",
      price: product.price || "0",
      quantity: product.amount || 0,
      image:
        product.product?.images?.[0] ||
        "/placeholder.svg?height=80&width=80",
      pharmacyName: product.pharmacy?.name || order.pharmacy?.name || null,
      variationOption: product.variationOption
        ? {
            typeName: product.variationOption.typeName,
            optionName: product.variationOption.optionName,
          }
        : null,
    })) || [];

  const address = order.address;
  const deliveryAddress = address
    ? `${address.street}, ${address.street_number} - ${address.district}, ${address.city} - ${address.state}`
    : "Endereço não disponível";

  const paymentMap: Record<string, string> = {
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    pix: "PIX",
    cash: "Dinheiro",
    credit: "Cartão de Crédito",
    debit: "Cartão de Débito",
    dinheiro: "Dinheiro",
    boleto: "Boleto Bancário",
  };

  const pixPayment = isAwaitingPixPayment(order)
    ? buildPixPaymentPayload(order)
    : null;

  return {
    id: order.id,
    orderNumber: order.code,
    date: order.created_at,
    status: mapStatus(order.status_label || order.status),
    items,
    total: order.total || "0",
    deliveryAddress,
    paymentMethod: paymentMap[order.payment_method] || order.payment_method,
    paymentStatus: order.payment_status ?? null,
    paymentProvider: order.payment_provider ?? null,
    pixPayment,
  };
}

function mapStatus(status: string): Order["status"] {
  if (!status) return "Aguardando Confirmação";

  const statusMap: Record<string, Order["status"]> = {
    Entregue: "Entregue",
    "Saiu para entrega": "Saiu para entrega",
    Preparando: "Preparando",
    "Aguardando Confirmação": "Aguardando Confirmação",
    Confirmado: "Confirmado",
    Cancelado: "Cancelado",
    delivered: "Entregue",
    in_transit: "Saiu para entrega",
    preparing: "Preparando",
    waiting_confirmation: "Aguardando Confirmação",
    canceled: "Cancelado",
  };
  return statusMap[status] || "Aguardando Confirmação";
}

function getPaymentStatusLabel(status?: string | null): string | null {
  if (!status) return null;
  const labels: Record<string, string> = {
    pending: "Aguardando pagamento PIX",
    paid: "PIX pago",
    expired: "PIX expirado",
    cancelled: "PIX cancelado",
    failed: "Pagamento falhou",
    refunded: "Reembolsado",
  };
  return labels[status] || status;
}

export function OrdersPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user || !user.accessToken) {
      setLoading(false);
      setError("Usuário não autenticado");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/customer/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar pedidos");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data.map((order: any) => mapApiOrder(order)));
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Erro ao carregar os pedidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const fetchOrderDetails = useCallback(async (orderId: string, silent = false) => {
    if (!user || !user.accessToken) {
      if (!silent) {
        alert("Usuário não autenticado");
      }
      return;
    }

    if (!silent) {
      setLoadingOrderDetails(true);
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/customer/orders/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes do pedido");
      }

      const data = await response.json();

      if (data.success && data.data) {
        const mappedOrder = mapApiOrder(data.data);
        const storedPixPayment = readStoredPixPaymentForOrder(orderId);

        if (!mappedOrder.pixPayment && storedPixPayment) {
          mappedOrder.pixPayment = storedPixPayment;
        }

        if (
          mappedOrder.paymentStatus &&
          ["paid", "expired", "cancelled", "canceled", "failed", "refunded"].includes(
            mappedOrder.paymentStatus,
          )
        ) {
          clearStoredPixPaymentForOrder(orderId);
        }

        setSelectedOrder(mappedOrder);
      }
    } catch (err) {
      console.error("Error loading order details:", err);
      alert("Erro ao carregar detalhes do pedido. Tente novamente.");
    } finally {
      if (!silent) {
        setLoadingOrderDetails(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!orderIdFromUrl || !user?.accessToken) {
      return;
    }
    fetchOrderDetails(orderIdFromUrl);
  }, [orderIdFromUrl, user?.accessToken, fetchOrderDetails]);

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    router.replace("/pedidos");
  };

  useEffect(() => {
    if (
      !selectedOrder ||
      !selectedOrder.pixPayment ||
      !user?.accessToken
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchOrderDetails(selectedOrder.id, true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [
    selectedOrder?.id,
    selectedOrder?.pixPayment,
    user?.accessToken,
    fetchOrderDetails,
  ]);

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "Entregue":
        return <CheckCircle className="w-4 h-4 text-emerald-700" />;
      case "Saiu para entrega":
        return <Truck className="w-4 h-4 text-amber-700" />;
      case "Preparando":
        return <Package className="w-4 h-4 text-[#A47148]" />;
      case "Aguardando Confirmação":
        return <Clock className="w-4 h-4 text-amber-800/90" />;
      case "Confirmado":
        return <CheckCircle className="w-4 h-4 text-sky-800" />;
      case "Cancelado":
        return <Clock className="w-4 h-4 text-red-700" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Entregue":
        return "bg-emerald-50 text-emerald-900 border-emerald-200";
      case "Saiu para entrega":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "Preparando":
        return "bg-orange-50 text-orange-900 border-orange-200";
      case "Aguardando Confirmação":
        return "bg-stone-100 text-stone-800 border-stone-200";
      case "Confirmado":
        return "bg-sky-50 text-sky-900 border-sky-200";
      case "Cancelado":
        return "bg-red-50 text-red-900 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-border";
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

  if (loadingOrderDetails && !selectedOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">
            Carregando detalhes do pedido...
          </p>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Button
              variant="outline"
              onClick={handleBackToOrders}
              className="text-xs sm:text-sm"
            >
              ← Voltar aos Pedidos
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="text-xs sm:text-sm"
            >
              Produtos
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">
            Detalhes do Pedido
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <Card className="card-static mb-6">
              <CardHeader className="bg-muted/60 border-b border-border">
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
                        <div className="flex-shrink-0 aspect-square bg-muted rounded overflow-hidden border border-border">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-contain p-1"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-theme-primary">
                            {item.name}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                Quantidade: {item.quantity}
                              </span>
                              {item.pharmacyName && (
                                <span className="text-xs sm:text-sm text-theme-secondary mt-1">
                                  Loja: {item.pharmacyName}
                                </span>
                              )}
                              {item.variationOption && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full border border-border bg-muted text-theme-primary w-fit">
                                  {item.variationOption.typeName}:{" "}
                                  {item.variationOption.optionName}
                                </span>
                              )}
                            </div>
                            <span className="price text-base">
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

                <div className="flex justify-between items-center text-xl">
                  <span className="text-theme-primary font-bold">Total:</span>
                  <span className="price text-xl">
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
              <Card className="card-static">
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
            <Card className="card-static">
              <CardHeader>
                <CardTitle className="text-theme-primary flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{selectedOrder.paymentMethod}</p>
                {getPaymentStatusLabel(selectedOrder.paymentStatus) && (
                  <Badge
                    variant="outline"
                    className={
                      selectedOrder.paymentStatus === "paid"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }
                  >
                    {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                  </Badge>
                )}
                {selectedOrder.pixPayment && (
                  <PixPaymentPanel
                    orderId={selectedOrder.id}
                    payment={selectedOrder.pixPayment}
                    totalAmountCents={Math.round(
                      parseFloat(selectedOrder.total) * 100,
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Order Address */}
            <Card className="card-static">
              <CardHeader>
                <CardTitle className="text-theme-primary flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Endereço do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-theme-secondary mt-0.5" />
                  <span className="text-sm">
                    {selectedOrder.deliveryAddress}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2">
          Meus Pedidos
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Acompanhe o status dos seus pedidos
        </p>
      </div>

      {loading ? (
        <Card className="card-static text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Carregando pedidos...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="card-static text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              Erro ao carregar pedidos
            </h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => loadOrders()} className="btn-theme-primary">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="card-static text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não fez nenhum pedido.
            </p>
            <Button className="btn-theme-primary">Começar a Comprar</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer"
              onClick={() => {
                router.push(`/pedidos?orderId=${order.id}`);
              }}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-theme-primary">
                      Pedido {order.orderNumber}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatDate(order.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex flex-col items-start sm:items-end gap-2 mb-2">
                      <Badge
                        className={`${getStatusColor(order.status)} border text-xs`}
                      >
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="text-xs">{order.status}</span>
                        </div>
                      </Badge>
                      {order.paymentStatus === "pending" && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-900 border-amber-200 text-xs"
                        >
                          Aguardando PIX
                        </Badge>
                      )}
                    </div>
                    <div className="price text-base sm:text-lg">
                      R$ {order.total}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-2 flex-shrink-0"
                    >
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded border w-8 h-8 sm:w-10 sm:h-10 object-cover"
                      />
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium truncate max-w-[100px] sm:max-w-[120px]">
                          {item.name}
                        </div>
                        <div>Qtd: {item.quantity}</div>
                        {item.variationOption && (
                          <div className="mt-0.5 text-theme-primary/70 truncate max-w-[100px] sm:max-w-[120px]">
                            {item.variationOption.optionName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs sm:text-sm text-muted-foreground/80">
                      +{order.items.length - 3}{" "}
                      {order.items.length - 3 === 1 ? "item" : "itens"}
                    </div>
                  )}
                </div>

                {order.estimatedDelivery && (
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-theme-secondary mb-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="break-words">
                      Previsão de entrega: {order.estimatedDelivery}
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-2 text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{order.deliveryAddress}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

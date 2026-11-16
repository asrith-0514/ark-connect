import { NextResponse } from "next/server";
import { MOCK_ORDERS } from "@/data/mockData";
import { Order } from "@/lib/mock/types";

// In-memory global store to persist across dev reloads and requests
declare global {
  // eslint-disable-next-line no-var
  var __ARK_ORDERS__: Order[] | undefined;
}

function getOrders(): Order[] {
  if (!globalThis.__ARK_ORDERS__) {
    globalThis.__ARK_ORDERS__ = [...MOCK_ORDERS];
  }
  return globalThis.__ARK_ORDERS__;
}

export async function GET() {
  const orders = getOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order: Order = body.order;
    if (!order || !order.id || !order.orderNumber) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const orders = getOrders();
    // Remove if already exists with same id or ARK-8902 draft
    const filtered = orders.filter(o => o.id !== order.id && o.orderNumber !== "ARK-8902");
    globalThis.__ARK_ORDERS__ = [order, ...filtered];

    return NextResponse.json({ success: true, order, orders: globalThis.__ARK_ORDERS__ });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, extra } = body;
    const orders = getOrders();

    globalThis.__ARK_ORDERS__ = orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return {
          ...o,
          status: status || o.status,
          ...(extra || {})
        };
      }
      return o;
    });

    return NextResponse.json({ success: true, orders: globalThis.__ARK_ORDERS__ });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MOCK_ORDERS } from "@/data/mockData";
import { Order } from "@/lib/mock/types";

declare global {
  // eslint-disable-next-line no-var
  var __ARK_ORDERS__: Order[] | undefined;
}

const ORDERS_FILE = path.join(process.cwd(), "src/data/submitted_orders.json");

function readSubmittedFromDisk(): Order[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading submitted orders from disk:", err);
  }
  return [];
}

function writeSubmittedToDisk(orders: Order[]): void {
  try {
    const dir = path.dirname(ORDERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing submitted orders to disk:", err);
  }
}

function getOrders(): Order[] {
  const diskOrders = readSubmittedFromDisk();
  const diskIds = new Set(diskOrders.map(o => o.id));
  const diskNumbers = new Set(diskOrders.map(o => o.orderNumber));

  // Merge submitted orders with base mock orders (excluding ARK-8902 draft from distributor view)
  const baseMock = MOCK_ORDERS.filter(
    o => !diskIds.has(o.id) && !diskNumbers.has(o.orderNumber) && o.orderNumber !== "ARK-8902"
  );

  const allOrders = [...diskOrders, ...baseMock];
  globalThis.__ARK_ORDERS__ = allOrders;
  return allOrders;
}

export async function GET() {
  const orders = getOrders();
  return NextResponse.json(
    { orders },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order: Order = body.order;
    if (!order || !order.id || !order.orderNumber) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const diskOrders = readSubmittedFromDisk();
    const updatedDisk = [order, ...diskOrders.filter(o => o.id !== order.id && o.orderNumber !== order.orderNumber)];
    writeSubmittedToDisk(updatedDisk);

    const allOrders = getOrders();
    return NextResponse.json(
      { success: true, order, orders: allOrders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, extra } = body;

    const diskOrders = readSubmittedFromDisk();
    let foundOnDisk = false;
    const updatedDisk = diskOrders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        foundOnDisk = true;
        return {
          ...o,
          status: status || o.status,
          ...(extra || {}),
        };
      }
      return o;
    });

    if (!foundOnDisk) {
      // Find in base mock and add to disk overrides
      const target = MOCK_ORDERS.find(o => o.id === orderId || o.orderNumber === orderId);
      if (target) {
        updatedDisk.push({
          ...target,
          status: status || target.status,
          ...(extra || {}),
        });
      }
    }

    writeSubmittedToDisk(updatedDisk);
    const allOrders = getOrders();

    return NextResponse.json(
      { success: true, orders: allOrders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

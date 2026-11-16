import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ClientApp } from "@/components/ClientApp";
import { decodeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/adapter";
import { getRolePermissions } from "@/lib/auth/permissions";

async function HomeContent(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const searchParams = await props.searchParams;

  const isDemo = searchParams?.demo === "true" || searchParams?.demo === "1" || true;

  // Check secure HTTP cookie session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let sessionUser = sessionCookie ? decodeSessionToken(sessionCookie) : null;

  const modeRaw = searchParams?.mode || searchParams?.role || searchParams?.portal;
  const modeParam = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
  const isExplicitAuth = searchParams?.auth === "true";

  // When demo mode is active or mode is provided, automatically instantiate demo session
  if (!sessionUser && !isExplicitAuth) {
    if (modeParam === "distributor" || modeParam === "wholesaler" || modeParam === "admin" || searchParams?.view === "dashboard") {
      sessionUser = {
        id: "staff-1",
        type: "distributor",
        name: "A. Ramakrishna",
        email: "owner@arkconnect.in",
        phone: "+91 98480 12345",
        distributorRole: "owner",
        roleTitle: "Proprietor / Managing Director",
        permissions: getRolePermissions("owner"),
        sessionExpiry: 9999999999999,
      };
    } else {
      sessionUser = {
        id: "ret-1",
        type: "retailer",
        name: "Sri Laxmi Narasimha Textiles",
        phone: "+91 94401 23456",
        retailerId: "ret-1",
        retailerCode: "RET-0001",
        roleTitle: "Retail Store Owner",
        permissions: getRolePermissions("retailer"),
        sessionExpiry: 9999999999999,
      };
    }
  }

  let initialMode: "retailer" | "distributor" | "auth" = "auth";

  if (sessionUser) {
    initialMode = sessionUser.type === "distributor" ? "distributor" : "retailer";
  } else if (isExplicitAuth) {
    initialMode = "auth";
  } else if (isDemo) {
    initialMode =
      modeParam === "distributor" || modeParam === "wholesaler" || modeParam === "admin"
        ? ("distributor" as const)
        : ("retailer" as const);
  } else {
    initialMode = "auth";
  }

  const rawView = searchParams?.view || searchParams?.tab;
  const rawViewParam = Array.isArray(rawView) ? rawView[0] : rawView;
  const initialDistributorNav = (() => {
    if (!rawViewParam) return "dashboard";
    const normalized = rawViewParam.trim().replace(/\s+/g, "-");
    return normalized === "products" ? "products-pricing" :
           normalized === "purchases" ? "purchase-bills" :
           normalized === "analytics" ? "reports" : normalized;
  })();

  const initialRetailerNav = (() => {
    if (!rawViewParam) return "home";
    const normalized = rawViewParam.trim().toLowerCase();
    return normalized === "shop" || normalized === "catalog" || normalized === "products" ? "catalogue" :
           normalized === "orders" || normalized === "order" ? "orders" :
           normalized === "dues" || normalized === "ledger" || normalized === "payments" ? "dues" :
           normalized === "account" || normalized === "profile" ? "account" : "home";
  })();

  return (
    <ClientApp
      initialMode={initialMode}
      initialDistributorNav={initialDistributorNav}
      initialRetailerNav={initialRetailerNav}
      initialUser={sessionUser}
      isDemo={isDemo}
    />
  );
}

export default function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent searchParams={props.searchParams} />
    </Suspense>
  );
}

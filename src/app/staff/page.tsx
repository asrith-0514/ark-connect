import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ClientApp } from "@/components/ClientApp";
import { decodeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/adapter";
import { getRolePermissions } from "@/lib/auth/permissions";

async function StaffContent(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const searchParams = await props.searchParams;

  const isDemo = searchParams?.demo === "true" || searchParams?.demo === "1";

  // Check secure HTTP cookie session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  let sessionUser = sessionCookie ? decodeSessionToken(sessionCookie) : null;

  // On the /staff route, a retailer session is not a staff account
  if (sessionUser && sessionUser.type !== "distributor") {
    sessionUser = null;
  }

  const isExplicitAuth = searchParams?.auth === "true";
  if (isExplicitAuth) {
    sessionUser = null;
  }

  // Staff demo session is ONLY instantiated when isDemo is explicitly true
  if (!sessionUser && isDemo && !isExplicitAuth) {
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
  }

  let initialMode: "distributor" | "auth" = "auth";
  if (sessionUser) {
    initialMode = "distributor";
  } else if (isDemo && !isExplicitAuth) {
    initialMode = "distributor";
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

  return (
    <ClientApp
      initialMode={initialMode}
      defaultAuthTab="distributor"
      initialDistributorNav={initialDistributorNav}
      initialRetailerNav="home"
      initialUser={sessionUser}
      isDemo={isDemo}
    />
  );
}

export default function StaffPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <StaffContent searchParams={props.searchParams} />
    </Suspense>
  );
}

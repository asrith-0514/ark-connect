import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { ClientApp } from "@/components/ClientApp";
import { decodeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/adapter";

async function HomeContent(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const isDemo = searchParams?.demo === "true" || searchParams?.demo === "1";

  // Check secure HTTP cookie session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = sessionCookie ? decodeSessionToken(sessionCookie) : null;

  // Route guard rule:
  // "3. Session in a secure cookie via a Next.js route handler or middleware. Route guards: a retailer session can never open distributor screens, and the reverse. Remove ?mode=distributor switching outside ?demo=true."
  let initialMode: "retailer" | "distributor" | "auth" = "auth";

  if (sessionUser) {
    if (sessionUser.type === "distributor") {
      initialMode = "distributor";
    } else {
      initialMode = "retailer";
    }
  } else if (isDemo) {
    // In demo mode without a cookie session, allow mode parameter for evaluation
    const modeRaw = searchParams?.mode || searchParams?.role || searchParams?.portal;
    const modeParam = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
    initialMode =
      modeParam === "distributor" || modeParam === "wholesaler" || modeParam === "admin"
        ? ("distributor" as const)
        : ("retailer" as const);
  } else {
    // Non-demo unauthenticated user -> show auth screen
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
      initialDistributorNav={initialDistributorNav}
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

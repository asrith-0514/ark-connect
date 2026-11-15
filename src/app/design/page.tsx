"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Badge,
  StatusChip,
  Stat,
  Drawer,
  Modal,
  Tabs,
  Input,
  Skeleton,
  EmptyState,
  ThemeToggle,
  Icon,
  ArkMonogram,
  ArkWordmark,
} from "@/components/ui";

function DesignShowcase() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  // Interactive demo states
  const [activeTab, setActiveTab] = useState("all");
  const [activeUnderlineTab, setActiveUnderlineTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [counterTrigger, setCounterTrigger] = useState(1);
  const [inputValue, setInputValue] = useState("");

  if (!isDemo) {
    return (
      <main className="min-h-screen bg-background text-ink flex items-center justify-center p-6">
        <Card variant="hero" className="max-w-md w-full p-8 text-center border-border">
          <div className="w-12 h-12 rounded-sm bg-surface-raised border border-border text-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="palette" size={24} />
          </div>
          <h1 className="text-xl font-bold font-sans text-ink tracking-tight">Design Token & Primitives Preview</h1>
          <p className="text-xs text-ink-muted mt-2 leading-relaxed">
            The design system preview is restricted. Append <code className="bg-surface px-1.5 py-0.5 rounded border border-border text-xs num">?demo=true</code> to your URL to explore the brand kit, palette, and UI primitives.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/design?demo=true">
              <Button variant="primary" size="md">
                Open Preview (?demo=true)
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const sampleTabs = [
    { id: "all", label: "All Orders", count: 48 },
    { id: "review", label: "Needs Review", count: 3 },
    { id: "dispatched", label: "Dispatched", count: 12 },
    { id: "delivered", label: "Delivered", count: 33 },
  ];

  const sampleUnderlineTabs = [
    { id: "overview", label: "Overview" },
    { id: "tokens", label: "Design Tokens" },
    { id: "primitives", label: "UI Primitives" },
    { id: "icons", label: "Lucide Icons" },
  ];

  return (
    <div className="min-h-screen bg-background text-ink pb-24 transition-colors duration-150">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-soft-xs">
        <div className="flex items-center gap-3">
          <ArkWordmark product="default" size="sm" />
          <Badge variant="accent" size="sm">Premium Industrial-Tech</Badge>
          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">Dark Default</Badge>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle showLabels />
          <Link href="/?mode=distributor">
            <Button variant="secondary" size="sm">
              Back to Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent font-mono">
                B2B SaaS Brand Architecture
              </span>
            </div>
            <h2 className="font-page-title text-3xl sm:text-4xl text-ink">
              ARK Brand Kit &amp; Design Primitives
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">
              Obsidian background (<code className="text-xs font-mono num bg-surface border border-border px-1 rounded">#07090D</code>),
              Electric Blue primary (<code className="text-xs font-mono num bg-surface border border-border px-1 rounded">#2F6BFF</code>),
              Neon Cyan accent (<code className="text-xs font-mono num bg-surface border border-border px-1 rounded">#22E5FF</code>),
              hairline borders, compact density, Geist Sans, and Lucide icons.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCounterTrigger((prev) => prev + 1)}
              leftIcon={<Icon name="replay" size={15} />}
            >
              Replay Stat Count-Up
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Icon name="open_in_new" size={15} />}
            >
              Open Modal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              leftIcon={<Icon name="dock_to_right" size={15} />}
            >
              Open Drawer
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Section 0: Brand Logo, Geometric Monogram & Wordmarks */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="award" size={18} className="text-primary" />
              0. Geometric Monogram &amp; Wordmark Lockup
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Refined geometric apex &amp; crossbar SVG vector with Electric Blue to Neon Cyan gradient. Works crisp at 24px and 64px, with mono variant and lockups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monogram Sizes & Gradient */}
            <Card variant="default" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono block mb-3">
                  Geometric Monogram (Scale)
                </span>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex flex-col items-center gap-1">
                    <ArkMonogram size={24} variant="gradient" />
                    <span className="text-[10px] font-mono text-ink-muted num">24px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArkMonogram size={32} variant="gradient" />
                    <span className="text-[10px] font-mono text-ink-muted num">32px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArkMonogram size={48} variant="gradient" />
                    <span className="text-[10px] font-mono text-ink-muted num">48px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArkMonogram size={64} variant="gradient" />
                    <span className="text-[10px] font-mono text-ink-muted num">64px</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted mt-2 border-t border-border pt-2">
                Electric Blue (#2F6BFF) to Neon Cyan (#22E5FF) linear gradient.
              </p>
            </Card>

            {/* Mono Variant */}
            <Card variant="default" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono block mb-3">
                  Mono Variant (Single Color)
                </span>
                <div className="flex items-center gap-4 py-2">
                  <div className="text-ink flex flex-col items-center gap-1">
                    <ArkMonogram size={32} variant="mono" />
                    <span className="text-[10px] font-mono text-ink-muted">Text Color</span>
                  </div>
                  <div className="text-primary flex flex-col items-center gap-1">
                    <ArkMonogram size={32} variant="mono" />
                    <span className="text-[10px] font-mono text-ink-muted">Primary</span>
                  </div>
                  <div className="text-accent flex flex-col items-center gap-1">
                    <ArkMonogram size={32} variant="mono" />
                    <span className="text-[10px] font-mono text-ink-muted">Cyan</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted mt-2 border-t border-border pt-2">
                Adapts to <code className="font-mono text-xs num">currentColor</code> in single-color contexts.
              </p>
            </Card>

            {/* Wordmark Lockups with Tagline */}
            <Card variant="default" className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted font-mono block mb-3">
                  Product Lockups &amp; Tagline
                </span>
                <div className="space-y-3 py-1">
                  <ArkWordmark product="Connect" size="md" />
                  <ArkWordmark product="Backoffice" size="md" />
                  <ArkWordmark product="Connect" size="sm" withTagline />
                </div>
              </div>
              <p className="text-[11px] text-ink-muted mt-2 border-t border-border pt-2">
                Tagline <em>"Wholesale, Connected."</em> appears on login and splash only.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 1: Semantic Color Tokens */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="palette" size={18} className="text-primary" />
              1. Semantic Color Tokens (Dark Default + Light Toggle)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              1px hairline borders, dark elevation, WCAG AA contrast.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { name: "Background (Obsidian)", token: "bg-background", border: "border-border", text: "text-ink", hex: "#07090D" },
              { name: "Surface", token: "bg-surface", border: "border-border", text: "text-ink", hex: "#0D1117" },
              { name: "Surface Raised", token: "bg-surface-raised", border: "border-border-strong", text: "text-ink", hex: "#121823" },
              { name: "Hairline Border", token: "bg-border", border: "border-border-strong", text: "text-ink", hex: "#1E2633" },
              { name: "Border Strong", token: "bg-border-strong", border: "border-border-strong", text: "text-ink", hex: "#2A3547" },
              { name: "Ink (Text)", token: "bg-ink", border: "border-transparent", text: "text-background", hex: "#E8ECF3" },
              { name: "Ink Muted", token: "bg-ink-muted", border: "border-transparent", text: "text-background", hex: "#8B97AB" },
              { name: "Ink Faint", token: "bg-ink-faint", border: "border-transparent", text: "text-background", hex: "#5B677A" },
              { name: "Primary (Electric Blue)", token: "bg-primary", border: "border-transparent", text: "text-white", hex: "#2F6BFF" },
              { name: "Accent (Neon Cyan)", token: "bg-accent", border: "border-transparent", text: "text-background", hex: "#22E5FF" },
              { name: "Success", token: "bg-success", border: "border-transparent", text: "text-background", hex: "#2FD08A" },
              { name: "Warning", token: "bg-warning", border: "border-transparent", text: "text-background", hex: "#F5B73B" },
              { name: "Danger", token: "bg-danger", border: "border-transparent", text: "text-white", hex: "#FF5C6C" },
              { name: "Light Theme BG", token: "bg-[#F5F7FA]", border: "border-border", text: "text-[#0B1220]", hex: "#F5F7FA" },
            ].map((c) => (
              <div
                key={c.name}
                className="bg-surface border border-border rounded-sm p-2.5 shadow-soft-xs flex flex-col justify-between"
              >
                <div
                  className={`h-10 w-full rounded-xs ${c.token} border ${c.border} flex items-center justify-center font-bold text-xs ${c.text}`}
                >
                  Aa
                </div>
                <div className="mt-2">
                  <p className="text-xs font-semibold text-ink truncate">{c.name}</p>
                  <p className="text-[10px] text-ink-muted font-mono num">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Radii (6/10/14) & Cyan Focus Ring */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="sliders" size={18} className="text-primary" />
              2. Radii (6/10/14) &amp; Neon Cyan Focus Ring
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Precise 8px spacing scale, compact geometry, and 2px Neon Cyan focus ring with 2px offset.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-sm p-4 shadow-soft-xs">
              <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">sm (6px)</span>
              <h4 className="text-xs font-bold text-ink mt-1">Compact Buttons &amp; Inputs</h4>
              <p className="text-[11px] text-ink-muted mt-0.5 font-mono num">border-radius: 6px</p>
            </div>

            <div className="bg-surface border border-border rounded-md p-4 shadow-soft-sm">
              <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">md (10px)</span>
              <h4 className="text-xs font-bold text-ink mt-1">Cards &amp; Dialog Panels</h4>
              <p className="text-[11px] text-ink-muted mt-0.5 font-mono num">border-radius: 10px</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4 shadow-soft-md">
              <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider">lg (14px)</span>
              <h4 className="text-xs font-bold text-ink mt-1">Hero Banners &amp; Modals</h4>
              <p className="text-[11px] text-ink-muted mt-0.5 font-mono num">border-radius: 14px</p>
            </div>

            <div className="bg-surface border border-border rounded-sm p-4 shadow-soft-xs">
              <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-wider">Focus State</span>
              <h4 className="text-xs font-bold text-ink mt-1">Neon Cyan Focus Ring</h4>
              <button
                type="button"
                className="mt-2 w-full py-1.5 px-3 rounded-sm bg-surface-raised border border-border text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
              >
                Click or Tab to Test Focus
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Typography */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="type" size={18} className="text-primary" />
              3. Typography Hierarchy (Geist Sans &amp; Geist Mono)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Instrument Serif removed. Page titles rendered in Geist Sans (28-32px, semibold, tight tracking). Numbers and IDs in Geist Mono.
            </p>
          </div>

          <Card variant="default" className="p-5 divide-y divide-border">
            <div className="py-2.5">
              <span className="text-[10px] font-mono uppercase text-ink-muted">Page Title (Geist Sans 28-32px, Semibold, -0.025em tracking)</span>
              <h2 className="font-page-title text-ink mt-1">Wholesale Garment Distribution &amp; Mill Logistics</h2>
            </div>

            <div className="py-2.5">
              <span className="text-[10px] font-mono uppercase text-ink-muted">UI Body (Geist Sans 14px, Regular)</span>
              <p className="text-xs sm:text-sm text-ink-muted mt-0.5 leading-relaxed">
                ARK Connect provides multi-tier wholesale ordering with instant credit checks, Tally ERP sync, and deterministic ledger reconciliation.
              </p>
            </div>

            <div className="py-2.5">
              <span className="text-[10px] font-mono uppercase text-ink-muted">Numbers &amp; IDs (Geist Mono, Tabular Figures)</span>
              <div className="flex items-center gap-4 mt-1 font-mono text-sm text-ink">
                <span>PO #ARK-8841</span>
                <span>INV-0095</span>
                <span className="num font-bold text-primary">₹18,64,700</span>
                <span className="num text-success">₹54,200</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 4: Lucide Icons (Stroke 1.75, Sizes 16/20/24) */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="sparkles" size={18} className="text-accent" />
              4. Lucide Icons (Universal &lt;Icon name=&quot;...&quot; /&gt;, Stroke 1.75)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              All 109 Material Symbols mapped to Lucide equivalents. Configured with stroke 1.75 and standard sizes 16, 20, 24px.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {[
              { name: "close", label: "close -> X" },
              { name: "check_circle", label: "check_circle -> CheckCircle2" },
              { name: "verified", label: "verified -> CheckCheck" },
              { name: "warning", label: "warning -> AlertTriangle" },
              { name: "search", label: "search -> Search" },
              { name: "local_shipping", label: "local_shipping -> Truck" },
              { name: "inventory_2", label: "inventory_2 -> Package" },
              { name: "receipt_long", label: "receipt_long -> Receipt" },
              { name: "payments", label: "payments -> CreditCard" },
              { name: "storefront", label: "storefront -> Store" },
              { name: "factory", label: "factory -> Factory" },
              { name: "phone_in_talk", label: "phone_in_talk -> PhoneCall" },
              { name: "auto_awesome", label: "auto_awesome -> Sparkles" },
              { name: "today", label: "today -> CalendarDays" },
              { name: "sync", label: "sync -> RefreshCw" },
              { name: "logout", label: "logout -> LogOut" },
              { name: "shopping_bag", label: "shopping_bag -> ShoppingBag" },
              { name: "shield_check", label: "verified_user -> ShieldCheck" },
            ].map((i) => (
              <div
                key={i.name}
                className="bg-surface border border-border rounded-sm p-2.5 flex items-center gap-2.5 shadow-soft-xs"
              >
                <div className="w-8 h-8 rounded-xs bg-surface-raised border border-border text-primary flex items-center justify-center shrink-0">
                  <Icon name={i.name} size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-ink block truncate">{i.name}</span>
                  <span className="text-[9px] text-ink-muted font-mono truncate block">{i.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: UI Primitives Gallery */}
        <section className="space-y-8">
          <div>
            <h3 className="text-base font-bold text-ink font-sans tracking-tight flex items-center gap-2">
              <Icon name="boxes" size={18} className="text-primary" />
              5. Core UI Primitives Gallery
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Compact density, hairline borders, status chips with dots and text labels.
            </p>
          </div>

          {/* 5A. Buttons */}
          <div>
            <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">Buttons</span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="sm">Primary SM</Button>
              <Button variant="primary" size="md">Primary MD</Button>
              <Button variant="primary" size="lg">Primary LG</Button>
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="ghost" size="md">Ghost</Button>
              <Button variant="danger" size="md">Danger</Button>
              <Button variant="primary" size="md" isLoading>Loading</Button>
              <Button variant="primary" size="icon" aria-label="Icon only">
                <Icon name="check" size={16} />
              </Button>
            </div>
          </div>

          {/* 5B. Badges & StatusChips */}
          <div>
            <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">
              Badges &amp; StatusChips (Dot + Text Label)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip variant="success">Delivered</StatusChip>
              <StatusChip variant="primary">Dispatched</StatusChip>
              <StatusChip variant="warning">Submitted</StatusChip>
              <StatusChip variant="danger">Overdue</StatusChip>
              <StatusChip variant="accent">Under Review</StatusChip>
              <StatusChip variant="neutral">Draft</StatusChip>
              <Badge variant="default" dot={false}>Count: 28</Badge>
            </div>
          </div>

          {/* 5C. Stat Cards (Count-Up) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold">
                Stat Cards (120-250ms Count-Up)
              </span>
              <button
                type="button"
                onClick={() => setCounterTrigger((prev) => prev + 1)}
                className="text-[11px] text-primary hover:underline font-mono"
              >
                Replay Animation
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                key={`stat1-${counterTrigger}`}
                label="Total Receivables"
                value={1864700}
                prefix="₹"
                delta={{ value: "4.2%", isPositive: true, label: "vs last mo" }}
                caption="28 verified retailer accounts"
              />
              <Stat
                key={`stat2-${counterTrigger}`}
                label="October Sales"
                value={1367910}
                prefix="₹"
                delta={{ value: "12%", isPositive: true }}
                caption="Exceeds target by ₹1.2L"
              />
              <Stat
                key={`stat3-${counterTrigger}`}
                label="Overdue Risk"
                value={884700}
                prefix="₹"
                delta={{ value: "1.8%", isPositive: false, label: "risk" }}
                caption="Past credit terms"
              />
              <Stat
                key={`stat4-${counterTrigger}`}
                label="Box Shipments"
                value={2840}
                suffix="boxes"
                caption="All 7 flowchart brands active"
              />
            </div>
          </div>

          {/* 5D. Tabs */}
          <div>
            <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">Tabs (Pills &amp; Underline)</span>
            <div className="space-y-3">
              <Tabs
                tabs={sampleTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
              <Tabs
                tabs={sampleUnderlineTabs}
                activeTab={activeUnderlineTab}
                onChange={setActiveUnderlineTab}
                variant="underline"
              />
            </div>
          </div>

          {/* 5E. Inputs */}
          <div>
            <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">Input Fields</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Retailer Phone Number"
                placeholder="94401 23456"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                leftIcon={<Icon name="phone" size={15} />}
              />
              <Input
                label="Search Products"
                placeholder="FB-104 Ankle Leggings"
                leftIcon={<Icon name="search" size={15} />}
                helperText="Geist Sans compact density"
              />
              <Input
                label="Overdue Balance Check"
                placeholder="₹31,000"
                error="Account past 30-day terms"
                leftIcon={<Icon name="alert-triangle" size={15} />}
              />
            </div>
          </div>

          {/* 5F. Skeleton & EmptyState */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="default" className="p-4">
              <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">
                Skeleton Shimmer (Obsidian Gradient)
              </span>
              <div className="space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="rounded" height={60} />
              </div>
            </Card>

            <Card variant="default" className="p-4">
              <span className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-2">
                EmptyState (Compact Density)
              </span>
              <EmptyState
                title="No Pending Dispatches"
                description="All purchase orders have been allocated and invoiced."
                actionLabel="Create Invoice"
                onAction={() => alert("Action clicked")}
              />
            </Card>
          </div>
        </section>
      </main>

      {/* Interactive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Industrial-Tech Modal"
        description="Glass overlay backdrop with 180ms opacity/transform animation."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            Hairline borders (<code className="font-mono num bg-surface-raised border border-border px-1 py-0.5 rounded">1px solid var(--border)</code>), compact density, and backdrop blur limited to overlays only.
          </p>
          <div className="p-3 rounded-sm bg-surface-raised border border-border text-ink">
            <span className="text-[10px] font-mono uppercase text-accent font-bold block">Status Verified</span>
            <span className="font-mono text-sm font-bold text-ink num mt-0.5 block">RET-0001 · Outstanding ₹54,200</span>
          </div>
        </div>
      </Modal>

      {/* Interactive Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Slide-Over Drawer"
        description="200ms slide-in motion respecting prefers-reduced-motion."
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-ink-muted leading-relaxed">
          <p>
            Drawers use right-aligned hairline borders with a blurred glass backdrop.
          </p>
          <div className="space-y-2">
            <div className="p-2.5 rounded-sm bg-surface-raised border border-border">
              <span className="text-[10px] font-bold text-ink uppercase block">PO #ARK-8841</span>
              <span className="text-xs text-primary font-mono font-bold num">₹48,510</span>
            </div>
            <div className="p-2.5 rounded-sm bg-surface-raised border border-border">
              <span className="text-[10px] font-bold text-ink uppercase block">INV-0095</span>
              <span className="text-xs text-success font-mono font-bold num">Paid (₹48,510)</span>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-ink text-xs font-mono">
          Loading Design System Preview...
        </div>
      }
    >
      <DesignShowcase />
    </Suspense>
  );
}

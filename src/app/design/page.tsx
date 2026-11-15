"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Badge,
  Stat,
  Drawer,
  Modal,
  Tabs,
  Input,
  Skeleton,
  EmptyState,
  ThemeToggle,
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
        <Card variant="hero" className="max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[24px]">palette</span>
          </div>
          <h1 className="text-xl font-bold font-sans text-ink">Design Token & Primitives Preview</h1>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            The design system preview is restricted. Append <code className="bg-surface px-1.5 py-0.5 rounded border border-border text-xs num">?demo=true</code> to your URL to explore the token palette and UI primitives.
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
    { id: "accessibility", label: "A11y & Motion" },
  ];

  return (
    <div className="min-h-screen bg-background text-ink pb-24 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between gap-4 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-soft-sm">
            ARK
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-base text-ink">ARK Design System</h1>
              <Badge variant="accent" size="sm">Tailwind v4</Badge>
            </div>
            <p className="text-xs text-ink-muted">Token Layer & Shared Primitives</p>
          </div>
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
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              Design Architecture & Semantic Tokens
            </span>
            <h2 className="font-page-title text-4xl sm:text-5xl text-ink mt-2">
              Unified Design System
            </h2>
            <p className="text-sm sm:text-base text-ink-muted mt-3 max-w-2xl leading-relaxed">
              Tailwind CSS v4 semantic tokens mapped via <code className="text-xs bg-surface border border-border px-1.5 py-0.5 rounded num">@theme</code>.
              Supports Light (#FAF7F2), Dark (#0F1115), and System modes with zero hydration flash and WCAG AA contrast.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCounterTrigger((prev) => prev + 1)}
              leftIcon={<span className="material-symbols-outlined text-[18px]">replay</span>}
            >
              Replay Stat Count-Up
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<span className="material-symbols-outlined text-[18px]">open_in_new</span>}
            >
              Open Modal
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsDrawerOpen(true)}
              leftIcon={<span className="material-symbols-outlined text-[18px]">dock_to_right</span>}
            >
              Open Drawer
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-6 space-y-16">
        {/* Section 1: Semantic Color Tokens */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">1. Semantic Color Tokens</h3>
            <p className="text-xs text-ink-muted mt-1">
              Never hardcoded hex in components. All tokens dynamically adapt between Light (#FAF7F2) and Dark (#0F1115).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Background", token: "bg-background", border: "border-border", text: "text-ink", hex: "var(--background)" },
              { name: "Surface", token: "bg-surface", border: "border-border", text: "text-ink", hex: "var(--surface)" },
              { name: "Surface Raised", token: "bg-surface-raised", border: "border-border", text: "text-ink", hex: "var(--surface-raised)" },
              { name: "Border", token: "bg-border", border: "border-border", text: "text-ink", hex: "var(--border)" },
              { name: "Ink (Text)", token: "bg-ink", border: "border-transparent", text: "text-surface", hex: "var(--ink)" },
              { name: "Ink Muted", token: "bg-ink-muted", border: "border-transparent", text: "text-surface", hex: "var(--ink-muted)" },
              { name: "Primary", token: "bg-primary", border: "border-transparent", text: "text-primary-foreground", hex: "#3B3BF5 / #7C7CFF" },
              { name: "Accent (Coral)", token: "bg-accent", border: "border-transparent", text: "text-white", hex: "#FF6A3D / #FF8A63" },
              { name: "Success", token: "bg-success", border: "border-transparent", text: "text-white", hex: "#12805C / #22C55E" },
              { name: "Warning", token: "bg-warning", border: "border-transparent", text: "text-white", hex: "#B7791F / #F59E0B" },
              { name: "Danger", token: "bg-danger", border: "border-transparent", text: "text-white", hex: "#D92D20 / #EF4444" },
              { name: "Muted", token: "bg-muted/20", border: "border-border", text: "text-ink", hex: "var(--muted)" },
            ].map((c) => (
              <div
                key={c.name}
                className="bg-surface border border-border rounded-md p-3 shadow-soft-sm flex flex-col justify-between"
              >
                <div
                  className={`h-14 w-full rounded-sm ${c.token} border ${c.border} flex items-center justify-center font-bold text-xs ${c.text}`}
                >
                  Aa
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-bold text-ink">{c.name}</p>
                  <p className="text-[11px] text-ink-muted num truncate">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Radii & Soft Layered Shadows */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">2. Radii & Soft Layered Shadows</h3>
            <p className="text-xs text-ink-muted mt-1">
              Elevated surfaces with multi-stop diffuse shadows and exact radius tokens (sm: 10px, md: 16px, lg: 24px, xl: 32px).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface border border-border rounded-sm p-6 shadow-soft-sm">
              <span className="text-xs font-bold text-primary num">sm (10px)</span>
              <h4 className="text-sm font-bold text-ink mt-1">Soft Shadow SM</h4>
              <p className="text-xs text-ink-muted mt-1 num">0 1px 2px rgba(20,18,12,.04)</p>
            </div>

            <div className="bg-surface border border-border rounded-md p-6 shadow-soft-md">
              <span className="text-xs font-bold text-primary num">md (16px)</span>
              <h4 className="text-sm font-bold text-ink mt-1">Soft Shadow MD</h4>
              <p className="text-xs text-ink-muted mt-1 num">0 4px 12px -2px (layered)</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-soft-lg">
              <span className="text-xs font-bold text-primary num">lg (24px)</span>
              <h4 className="text-sm font-bold text-ink mt-1">Soft Shadow LG</h4>
              <p className="text-xs text-ink-muted mt-1 num">0 8px 24px -8px (layered)</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-soft-xl">
              <span className="text-xs font-bold text-primary num">xl (32px)</span>
              <h4 className="text-sm font-bold text-ink mt-1">Soft Shadow XL</h4>
              <p className="text-xs text-ink-muted mt-1 num">0 16px 36px -12px (layered)</p>
            </div>
          </div>
        </section>

        {/* Section 3: Typography & The .num Utility */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">3. Typography Hierarchy</h3>
            <p className="text-xs text-ink-muted mt-1">
              Instrument Serif for page titles; Geist for UI body; Geist Mono for IDs, numbers, and currency via <code className="bg-surface border border-border px-1.5 py-0.5 rounded text-xs num">.num</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" className="p-6">
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                Instrument Serif
              </span>
              <h4 className="font-page-title text-3xl text-ink mt-2">
                Garment Wholesale Portal
              </h4>
              <p className="text-xs text-ink-muted mt-2">
                Page titles and high-level section hero headlines only.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                Geist Sans (UI)
              </span>
              <h4 className="text-lg font-bold text-ink font-sans mt-2">
                Orders, Invoices & Retailers
              </h4>
              <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                Clear, legible interface typography optimized for tables, forms, and dense B2B operational views.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                Geist Mono (.num)
              </span>
              <div className="mt-2 space-y-1">
                <div className="num text-2xl font-bold text-ink">₹ 18,64,700</div>
                <div className="num text-xs text-ink-muted">INV-0094 • 24 boxes • 480 pcs</div>
              </div>
              <p className="text-xs text-ink-muted mt-2">
                Tabular figures guarantee zero visual jitter on animated count-ups and numeric tables.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 4: Stat Cards with Count-Up Animation */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-ink font-sans">4. Stat Cards (Animated Count-Up)</h3>
              <p className="text-xs text-ink-muted mt-1">
                Smooth 800ms ease-out count-up animation, tabular figures, and delta indicators.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCounterTrigger((prev) => prev + 1)}
            >
              Re-trigger
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" key={counterTrigger}>
            <Stat
              label="Total Receivables"
              prefix="₹"
              value={1864700}
              delta={{ value: "14.2%", isPositive: true, label: "MoM" }}
              caption="28 retailer ledgers reconciled"
            />
            <Stat
              label="Overdue Invoices"
              prefix="₹"
              value={31000}
              delta={{ value: "₹23,200 next", isPositive: false }}
              caption="RET-0001 requires settlement"
            />
            <Stat
              label="Active Retailers"
              value={28}
              suffix=" shops"
              delta={{ value: "+3 new", isPositive: true }}
              caption="1 pending review"
            />
            <Stat
              label="Purchase Payables"
              prefix="₹"
              value={3860000}
              delta={{ value: "4 open bills", isPositive: false }}
              caption="Tiruppur mill suppliers"
            />
          </div>
        </section>

        {/* Section 5: Card Variants */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">5. Card Variants</h3>
            <p className="text-xs text-ink-muted mt-1">
              Semantic card containers: default, hero, and tinted variants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" interactive className="p-6">
              <Badge variant="neutral" size="sm">Variant: default</Badge>
              <h4 className="text-base font-bold text-ink mt-3 font-sans">Standard Surface Card</h4>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Clean white/dark surface with border and subtle soft-sm shadow. Interactive hover state enabled.
              </p>
            </Card>

            <Card variant="hero" interactive className="p-6">
              <Badge variant="primary" size="sm">Variant: hero</Badge>
              <h4 className="text-base font-bold text-ink mt-3 font-sans">Raised Hero Card</h4>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Elevated surface-raised background with rounded-xl border and layered soft-md shadow.
              </p>
            </Card>

            <Card variant="tinted" interactive className="p-6">
              <Badge variant="accent" size="sm">Variant: tinted</Badge>
              <h4 className="text-base font-bold text-ink mt-3 font-sans">Primary Tinted Card</h4>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Subtle primary brand background (5% opacity) with matching border. Ideal for callouts.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 6: Buttons & Tap Targets */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">6. Buttons & Accessible Tap Targets</h3>
            <p className="text-xs text-ink-muted mt-1">
              44px minimum tap targets, visible primary focus rings (2px offset), and smooth 200ms ease-out transitions.
            </p>
          </div>

          <Card variant="default" className="p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="primary" isLoading>Loading State</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary">Small (sm)</Button>
                <Button size="md" variant="secondary">Medium (md)</Button>
                <Button size="lg" variant="primary">Large (lg)</Button>
                <Button size="icon" variant="secondary" aria-label="Settings">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
                >
                  Create Invoice
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 7: Badges & Status Chips */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">7. Badges & Status Chips</h3>
            <p className="text-xs text-ink-muted mt-1">
              Token-mapped badges for order statuses, credit checks, and inventory indicators.
            </p>
          </div>

          <Card variant="default" className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="accent">Accent (Coral)</Badge>
              <Badge variant="success" dot pulse>Active / Approved</Badge>
              <Badge variant="warning" dot>Needs Review</Badge>
              <Badge variant="danger" dot>Credit Hold / Overdue</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="success" size="sm">Paid (sm)</Badge>
              <Badge variant="warning" size="sm">Overdue 31–60d</Badge>
              <Badge variant="danger" size="sm">Overdue 60+d</Badge>
              <Badge variant="primary" size="sm">Diamond Tier</Badge>
            </div>
          </Card>
        </section>

        {/* Section 8: Tabs & Segmented Pills */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">8. Tabs & Segmented Pills</h3>
            <p className="text-xs text-ink-muted mt-1">
              Interactive segmented control and underline tab strips with full keyboard accessibility.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-2">Segmented Pills</p>
              <Tabs
                tabs={sampleTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="pills"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted mb-2">Underline Tabs</p>
              <Tabs
                tabs={sampleUnderlineTabs}
                activeTab={activeUnderlineTab}
                onChange={setActiveUnderlineTab}
                variant="underline"
              />
            </div>
          </div>
        </section>

        {/* Section 9: Form Inputs */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">9. Form Inputs</h3>
            <p className="text-xs text-ink-muted mt-1">
              44px tap targets, visible focus rings, leading/trailing icon slots, and inline error validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Standard Text Input"
              placeholder="e.g. Sri Laxmi Textiles"
              helperText="Enter registered trading name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <Input
              label="Search SKU or Retailer"
              placeholder="Search PO, retailer, LR..."
              leftIcon={<span className="material-symbols-outlined text-[18px]">search</span>}
              helperText="Press ⌘K to open global palette"
            />

            <Input
              label="GSTIN Check"
              value="36AABCS1429B1Z"
              error="Invalid checksum for Telangana state code (36)"
            />
          </div>
        </section>

        {/* Section 10: Skeleton Shimmer */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">10. Skeleton Shimmer Loading</h3>
            <p className="text-xs text-ink-muted mt-1">
              Smooth gradient shimmer animation that respects <code className="bg-surface px-1.5 py-0.5 rounded text-xs num">prefers-reduced-motion</code>.
            </p>
          </div>

          <Card variant="default" className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="40%" height={16} />
                <Skeleton variant="text" width="70%" height={12} />
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              <Skeleton variant="text" height={14} />
              <Skeleton variant="text" height={14} />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
          </Card>
        </section>

        {/* Section 11: Empty State */}
        <section>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-ink font-sans">11. Empty State Primitive</h3>
            <p className="text-xs text-ink-muted mt-1">
              Friendly, token-styled fallback for empty lists, search misses, and zero-data states.
            </p>
          </div>

          <EmptyState
            title="No Deactivated Retailers"
            description="All registered partners are currently active and in good standing with active credit lines."
            actionLabel="View Active Retailers"
            onAction={() => alert("Navigating to active tab")}
            secondaryActionLabel="Register New Partner"
            onSecondaryAction={() => alert("Opening registration modal")}
          />
        </section>
      </main>

      {/* Interactive Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Credit Check Approval Modal"
        description="Verify retailer financial standing before confirming Purchase Order."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                alert("Order Approved!");
                setIsModalOpen(false);
              }}
            >
              Approve PO
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-warning/10 border border-warning/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-warning text-[20px] shrink-0 mt-0.5">
              warning
            </span>
            <div>
              <p className="text-xs font-bold text-warning">Overdue Balance Warning</p>
              <p className="text-xs text-ink-muted mt-0.5">
                RET-0001 has ₹31,000 in invoices overdue past 30 days. Approval will utilize remaining available credit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-background border border-border rounded-md">
              <span className="text-ink-muted">Credit Limit</span>
              <p className="font-bold text-ink text-sm num mt-0.5">₹ 1,50,000</p>
            </div>
            <div className="p-3 bg-background border border-border rounded-md">
              <span className="text-ink-muted">Available Credit</span>
              <p className="font-bold text-success text-sm num mt-0.5">₹ 95,800</p>
            </div>
          </div>

          <Input
            label="Override Justification (Optional)"
            placeholder="e.g. Cheque clearance confirmed by accounts"
          />
        </div>
      </Modal>

      {/* Interactive Drawer Component */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Order Details: ARK-8903"
        description="Purchase Order breakdown & Hub inventory confirmation."
        width="lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsDrawerOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                alert("Dispatch triggered");
                setIsDrawerOpen(false);
              }}
            >
              Dispatch Order
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-xs text-ink-muted">Retailer</span>
              <p className="font-bold text-ink">Sri Laxmi Narasimha Textiles</p>
              <p className="text-xs text-ink-muted num">RET-0001 • Siddipet</p>
            </div>
            <Badge variant="warning" dot>Needs Review</Badge>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Line Items</h5>
            <div className="border border-border rounded-md overflow-hidden bg-background">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface border-b border-border text-ink-muted font-semibold">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3 text-right">Boxes</th>
                    <th className="p-3 text-right">Hub Stock</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 font-medium text-ink">Classic Polo Crew (L)</td>
                    <td className="p-3 text-right num">12</td>
                    <td className="p-3 text-right text-success font-semibold num">45 OK</td>
                    <td className="p-3 text-right num">₹ 14,400</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-ink">Lux Cozy Vest (XL)</td>
                    <td className="p-3 text-right num">8</td>
                    <td className="p-3 text-right text-success font-semibold num">28 OK</td>
                    <td className="p-3 text-right num">₹ 8,800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-md space-y-1.5 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span className="num">₹ 23,200</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>GST (5%)</span>
              <span className="num">₹ 1,160</span>
            </div>
            <div className="flex justify-between text-ink font-bold text-sm border-t border-border pt-2 mt-2">
              <span>Total PO Value</span>
              <span className="num text-primary">₹ 24,360</span>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default function DesignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8" />}>
      <DesignShowcase />
    </Suspense>
  );
}

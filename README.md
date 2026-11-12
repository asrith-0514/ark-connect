# ARK Connect & Distributors — B2B Garment & Innerwear Wholesale Platform

A Next.js 16 (React 19, TypeScript, Tailwind CSS v4) wholesale e-commerce platform built to spec from Stitch Project **`17322029440376199611`**.

The application bridges the entire lifecycle of garment and innerwear wholesale distribution between Tiruppur mills and independent retail stores across Telangana and Andhra Pradesh, providing two dedicated portals seamlessly switchable in real time.

---

## 🚀 Portals Overview

### 1. ARK Connect (Retailer Ordering Portal)
Designed specifically for garment retail store owners (e.g., *Sri Laxmi Narasimha Textiles* in Siddipet) to order bulk inventory directly from Tiruppur mill distributors:
* **Mill Catalog & 9 Tiruppur Brands**: Real photo assets and tiered wholesale pricing for *Flybirds, Within, Sleepy Panda, Aswathi, Exena, Lichi, Maxwell, Little Star, and Flycute*.
* **Size × Color Quantity Matrix**: Industrial 4×5 variant grid (*Jet Black, Ink Navy, Heather Grey, Classic White* × *S, M, L, XL, XXL*) with "+2 All Sizes" quick increment, master carton box calculators, and real-time total pieces / cost calculation.
* **Bulk Order & PO Review**: Brand-grouped carton breakdown, transporter logistics selector (*Navata Road Transport, VRL Logistics, ARC*), delivery instructions, and celebration confetti submission.
* **PO Submission & Instant WhatsApp Share**: Pre-filled WhatsApp direct message generation (`https://wa.me/?text=...`) for instant purchase order confirmation to the distributor desk.
* **My Orders & Dispatch Tracking**: Real-time status pipeline (*Draft → Submitted → Approved → Confirmed → Processing → Dispatched → Delivered*), Lorry Receipt (LR) tracking, and order drawer.
* **Account Ledger & Credit Headroom**: Live credit line gauge (64% available), invoice history with interactive PDF download feedback, and accounts desk messaging.

---

### 2. ARK Distributors (Distributor Backoffice ERP)
The command center for distributor owners and operations staff (*Thatavarthi - Owner / Super Admin*):
* **Executive Bento Dashboard**: 6 high-level KPI cards, interactive 6-Month Invoiced Sales vs Collections SVG chart with dynamic hover badges, 6-stage Orders Pipeline with 91.2% fulfillment rate indicator, and Receivables Ageing risk segment bar.
* **Orders Management**: Order fulfillment pipeline, PO approval, lorry receipt assignment drawer with transporter selection, and instant invoice generation.
* **Paper Tax Invoice Preview (INV-0095)**: Authentic paper tax invoice modal with HSN codes (`610910`, `610711`, `520852`), 5% IGST calculation, trade discount adjustment, round-off, amount in words, and one-click official issuance.
* **Record Payment Receipt**: Direct receipt entry with payment method selection (UPI, Bank Transfer, NEFT, Cash, Cheque), reference number validation, "Apply to oldest first" auto-distribution across open invoices, real-time credit restoration projection, and simulated over-application error handling.
* **Retailer Onboarding & KYC Approval**: 4-tab directory (*Needs Approval, Active, Deactivated, All*), duplicate phone number collision warning banner, and 440px right review drawer to configure retailer pricing tier (*Tier A++, Tier A+, Tier A*), credit limits, and credit periods.
* **Receivables Ageing Ledger**: Total receivables tracking (₹18,64,700), overdue categorization (*1-30d, 31-60d, 60+d*), and WhatsApp reminder generator with pre-filled message templates.
* **Products & Tier Pricing**: Inventory overview in Tiruppur central hub, wholesale rate matrix, pack unit requirements, and stock visibility toggles.

---

## 🛠️ Technology Stack
* **Framework**: Next.js 16.4.5 (App Router with Webpack)
* **UI & Core**: React 19.3.0, TypeScript 5, Tailwind CSS v4
* **Typography**: Google Fonts — *Bricolage Grotesque* (Headlines & Display), *Geist* (UI body), *JetBrains Mono* (Currencies & Tables), *Material Symbols Outlined* (Icons)
* **Animation & Visuals**: `canvas-confetti`, `lucide-react`, Glassmorphism, Stitch design token palette

---

## 🏃 Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## ⌨️ Shortcuts & Role Toggling
* **Role Switcher**: Click the top dark bar buttons anytime to toggle between **Retailer Portal (ARK Connect)** and **Distributor Backoffice (ARK Distributors)**.
* **Global Command Palette**: Press `Cmd + K` (or `Ctrl + K`) or click the search input on any page to open quick navigation.

"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Product,
  OrderItem,
  Order,
  Retailer,
  Invoice,
  Payment,
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_RETAILERS,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  Supplier,
  PurchaseBill,
  TierPricingArticle,
  MOCK_SUPPLIERS,
  MOCK_PURCHASE_BILLS,
  MOCK_TIER_ARTICLES
} from "@/data/mockData";
import confetti from "canvas-confetti";
import { useCurrentDate, getDaysUntil } from "@/lib/mock/retailer";
import { useAuth } from "./AuthContext";
import {
  CommunicationLogEntry,
  Complaint,
  ComplaintStatus,
  FollowUp,
  RetailerRequest,
  MOCK_COMMUNICATION_LOGS,
  MOCK_COMPLAINTS,
  MOCK_FOLLOW_UPS,
  MOCK_RETAILER_REQUESTS,
  CallTask,
  CallTaskReason,
  VoiceLanguage,
  CallTaskOutcome,
  MOCK_CALL_TASKS,
  SCRIPT_TEMPLATES,
  ScriptTemplateDefinition,
  generateProposedCallTasks,
  MockCallProvider,
  handleCallOutcomeWriteBack,
} from "@/lib/mock";

interface AppContextType {
  // Mode & navigation
  portalMode: "retailer" | "distributor";
  setPortalMode: (mode: "retailer" | "distributor") => void;
  retailerNav: string;
  setRetailerNav: (nav: string) => void;
  distributorNav: string;
  setDistributorNav: (nav: string) => void;
  retailerSelectedBrand: string;
  setRetailerSelectedBrand: (brand: string) => void;

  // Cart & Order Matrix
  cartItems: OrderItem[];
  cartTotalBoxes: number;
  cartTotalPieces: number;
  cartSubtotal: number;
  cartGst: number;
  cartGrandTotal: number;
  addToCart: (items: OrderItem[]) => void;
  updateCartItemQty: (productId: string, color: string, size: string, delta: number) => void;
  removeCartItem: (productId: string, color: string, size: string) => void;
  clearCart: () => void;

  // Matrix modal
  matrixProduct: Product | null;
  openMatrixModal: (product: Product) => void;
  closeMatrixModal: () => void;

  // Order submission
  isReviewOrderOpen: boolean;
  setIsReviewOrderOpen: (open: boolean) => void;
  isOrderSuccessOpen: boolean;
  setIsOrderSuccessOpen: (open: boolean) => void;
  lastSubmittedOrder: Order | null;
  submitCurrentOrder: (transporter?: string, notes?: string) => void;

  // Orders state
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order["status"], extra?: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;

  // Distributor side
  retailers: Retailer[];
  invoices: Invoice[];
  payments: Payment[];
  approveRetailer: (id: string, tier: Retailer["pricingTier"], creditLimit: number, creditTermsDays?: number) => void;
  rejectRetailer: (id: string, reason?: string) => void;
  updateRetailer: (id: string, updates: Partial<Retailer>) => void;
  toggleCreditHold: (retailerId: string) => void;
  setCreditHold: (retailerId: string, hold: boolean) => void;
  recordReceipt: (retailerId: string, amount: number, method: string, ref: string, allocations: { [invId: string]: number }) => void;
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (invId: string, updates: Partial<Invoice>) => void;
  issueInvoice: (invId: string) => void;
  
  // Invoicing & Receipt Modals
  viewingInvoice: Invoice | null;
  setViewingInvoice: (inv: Invoice | null) => void;
  isCreateInvoiceOpen: boolean;
  setIsCreateInvoiceOpen: (open: boolean) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  receiptPrefillRetailerId: string | null;
  setReceiptPrefillRetailerId: (id: string | null) => void;

  // Active Retailer
  activeRetailer: Retailer;

  // Global search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Order filters
  orderTabFilter: string;
  setOrderTabFilter: (filter: string) => void;

  // Hydration-safe client date
  currentDate: Date;

  // Selected Month for Dashboard & Reporting
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;

  // Supply Chain & Tier Pricing (Requirements 2, 3, 4)
  suppliers: Supplier[];
  purchaseBills: PurchaseBill[];
  addPurchaseBill: (bill: Omit<PurchaseBill, "id">) => void;
  tierArticles: TierPricingArticle[];
  updateTierArticle: (id: string, updates: Partial<TierPricingArticle>) => { success: boolean; error?: string };

  // Retailer Relationship Management (CRM)
  communications: CommunicationLogEntry[];
  addCommunication: (entry: Omit<CommunicationLogEntry, "id" | "createdAt">) => void;
  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, "id" | "createdAt">) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, notes?: string) => void;
  followUps: FollowUp[];
  addFollowUp: (followUp: Omit<FollowUp, "id" | "createdAt">) => void;
  updateFollowUpStatus: (id: string, status: "open" | "done") => void;
  rescheduleFollowUp: (id: string, newDueDate: string) => void;
  reassignFollowUp: (id: string, newAssignee: string) => void;
  retailerRequests: RetailerRequest[];
  addRetailerRequest: (req: Omit<RetailerRequest, "id" | "createdAt" | "status">) => void;
  updateRetailerRequestStatus: (id: string, status: "pending" | "approved" | "rejected", reviewedBy?: string) => void;
  selectedRetailer360Id: string | null;
  setSelectedRetailer360Id: (id: string | null) => void;

  // Voice Calling Agent
  callTasks: CallTask[];
  scriptTemplates: Record<CallTaskReason, ScriptTemplateDefinition>;
  approveCallTask: (taskId: string) => void;
  approveAllProposedTasks: () => void;
  cancelCallTask: (taskId: string) => void;
  executeSimulatedCall: (taskId: string) => Promise<void>;
  updateScriptTemplate: (reason: CallTaskReason, lang: VoiceLanguage, script: string) => void;
  updateRetailerVoicePreferences: (retailerId: string, prefs: Partial<Retailer>) => void;
  generateCallTasksFromRules: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
  children,
  initialMode: propInitialMode,
  initialDistributorNav: propInitialDistributorNav,
  initialRetailerNav: propInitialRetailerNav,
}: {
  children: React.ReactNode;
  initialMode?: "retailer" | "distributor";
  initialDistributorNav?: string;
  initialRetailerNav?: string;
}) {
  const currentDate = useCurrentDate();
  const searchParams = useSearchParams();

  // Parse mode and view synchronously from Next.js searchParams (safe for both SSR & Client inside Suspense)
  const modeParam = searchParams?.get("mode") || searchParams?.get("role") || searchParams?.get("portal");
  const initialMode: "retailer" | "distributor" =
    propInitialMode ||
    (modeParam === "distributor" || modeParam === "wholesaler" || modeParam === "admin"
      ? "distributor"
      : "retailer");

  const rawViewParam = searchParams?.get("view") || searchParams?.get("tab");
  const initialDistributorNav =
    propInitialDistributorNav ||
    (() => {
      if (!rawViewParam) return "dashboard";
      const normalized = rawViewParam.trim().replace(/\s+/g, "-");
      return normalized === "products" ? "products-pricing" :
             normalized === "purchases" ? "purchase-bills" :
             normalized === "analytics" ? "reports" : normalized;
    })();

  const normalizedRetailerNav = (() => {
    if (propInitialRetailerNav) return propInitialRetailerNav;
    const tab = searchParams?.get("tab") || searchParams?.get("view");
    if (!tab) return "home";
    const t = tab.trim().toLowerCase();
    return t === "shop" || t === "catalog" || t === "products" ? "catalogue" :
           t === "orders" || t === "order" ? "orders" :
           t === "dues" || t === "ledger" || t === "payments" ? "dues" :
           t === "account" || t === "profile" ? "account" : "home";
  })();

  const [portalMode, setPortalMode] = useState<"retailer" | "distributor">(initialMode);
  const [retailerNav, setRetailerNav] = useState<string>(normalizedRetailerNav);
  const [distributorNav, setDistributorNav] = useState<string>(initialDistributorNav);
  const [retailerSelectedBrand, setRetailerSelectedBrand] = useState<string>("All");

  const { user } = useAuth();

  // Initial cart populated with Draft PO #ARK-8902 items only when demo mode is enabled (?demo=true)
  const initialDraftOrder = MOCK_ORDERS.find(o => o.orderNumber === "ARK-8902");
  const [cartItems, setCartItems] = useState<OrderItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ark_cart_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    const isExplicitDemo = typeof window !== "undefined" && (new URLSearchParams(window.location.search).get("demo") === "true" || new URLSearchParams(window.location.search).get("demo") === "1");
    return (isExplicitDemo && initialDraftOrder) ? initialDraftOrder.items : [];
  });

  // Sync cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ark_cart_v1", JSON.stringify(cartItems));
      } catch {}
    }
  }, [cartItems]);

  // Modals state
  const [matrixProduct, setMatrixProduct] = useState<Product | null>(null);
  const [isReviewOrderOpen, setIsReviewOrderOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<Order | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPrefillRetailerId, setReceiptPrefillRetailerId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [orderTabFilter, setOrderTabFilter] = useState<string>("all");

  // Data states: Persistent across route changes, refreshes, tabs, and server
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  // Hydrate orders from localStorage, sync with server API and broadcast across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Immediate local cache retrieval
    try {
      const saved = localStorage.getItem("ark_orders_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      }
    } catch (e) {
      console.error("Error reading ark_orders_v1 on mount", e);
    }

    // 2. Fetch authoritative orders from /api/orders (no-store, change-detection guarded)
    let lastOrdersSignature = "";
    const syncServerOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.orders && Array.isArray(data.orders) && data.orders.length > 0) {
            const currentSignature = data.orders.map((o: Order) => `${o.id}:${o.status}:${o.totalBoxes}`).join("|");
            if (currentSignature !== lastOrdersSignature) {
              lastOrdersSignature = currentSignature;
              setOrders(prev => {
                const serverIds = new Set(data.orders.map((o: Order) => o.id));
                const localUnsynced = prev.filter(o => !serverIds.has(o.id) && o.orderNumber !== "ARK-8902");
                const merged = [...localUnsynced, ...data.orders];
                try {
                  localStorage.setItem("ark_orders_v1", JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }
        }
      } catch (err) {
        // network silent retry
      }
    };

    syncServerOrders();
    const interval = setInterval(syncServerOrders, 4000);
    window.addEventListener("focus", syncServerOrders);

    // 3. Instant multi-tab synchronization via BroadcastChannel
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("ark_orders_channel");
        broadcastChannel.onmessage = (event) => {
          if (!event.data) return;
          if (event.data.type === "NEW_ORDER" && event.data.order) {
            const newOrd = event.data.order as Order;
            setOrders(prev => {
              if (prev.some(o => o.id === newOrd.id || o.orderNumber === newOrd.orderNumber)) return prev;
              const updated = [newOrd, ...prev.filter(o => o.orderNumber !== "ARK-8902")];
              try { localStorage.setItem("ark_orders_v1", JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (event.data.type === "UPDATE_STATUS") {
            const { orderId, status, extra } = event.data;
            setOrders(prev => {
              const updated = prev.map(o => {
                if (o.id === orderId || o.orderNumber === orderId) {
                  return { ...o, status: status || o.status, ...(extra || {}) };
                }
                return o;
              });
              try { localStorage.setItem("ark_orders_v1", JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        };
      }
    } catch {}

    // 4. Listen to cross-tab storage changes (fallback)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ark_orders_v1" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncServerOrders);
      window.removeEventListener("storage", handleStorage);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  const [retailers, setRetailers] = useState<Retailer[]>(MOCK_RETAILERS);
  const activeRetailer = retailers[0];
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>(MOCK_PURCHASE_BILLS);
  const [tierArticles, setTierArticles] = useState<TierPricingArticle[]>(MOCK_TIER_ARTICLES);

  // Selected Month for Dashboard & Reporting
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");

  // Retailer Relationship Management (CRM) States
  const [communications, setCommunications] = useState<CommunicationLogEntry[]>(MOCK_COMMUNICATION_LOGS);
  const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);
  const [followUps, setFollowUps] = useState<FollowUp[]>(MOCK_FOLLOW_UPS);
  const [retailerRequests, setRetailerRequests] = useState<RetailerRequest[]>(MOCK_RETAILER_REQUESTS);
  const [selectedRetailer360Id, setSelectedRetailer360Id] = useState<string | null>(null);

  const addCommunication = (entry: Omit<CommunicationLogEntry, "id" | "createdAt">) => {
    const newEntry: CommunicationLogEntry = {
      ...entry,
      id: `comm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCommunications((prev) => [newEntry, ...prev]);
  };

  const addComplaint = (complaint: Omit<Complaint, "id" | "createdAt">) => {
    const newComplaint: Complaint = {
      ...complaint,
      id: `comp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus, notes?: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status,
            notes: notes !== undefined ? notes : c.notes,
            resolvedAt: status === "resolved" ? new Date().toISOString() : c.resolvedAt,
          };
        }
        return c;
      })
    );
  };

  const addFollowUp = (followUp: Omit<FollowUp, "id" | "createdAt">) => {
    const newFollowUp: FollowUp = {
      ...followUp,
      id: `fu_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);
  };

  const updateFollowUpStatus = (id: string, status: "open" | "done") => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const rescheduleFollowUp = (id: string, newDueDate: string) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, dueDate: newDueDate, status: "open" } : f)));
  };

  const reassignFollowUp = (id: string, newAssignee: string) => {
    setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, assignedTo: newAssignee } : f)));
  };

  const addRetailerRequest = (req: Omit<RetailerRequest, "id" | "createdAt" | "status">) => {
    const newRequest: RetailerRequest = {
      ...req,
      id: `req_${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setRetailerRequests((prev) => [newRequest, ...prev]);
  };

  const updateRetailerRequestStatus = (
    id: string,
    status: "pending" | "approved" | "rejected",
    reviewedBy?: string
  ) => {
    setRetailerRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewedBy || "Distributor Admin",
          };
        }
        return r;
      })
    );
  };

  // Voice Calling Agent States & Handlers
  const [callTasks, setCallTasks] = useState<CallTask[]>(MOCK_CALL_TASKS);
  const [scriptTemplates, setScriptTemplates] = useState(SCRIPT_TEMPLATES);

  const approveCallTask = (taskId: string) => {
    setCallTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "approved", approvedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const approveAllProposedTasks = () => {
    setCallTasks((prev) =>
      prev.map((t) =>
        t.status === "proposed"
          ? { ...t, status: "approved", approvedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const cancelCallTask = (taskId: string) => {
    setCallTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "cancelled" } : t))
    );
  };

  const executeSimulatedCall = async (taskId: string) => {
    const task = callTasks.find((t) => t.id === taskId);
    if (!task) return;

    setCallTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in_progress" } : t))
    );

    const provider = new MockCallProvider();
    const simResult = provider.generateSimulatedResult(task);

    const completedTask: CallTask = {
      ...task,
      status: "completed",
      completedAt: new Date().toISOString(),
      outcome: simResult.outcome,
      transcript: simResult.transcript,
      promisedPaymentDate: simResult.outcome.promisedPaymentDate,
    };

    setCallTasks((prev) =>
      prev.map((t) => (t.id === taskId ? completedTask : t))
    );

    handleCallOutcomeWriteBack(completedTask, simResult.outcome, {
      addCommunication,
      addFollowUp,
    });
  };

  const updateScriptTemplate = (
    reason: CallTaskReason,
    lang: VoiceLanguage,
    script: string
  ) => {
    setScriptTemplates((prev) => ({
      ...prev,
      [reason]: {
        ...prev[reason],
        scripts: {
          ...prev[reason].scripts,
          [lang]: script,
        },
      },
    }));
  };

  const updateRetailerVoicePreferences = (
    retailerId: string,
    prefs: Partial<Retailer>
  ) => {
    setRetailers((prev) =>
      prev.map((r) => (r.id === retailerId ? { ...r, ...prefs } : r))
    );
  };

  const generateCallTasksFromRules = (): number => {
    const newlyProposed = generateProposedCallTasks(
      invoices,
      orders,
      retailers,
      callTasks,
      currentDate
    );
    if (newlyProposed.length > 0) {
      setCallTasks((prev) => [...newlyProposed, ...prev]);
    }
    return newlyProposed.length;
  };

  const addPurchaseBill = (billData: Omit<PurchaseBill, "id">) => {
    const newBill: PurchaseBill = {
      ...billData,
      id: `pb-${Date.now()}`
    };
    setPurchaseBills(prev => [newBill, ...prev]);

    // Feed supplier payables (Requirement 4)
    setSuppliers(prev =>
      prev.map(sup => {
        if (sup.id === billData.supplierId || sup.name === billData.supplierName) {
          return {
            ...sup,
            payable: sup.payable + billData.balanceDue,
            lastPurchaseDate: billData.date
          };
        }
        return sup;
      })
    );
  };

  const updateTierArticle = (id: string, updates: Partial<TierPricingArticle>) => {
    const article = tierArticles.find(a => a.id === id);
    if (!article) return { success: false, error: "Article not found" };

    const newApp = updates.tierAppPrice ?? article.tierAppPrice;
    const newAp = updates.tierApPrice ?? article.tierApPrice;
    const newA = updates.tierAPrice ?? article.tierAPrice;

    // Strict tier pricing validation: A++ <= A+ <= A
    if (newApp > newAp) {
      return {
        success: false,
        error: `Tier A++ price (₹${newApp}) cannot exceed Tier A+ price (₹${newAp}).`
      };
    }
    if (newAp > newA) {
      return {
        success: false,
        error: `Tier A+ price (₹${newAp}) cannot exceed Tier A price (₹${newA}).`
      };
    }

    setTierArticles(prev =>
      prev.map(a =>
        a.id === id ? { ...a, ...updates, tierAppPrice: newApp, tierApPrice: newAp, tierAPrice: newA } : a
      )
    );
    return { success: true };
  };

  // Cart Calculations
  const cartTotalBoxes = cartItems.reduce((sum, item) => sum + item.units, 0);
  const cartTotalPieces = cartItems.reduce((sum, item) => sum + (item.totalPieces || item.units * 10), 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.units * item.rate, 0);
  const cartGst = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const cartGrandTotal = Math.round((cartSubtotal + cartGst) * 100) / 100;

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keep portalMode and distributorNav in sync if URL searchParams change
  useEffect(() => {
    const currentMode = searchParams?.get("mode") || searchParams?.get("role") || searchParams?.get("portal");
    if (currentMode === "distributor" || currentMode === "wholesaler" || currentMode === "admin") {
      setPortalMode("distributor");
    } else if (currentMode === "retailer") {
      setPortalMode("retailer");
    }

    const currentRawView = searchParams?.get("view") || searchParams?.get("tab");
    if (currentRawView) {
      const normalizedView = currentRawView.trim().replace(/\s+/g, "-");
      const mapped =
        normalizedView === "products" ? "products-pricing" :
        normalizedView === "purchases" ? "purchase-bills" :
        normalizedView === "analytics" ? "reports" : normalizedView;
      setDistributorNav(mapped);
    }
  }, [searchParams]);

  // Sync active portalMode and distributor view to URL query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const urlMode = url.searchParams.get("mode");
    const urlView = url.searchParams.get("view");

    if (portalMode === "distributor") {
      if (urlMode !== "distributor" || urlView !== distributorNav) {
        url.searchParams.set("mode", "distributor");
        url.searchParams.set("view", distributorNav);
        window.history.pushState({}, "", url.toString());
      }
    } else {
      if (urlMode === "distributor") {
        url.searchParams.set("mode", "retailer");
        url.searchParams.delete("view");
        window.history.pushState({}, "", url.toString());
      }
    }
  }, [portalMode, distributorNav]);

  const openMatrixModal = (product: Product) => {
    setMatrixProduct(product);
  };

  const closeMatrixModal = () => {
    setMatrixProduct(null);
  };

  const addToCart = (newItems: OrderItem[]) => {
    setCartItems(prev => {
      const updated = [...prev];
      newItems.forEach(item => {
        const index = updated.findIndex(
          i => i.productId === item.productId && i.color === item.color && i.size === item.size
        );
        if (index > -1) {
          updated[index].units += item.units;
          updated[index].totalPieces += item.totalPieces;
        } else {
          updated.push(item);
        }
      });
      return updated;
    });
  };

  const updateCartItemQty = (productId: string, color: string, size: string, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.productId === productId && item.color === color && item.size === size) {
            const newUnits = item.units + delta;
            if (newUnits <= 0) return null;
            const singlePieces = item.totalPieces / item.units;
            return {
              ...item,
              units: newUnits,
              totalPieces: newUnits * singlePieces
            };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const removeCartItem = (productId: string, color: string, size: string) => {
    setCartItems(prev =>
      prev.filter(i => !(i.productId === productId && i.color === color && i.size === size))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const submitCurrentOrder = (transporter = "Navata Road Transport", notes = "") => {
    if (cartItems.length === 0) return;

    const retId = user?.type === "retailer" && user.retailerCode ? user.retailerCode : "RET-0001";
    const ret = retailers.find(r => r.code === retId || r.id === retId);
    const retName = user?.type === "retailer" ? user.name : (ret?.name || "Sri Laxmi Narasimha Textiles");
    const retTown = ret?.town || "Siddipet";

    const newOrderNumber = `ARK-${Math.floor(9200 + Math.random() * 700)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      retailerId: retId,
      retailerName: retName,
      retailerTown: retTown,
      date: currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "Submitted",
      totalBoxes: cartTotalBoxes,
      totalPieces: cartTotalPieces,
      subtotal: cartSubtotal,
      gstAmount: cartGst,
      grandTotal: cartGrandTotal,
      transporter,
      paymentStatus: "Credit Terms",
      items: [...cartItems]
    };

    setOrders(prev => {
      const updated = [newOrder, ...prev.filter(o => o.orderNumber !== "ARK-8902")];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ark_orders_v1", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
    setLastSubmittedOrder(newOrder);
    setCartItems([]);

    // Multi-tab instant sync via BroadcastChannel
    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("ark_orders_channel");
          bc.postMessage({ type: "NEW_ORDER", order: newOrder });
          bc.close();
        }
      } catch {}
    }

    // Sync new order to server (authoritative disk persistence)
    if (typeof window !== "undefined") {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      }).catch(err => console.error("Error posting order to server:", err));
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("ark_cart_v1");
      } catch {}
    }
    setIsReviewOrderOpen(false);
    setIsOrderSuccessOpen(true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const updateOrderStatus = (orderId: string, status: Order["status"], extra?: Partial<Order>) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId || order.orderNumber === orderId) {
          // Rule 4: An order can become Dispatched only with an issued invoice
          let invoiceNumber = order.invoiceNumber || extra?.invoiceNumber;
          if ((status === "Dispatched" || status === "Delivered") && !invoiceNumber) {
            invoiceNumber = `INV-00${Math.floor(100 + Math.random() * 899)}`;
          }

          return {
            ...order,
            status,
            invoiceNumber,
            ...extra
          };
        }
        return order;
      });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ark_orders_v1", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    // Multi-tab instant sync via BroadcastChannel
    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("ark_orders_channel");
          bc.postMessage({ type: "UPDATE_STATUS", orderId, status, extra });
          bc.close();
        }
      } catch {}
    }

    // Sync order update to server
    if (typeof window !== "undefined") {
      fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, extra }),
      }).catch(err => console.error("Error patching order on server:", err));
    }
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId && order.orderNumber !== orderId));
  };

  const approveRetailer = (
    id: string,
    tier: Retailer["pricingTier"],
    creditLimit: number,
    creditTermsDays: number = 30
  ) => {
    setRetailers(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextIndex = prev.filter(x => x.status === "Active").length + 1;
          const code = `RET-${String(nextIndex).padStart(4, "0")}`;
          return {
            ...r,
            code,
            status: "Active",
            pricingTier: tier,
            creditLimit: creditLimit,
            creditTermsDays: creditTermsDays,
          };
        }
        return r;
      })
    );
  };

  const rejectRetailer = (id: string, reason?: string) => {
    setRetailers(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: "Deactivated" as const,
            flags: reason ? `Rejected: ${reason}` : r.flags,
          };
        }
        return r;
      })
    );
  };

  const updateRetailer = (id: string, updates: Partial<Retailer>) => {
    setRetailers(prev =>
      prev.map(r => {
        if (r.id === id || r.code === id) {
          return { ...r, ...updates };
        }
        return r;
      })
    );
  };

  const toggleCreditHold = (retailerId: string) => {
    setRetailers(prev =>
      prev.map(r => {
        if (r.id === retailerId || r.code === retailerId || r.name.toLowerCase() === retailerId.toLowerCase()) {
          const newHold = !r.creditHold;
          return { ...r, creditHold: newHold };
        }
        return r;
      })
    );
  };

  const setCreditHold = (retailerId: string, hold: boolean) => {
    setRetailers(prev =>
      prev.map(r => {
        if (r.id === retailerId || r.code === retailerId || r.name.toLowerCase() === retailerId.toLowerCase()) {
          return { ...r, creditHold: hold };
        }
        return r;
      })
    );
  };

  const addInvoice = (inv: Invoice) => {
    setInvoices(prev => [inv, ...prev]);
  };

  const updateInvoice = (invId: string, updates: Partial<Invoice>) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invId || inv.invoiceNumber === invId) {
          return { ...inv, ...updates };
        }
        return inv;
      })
    );
  };

  const issueInvoice = (invId: string) => {
    let orderToConfirm: string | undefined;
    let issuedInvNumber: string | undefined;

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invId || inv.invoiceNumber === invId) {
          orderToConfirm = inv.orderNumber;
          issuedInvNumber = inv.invoiceNumber;
          const isOverdue = getDaysUntil(inv.dueDate, currentDate) < 0;
          return {
            ...inv,
            status: isOverdue ? "Overdue" : "Issued",
          };
        }
        return inv;
      })
    );

    // Rule 2: Issuing an invoice moves the order to Confirmed ("Invoiced")
    if (orderToConfirm) {
      updateOrderStatus(orderToConfirm, "Confirmed", {
        invoiceNumber: issuedInvNumber,
      });
    }
  };

  const recordReceipt = (
    retailerId: string,
    amount: number,
    method: string,
    ref: string,
    allocations: { [invId: string]: number }
  ) => {
    const totalApplied = Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0);

    // 1. Update Invoices
    setInvoices(prev =>
      prev.map(inv => {
        const allocated = allocations[inv.id] || allocations[inv.invoiceNumber] || 0;
        if (allocated > 0) {
          const newBal = Math.max(0, inv.balanceDue - allocated);
          const newPaid = (inv.paid || 0) + allocated;
          return {
            ...inv,
            paid: newPaid,
            balanceDue: newBal,
            status: newBal === 0 ? "Paid" : "Partly Paid",
            receiptRef: ref || inv.receiptRef,
          };
        }
        return inv;
      })
    );

    // 2. Update Retailer balance & overdue accurately
    setRetailers(prev =>
      prev.map(r => {
        const isTarget =
          r.id === retailerId ||
          r.code === retailerId ||
          r.name.toLowerCase().includes(retailerId.toLowerCase());

        if (isTarget) {
          const newOutstanding = Math.max(0, r.outstanding - totalApplied);

          // Calculate remaining overdue by checking each invoice for this retailer
          let remainingOverdue = 0;
          invoices.forEach(inv => {
            const matchesRet =
              inv.retailerId === r.id ||
              inv.retailerId === r.code ||
              inv.retailerName.toLowerCase().includes(r.name.toLowerCase());

            if (matchesRet) {
              const allocated = allocations[inv.id] || allocations[inv.invoiceNumber] || 0;
              const remainingBal = Math.max(0, inv.balanceDue - allocated);
              if (getDaysUntil(inv.dueDate, currentDate) < 0) {
                remainingOverdue += remainingBal;
              }
            }
          });

          return {
            ...r,
            outstanding: newOutstanding,
            overdue: remainingOverdue,
          };
        }
        return r;
      })
    );

    // 3. Record Payment transaction
    const targetRet = retailers.find(
      r => r.id === retailerId || r.code === retailerId || r.name.toLowerCase().includes(retailerId.toLowerCase())
    );
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      date: currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      retailerId: targetRet ? targetRet.id : retailerId,
      retailerName: targetRet ? targetRet.name : retailerId,
      invoiceNumber: Object.keys(allocations).find(k => (allocations[k] || 0) > 0) || "INV-0079",
      orderNumber: "—",
      amount,
      mode: (method as any) || "UPI",
      referenceId: ref,
      reconciled: true,
    };
    setPayments(prev => [newPayment, ...prev]);

    setIsReceiptModalOpen(false);
    setReceiptPrefillRetailerId(null);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        portalMode,
        setPortalMode,
        retailerNav,
        setRetailerNav,
        distributorNav,
        setDistributorNav,
        retailerSelectedBrand,
        setRetailerSelectedBrand,

        cartItems,
        cartTotalBoxes,
        cartTotalPieces,
        cartSubtotal,
        cartGst,
        cartGrandTotal,
        addToCart,
        updateCartItemQty,
        removeCartItem,
        clearCart,

        matrixProduct,
        openMatrixModal,
        closeMatrixModal,

        isReviewOrderOpen,
        setIsReviewOrderOpen,
        isOrderSuccessOpen,
        setIsOrderSuccessOpen,
        lastSubmittedOrder,
        submitCurrentOrder,

        orders,
        updateOrderStatus,
        deleteOrder,

        retailers,
        invoices,
        payments,
        approveRetailer,
        rejectRetailer,
        updateRetailer,
        toggleCreditHold,
        setCreditHold,
        recordReceipt,
        addInvoice,
        updateInvoice,
        issueInvoice,

        viewingInvoice,
        setViewingInvoice,
        isCreateInvoiceOpen,
        setIsCreateInvoiceOpen,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        receiptPrefillRetailerId,
        setReceiptPrefillRetailerId,
        activeRetailer,

        isSearchOpen,
        setIsSearchOpen,

        orderTabFilter,
        setOrderTabFilter,

        currentDate,

        selectedMonth,
        setSelectedMonth,

        suppliers,
        purchaseBills,
        addPurchaseBill,
        tierArticles,
        updateTierArticle,

        // CRM
        communications,
        addCommunication,
        complaints,
        addComplaint,
        updateComplaintStatus,
        followUps,
        addFollowUp,
        updateFollowUpStatus,
        rescheduleFollowUp,
        reassignFollowUp,
        retailerRequests,
        addRetailerRequest,
        updateRetailerRequestStatus,
        selectedRetailer360Id,
        setSelectedRetailer360Id,

        // Voice Calling Agent
        callTasks,
        scriptTemplates,
        approveCallTask,
        approveAllProposedTasks,
        cancelCallTask,
        executeSimulatedCall,
        updateScriptTemplate,
        updateRetailerVoicePreferences,
        generateCallTasksFromRules,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}


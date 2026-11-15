"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Complete mapping from Material Symbols icon names to Lucide icons.
 * All icons rendered with default strokeWidth 1.75 and standard sizes (16, 20, 24).
 */
export const MATERIAL_TO_LUCIDE_MAP: Record<string, keyof typeof LucideIcons> = {
  // Navigation & Actions
  close: "X",
  cancel: "XCircle",
  check: "Check",
  done: "Check",
  done_all: "CheckCheck",
  verified: "CheckCheck",
  check_circle: "CheckCircle2",
  task_alt: "CheckCircle2",
  assignment_turned_in: "ClipboardCheck",
  arrow_forward: "ArrowRight",
  arrow_back: "ArrowLeft",
  chevron_right: "ChevronRight",
  add: "Plus",
  add_circle: "PlusCircle",
  remove: "Minus",
  edit: "Edit3",
  edit_note: "FileEdit",
  edit_square: "PenTool",
  delete: "Trash2",
  save: "Save",
  search: "Search",
  tune: "SlidersHorizontal",
  filter_list: "Filter",
  more_horiz: "MoreHorizontal",
  more_vert: "MoreVertical",
  replay: "RotateCcw",
  autorenew: "RefreshCw",
  sync: "RefreshCw",
  lock: "Lock",
  block: "Ban",
  logout: "LogOut",
  open_in_new: "ExternalLink",
  dock_to_right: "PanelRight",
  visibility: "Eye",
  visibility_off: "EyeOff",

  // Alerts & Status
  warning: "AlertTriangle",
  report_problem: "AlertTriangle",
  error: "AlertCircle",
  error_outline: "AlertCircle",
  priority_high: "AlertCircle",
  info: "Info",
  help_outline: "HelpCircle",
  contact_support: "HelpCircle",
  production_quantity_limits: "AlertOctagon",

  // Business & Commerce
  storefront: "Store",
  store: "Store",
  shopping_bag: "ShoppingBag",
  shopping_cart: "ShoppingCart",
  add_shopping_cart: "ShoppingCart",
  receipt: "Receipt",
  receipt_long: "Receipt",
  request_quote: "FileSpreadsheet",
  description: "FileText",
  payments: "CreditCard",
  credit_score: "CreditCard",
  account_balance_wallet: "Wallet",
  account_balance: "Landmark",
  verified_user: "ShieldCheck",
  sell: "Tag",
  sell_out: "Tag",
  badge: "Award",

  // Logistics & Warehouse
  local_shipping: "Truck",
  inventory: "Boxes",
  inventory_2: "Package",
  factory: "Factory",
  domain_disabled: "Building",
  location_on: "MapPin",
  inbox: "Inbox",

  // Communications & Telecom / Voice
  chat: "MessageSquare",
  sms: "MessageSquare",
  call: "Phone",
  phone_in_talk: "PhoneCall",
  phone_callback: "PhoneIncoming",
  call_received: "PhoneIncoming",
  call_made: "PhoneOutgoing",
  record_voice_over: "Mic",
  smart_toy: "Bot",
  support_agent: "Headphones",
  send: "Send",
  send_to_mobile: "Smartphone",

  // Users & Organizations
  person: "User",
  account_box: "UserCheck",
  group: "Users",
  person_add: "UserPlus",
  person_off: "UserX",

  // Analytics & Charts
  show_chart: "LineChart",
  pie_chart: "PieChart",
  trending_down: "TrendingDown",
  trending_up: "TrendingUp",
  timer: "Timer",
  schedule: "Clock",
  today: "CalendarDays",
  calendar_month: "Calendar",
  event_repeat: "CalendarSync",

  // Media & Files
  download: "Download",
  file_download: "Download",
  image: "Image",
  add_a_photo: "Camera",
  add_photo_alternate: "ImagePlus",
  grid_view: "Grid",
  palette: "Palette",

  // Tech, AI & Accents
  auto_awesome: "Sparkles",
  auto_fix_high: "Wand2",
  fiber_new: "Sparkles",
  local_fire_department: "Flame",
  science: "FlaskConical",
  account_tree: "GitBranch",
  settings_suggest: "Settings",
  notifications: "Bell",
  notifications_active: "BellRing",

  // Apparel & Categories
  straighten: "Ruler",
  styler: "Scissors",
  checkroom: "Shirt",
  dry_cleaning: "Sparkle",

  // Themes
  light_mode: "Sun",
  dark_mode: "Moon",
  desktop_windows: "Monitor",
};

export type IconSize = 16 | 20 | 24 | number;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: IconSize;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

/**
 * Universal Icon component supporting both Lucide names and Material Symbols aliases.
 * Default stroke width is 1.75 per brand kit specifications.
 */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className = "",
  color,
  ...props
}: IconProps) {
  // Normalize name
  const trimmed = name.trim();

  // 1. Direct Lucide component match (e.g. "X", "CheckCircle")
  let ComponentName = (LucideIcons as Record<string, any>)[trimmed];

  // 2. Material mapping match (e.g. "close" -> "X", "check_circle" -> "CheckCircle2")
  if (!ComponentName && MATERIAL_TO_LUCIDE_MAP[trimmed]) {
    const mapped = MATERIAL_TO_LUCIDE_MAP[trimmed];
    ComponentName = (LucideIcons as Record<string, any>)[mapped];
  }

  // 3. Kebab-case to PascalCase match (e.g. "check-circle" -> "CheckCircle")
  if (!ComponentName) {
    const pascal = trimmed
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    ComponentName = (LucideIcons as Record<string, any>)[pascal];
  }

  // Fallback to Sparkles if unknown
  if (!ComponentName) {
    ComponentName = LucideIcons.Sparkles;
  }

  return (
    <ComponentName
      size={size}
      strokeWidth={strokeWidth}
      className={`shrink-0 inline-block align-middle ${className}`}
      color={color}
      {...props}
    />
  );
}

export default Icon;

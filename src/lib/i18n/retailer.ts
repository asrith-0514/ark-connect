// ============================================================================
// Bilingual (English & Telugu) i18n Strings for ARK Connect Retailer Portal
// ============================================================================

export type RetailerLanguage = "en" | "te";

export const RETAILER_I18N = {
  en: {
    // Navigation Tabs
    navHome: "Home",
    navShop: "Shop",
    navOrders: "Orders",
    navDues: "Dues",
    navAccount: "Account",

    // Top Bar
    searchPlaceholder: "Search style, brand, SKU...",
    notificationsTitle: "Notifications",
    noNotifications: "No new notifications",
    orderDispatched: "Order Dispatched",
    sameDayCutoff: "Same-day dispatch: 17:30 IST",

    // Home Screen
    namasteGreeting: "Namaste,",
    creditLine: "Credit Line",
    outstandingDues: "Outstanding Dues",
    overdueWarning: "Overdue Dues",
    viewDuesDetails: "View Statement & Pay →",
    reorderTitle: "Reorder Last Order",
    reorderSubtitle: "120 boxes • Navata Transport",
    reorderBtn: "Reorder",
    reorderSuccess: "Added 120 boxes to active PO!",
    browseBrands: "Shop by Brand",
    categoriesTitle: "Wholesale Categories",
    orderStatusTitle: "Active Dispatch Tracker",
    trackLR: "Track LR",
    lrNumber: "LR #",
    dispatchedVia: "via",
    inTransit: "In Transit",
    delivered: "Delivered",
    newArrivals: "New Arrivals",
    fastMoving: "Fast Moving Bestsellers",
    viewAll: "View All",

    // Shop / Catalogue
    allCategories: "All Items",
    allBrands: "All Brands",
    filterBtn: "Filters",
    filterTitle: "Filter Catalogue",
    applyFilters: "Apply Filters",
    resetFilters: "Reset",
    inStockOnly: "In Stock Only",
    pricePending: "Price Pending",
    boxOf: "Box of",
    pcs: "pcs",
    perPiece: "pc",
    selectSizes: "+ Add Sizes",
    previewVariants: "View Shades",
    hubStock: "In Stock",

    // PO Bar & Review
    activePO: "Active PO",
    boxes: "boxes",
    pieces: "pieces",
    reviewPO: "Review PO",
    reviewOrderTitle: "Review Purchase Order",
    cartEmpty: "Your draft order is empty",
    startShopping: "Browse Shop",
    transporterLabel: "Select Transporter",
    deliveryInstructions: "Delivery Notes & Landmark",
    deliveryPlaceholder: "e.g. Deliver to town godown near bustand",
    submitOrder: "Submit Purchase Order",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    grandTotal: "Total Amount",
  },
  te: {
    // Navigation Tabs
    navHome: "హోమ్",
    navShop: "షాప్",
    navOrders: "ఆర్డర్లు",
    navDues: "బాకీలు",
    navAccount: "ఖాతా",

    // Top Bar
    searchPlaceholder: "స్టైల్, బ్రాండ్, సైజు వెతకండి...",
    notificationsTitle: "నోటిఫికేషన్లు",
    noNotifications: "కొత్త నోటిఫికేషన్లు లేవు",
    orderDispatched: "ఆర్డర్ పంపబడింది",
    sameDayCutoff: "సేమ్-డే డిస్పాచ్: 17:30 IST",

    // Home Screen
    namasteGreeting: "నమస్తే,",
    creditLine: "క్రెడిట్ పరిమితి",
    outstandingDues: "మొత్తం బకాయి",
    overdueWarning: "గడువు దాటిన బాకీ",
    viewDuesDetails: "ఖాతా చూసి చెల్లించండి →",
    reorderTitle: "మునుపటి ఆర్డర్ మళ్లీ చేయండి",
    reorderSubtitle: "120 బాక్సులు • నవత ట్రాన్స్‌పోర్ట్",
    reorderBtn: "మళ్లీ ఆర్డర్",
    reorderSuccess: "120 బాక్సులు డ్రాఫ్ట్‌కు చేర్చబడ్డాయి!",
    browseBrands: "బ్రాండ్ల వారీగా కొనుగోలు",
    categoriesTitle: "హోల్‌సేల్ రకాలు",
    orderStatusTitle: "ప్రస్తుత ఆర్డర్ ట్రాకింగ్",
    trackLR: "LR ట్రాక్",
    lrNumber: "LR నంబర్",
    dispatchedVia: "ద్వారా",
    inTransit: "దారిలో ఉంది",
    delivered: "చేరింది",
    newArrivals: "కొత్తగా వచ్చినవి",
    fastMoving: "ఎక్కువగా అమ్ముడయ్యేవి",
    viewAll: "అన్నీ చూడండి",

    // Shop / Catalogue
    allCategories: "అన్ని రకాలు",
    allBrands: "అన్ని బ్రాండ్లు",
    filterBtn: "ఫిల్టర్లు",
    filterTitle: "కేటలాగ్ ఫిల్టర్లు",
    applyFilters: "ఫిల్టర్ వర్తింపజేయి",
    resetFilters: "రీసెట్",
    inStockOnly: "స్టాక్ ఉన్నవి మాత్రమే",
    pricePending: "ధర పెండింగ్",
    boxOf: "బాక్స్ లో",
    pcs: "పీసులు",
    perPiece: "పీస్",
    selectSizes: "+ సైజులు ఎంచుకోండి",
    previewVariants: "షేడ్లు చూడండి",
    hubStock: "స్టాక్ ఉంది",

    // PO Bar & Review
    activePO: "యాక్టివ్ ఆర్డర్",
    boxes: "బాక్సులు",
    pieces: "పీసులు",
    reviewPO: "ఆర్డర్ పరిశీలించండి",
    reviewOrderTitle: "ఆర్డర్ సమీక్ష",
    cartEmpty: "మీ ఆర్డర్ డ్రాఫ్ట్ ఖాళీగా ఉంది",
    startShopping: "షాపింగ్ ప్రారంభించండి",
    transporterLabel: "ట్రాన్స్‌పోర్ట్ ఎంచుకోండి",
    deliveryInstructions: "డెలివరీ సూచనలు & ల్యాండ్‌మార్క్",
    deliveryPlaceholder: "ఉదా. బస్టాండ్ దగ్గర ఉన్న గోడౌన్ వద్ద ఇవ్వండి",
    submitOrder: "ఆర్డర్ కన్ఫర్మ్ చేయండి",
    orderSummary: "ఆర్డర్ వివరాలు",
    subtotal: "మొత్తం ధర",
    gst: "GST (5%)",
    grandTotal: "చెల్లించవలసిన మొత్తం",
  },
};

export function getRetailerString(
  lang: RetailerLanguage,
  key: keyof typeof RETAILER_I18N.en
): string {
  return RETAILER_I18N[lang]?.[key] || RETAILER_I18N.en[key] || key;
}

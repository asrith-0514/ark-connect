const fs = require("fs");
const path = require("path");

const TODO_LIST = [
  "Petticoats styles for Ira and Jyothika: Flowchart indicates 'Plain' and 'Bra'. Confirm if 'Bra' refers to a specific Petticoat cut/style (e.g. Brassiere cut/Fish cut/Blouse-match) or separate innerwear.",
  "Prices, pcsPerBox, boxesPerCase, HSN and GST rates are placeholders pending distributor rate card confirmation.",
  "Specific shade shade-cards for Leggings (Ankle, Full length, Shimmer, Kurti pant, Saree shaper) and Petticoats to be detailed when physical shade cards arrive.",
  "Aswati Bra 888 and Mould bra: specific fabric composition and shade distribution to be confirmed (flowchart specifies 'Colors' and 'Size 75-100')."
];

// Palette helpers
const LEGGINGS_SHADES = [
  { name: "Jet Black", code: "BK", hex: "#0f172a" },
  { name: "Ink Navy", code: "NV", hex: "#1e3a8a" },
  { name: "Maroon", code: "MR", hex: "#881337" },
  { name: "Classic White", code: "WH", hex: "#ffffff" },
  { name: "Off White", code: "OW", hex: "#f8fafc" },
  { name: "Bottle Green", code: "BG", hex: "#14532d" },
  { name: "Mustard Gold", code: "MG", hex: "#d97706" },
  { name: "Royal Blue", code: "RB", hex: "#1d4ed8" },
];

const LEGGINGS_SIZES = ["Free Size", "XL", "2XL", "3XL"];

const PETTICOATS_SHADES = [
  { name: "Classic White", code: "WH", hex: "#ffffff" },
  { name: "Jet Black", code: "BK", hex: "#0f172a" },
  { name: "Skin Nude", code: "SK", hex: "#e7cba9" },
  { name: "Crimson Red", code: "RD", hex: "#dc2626" },
  { name: "Maroon", code: "MR", hex: "#881337" },
  { name: "Royal Navy", code: "NV", hex: "#1e3a8a" },
];

const PETTICOATS_SIZES = ["38 (Regular)", "40 (Large)", "42 (XL)", "44 (XXL)"];

// Within Colour Code sets
const WITHIN_CODE_SHADES = {
  BCM: { name: "Basic Colour Mix (BCM)", code: "BCM", hex: "#3b82f6" },
  DCM: { name: "Dark Colour Mix (DCM)", code: "DCM", hex: "#1e293b" },
  LCM: { name: "Light Colour Mix (LCM)", code: "LCM", hex: "#fde047" },
  MCM: { name: "Melange Colour Mix (MCM)", code: "MCM", hex: "#94a3b8" },
};

const PANTY_ASSORTED_SHADES = [
  { name: "Assorted Pastels", code: "AST", hex: "#f472b6" },
  { name: "Skin / Black / White", code: "SBW", hex: "#e7cba9" },
  { name: "Floral Print Mix", code: "FLR", hex: "#a855f7" },
];

// Active sample articles used in existing historical invoices/orders
// Keep their established net prices for reconciliation
const ACTIVE_PRICES = {
  "FB-LEG-ANKLE": { app: 325, ap: 345, a: 365, pcs: 10, pending: false },
  "FB-LEG-KURTI": { app: 340, ap: 360, a: 385, pcs: 10, pending: false },
  "FB-LEG-FULL": { app: 350, ap: 375, a: 400, pcs: 10, pending: false },
  "FB-LEG-SAREE": { app: 400, ap: 425, a: 450, pcs: 10, pending: false },
  "WN-BRA-CLARA": { app: 390, ap: 415, a: 440, pcs: 6, pending: false },
  "WN-PAN-BLOOMS": { app: 420, ap: 450, a: 480, pcs: 6, pending: false },
  "AS-BRA-KARISHMA": { app: 364, ap: 388, a: 410, pcs: 10, pending: false },
  "AS-BRA-SWEETY": { app: 364, ap: 388, a: 410, pcs: 10, pending: false },
};

const styles = [];

// ============================================================================
// 1. LEGGINGS (Flybirds, Flycute, Loveit)
// ============================================================================
const leggingsData = [
  {
    brand: "Flybirds",
    brandId: "flybirds",
    prefix: "FB",
    items: [
      { name: "Ankle leggings", code: "ANKLE", isShimmer: false },
      { name: "Full length leggings", code: "FULL", isShimmer: false },
      { name: "Shimmer leggings", code: "SHIM", isShimmer: true },
      { name: "Saree shaper", code: "SAREE", isShimmer: false },
      { name: "Kurti pant", code: "KURTI", isShimmer: false },
    ],
  },
  {
    brand: "Flycute",
    brandId: "flycute",
    prefix: "FC",
    items: [
      { name: "Ankle leggings", code: "ANKLE", isShimmer: false },
      { name: "Full length leggings", code: "FULL", isShimmer: false },
      { name: "Shimmer leggings", code: "SHIM", isShimmer: true },
      { name: "Kurti pants", code: "KURTI", isShimmer: false },
    ],
  },
  {
    brand: "Loveit",
    brandId: "loveit",
    prefix: "LV",
    items: [
      { name: "Ankle leggings", code: "ANKLE", isShimmer: false },
      { name: "Full length leggings", code: "FULL", isShimmer: false },
      { name: "Shimmer leggings", code: "SHIM", isShimmer: true },
      { name: "Kurti pants", code: "KURTI", isShimmer: false },
    ],
  },
];

leggingsData.forEach(bGroup => {
  bGroup.items.forEach(item => {
    const artNumber = `${bGroup.prefix}-LEG-${item.code}`;
    const pricing = ACTIVE_PRICES[artNumber] || { app: 0, ap: 0, a: 0, pcs: 10, pending: true };
    const id = `art-${bGroup.brandId}-leg-${item.code.toLowerCase()}`;

    styles.push({
      id,
      artNumber,
      brand: bGroup.brand,
      brandId: bGroup.brandId,
      category: "Leggings",
      styleName: item.name,
      title: `${bGroup.brand} ${item.name}`,
      description: `4-way stretch super combed cotton ${item.name} with reinforced elastic waistband.`,
      pcsPerBox: pricing.pcs,
      boxesPerCase: 60,
      packSize: `Box of ${pricing.pcs} pcs`,
      tierAppPrice: pricing.app,
      tierApPrice: pricing.ap,
      tierAPrice: pricing.a,
      pricePending: pricing.pending,
      hsnCode: "61046200",
      gstRate: 5,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      availableFits: undefined,
      availableShades: LEGGINGS_SHADES,
      availableSizes: LEGGINGS_SIZES,
      hubStock: 12000,
      hubStockBoxes: 1200,
      hubStockPieces: 12000,
      isActive: true,
    });
  });
});

// ============================================================================
// 2. PETTICOATS (Ira, Jyothika)
// ============================================================================
const petticoatsData = [
  { brand: "Ira", brandId: "ira", prefix: "IRA" },
  { brand: "Jyothika", brandId: "jyothika", prefix: "JYO" },
];

petticoatsData.forEach(pBrand => {
  ["Plain", "Bra"].forEach(styleName => {
    const code = styleName.toUpperCase();
    const artNumber = `${pBrand.prefix}-PET-${code}`;
    const id = `art-${pBrand.brandId}-pet-${code.toLowerCase()}`;

    styles.push({
      id,
      artNumber,
      brand: pBrand.brand,
      brandId: pBrand.brandId,
      category: "Petticoats",
      styleName: `${styleName} Petticoat`,
      title: `${pBrand.brand} ${styleName} Petticoat`,
      description: `Pure poplin 100% cotton ${styleName} petticoat with 6-panel contour tailored drape.`,
      pcsPerBox: 10,
      boxesPerCase: 50,
      packSize: "Box of 10 pcs",
      tierAppPrice: 0,
      tierApPrice: 0,
      tierAPrice: 0,
      pricePending: true,
      hsnCode: "62089100",
      gstRate: 5,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGNX3N4bECmULI--eixseQDph7ULZiPTbB0GFbULm-xspMssEUzEs5QfjFYzFGokpBz82dReM0WPlIxAw4eFYkaFxIVjyvG4VrWQiACe0vqr9l0-elREOhFT0s1bdZMNgHsl0F2dC0nZhQW4j8uxl4-Ta_VX-zBnGcoQOLWaWR_QIJIKIc720D3JESIItBSaygiwLUoXlWR5V1_TP8cAWvT1oTVrDiq1c6W0zvd29",
      availableFits: undefined,
      availableShades: PETTICOATS_SHADES,
      availableSizes: PETTICOATS_SIZES,
      hubStock: 8000,
      hubStockBoxes: 800,
      hubStockPieces: 8000,
      isActive: true,
    });
  });
});

// ============================================================================
// 3. WITHIN (Bras & Panties)
// ============================================================================
const withinBras = [
  { name: "Activa plus", code: "ACTIVA", fits: ["B"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Begina plus", code: "BEGINA", fits: ["B"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["S", "M", "L", "XL"] },
  {
    name: "Clara",
    code: "CLARA",
    fits: ["B", "C"],
    colorCodes: ["BCM", "DCM", "LCM"],
    sizes: ["30", "32", "34", "36", "38", "40"],
    fitNotes: "B fit: BCM, DCM, LCM 30-40 | C fit: BCM 30-40, DCM 32-40, LCM 32-40",
  },
  { name: "Cozy fit", code: "COZY", fits: ["B"], colorCodes: ["BCM", "MCM"], sizes: ["XL", "2XL"] },
  {
    name: "Curva",
    code: "CURVA",
    fits: ["B", "C"],
    colorCodes: ["BCM", "DCM", "LCM"],
    sizes: ["32", "34", "36", "38", "40"],
    fitNotes: "B fit: BCM, DCM, LCM 32-40 | C fit: BCM 32-40",
  },
  { name: "Daily fit", code: "DAILY", fits: ["B"], colorCodes: ["BCM", "MCM"], sizes: ["S", "M", "L", "XL", "2XL"] },
  { name: "Ease fit", code: "EASE", fits: ["B"], colorCodes: ["BCM"], sizes: ["S", "M", "L", "XL", "2XL"] },
  { name: "Essensa premium", code: "ESSENSA", fits: ["B"], colorCodes: ["LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Femina premium", code: "FEMINA", fits: ["D"], colorCodes: ["LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Flexa", code: "FLEXA", fits: ["D"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40", "42"] },
  { name: "Flora", code: "FLORA", fits: ["B"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Foama", code: "FOAMA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Forta", code: "FORTA", fits: ["B"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Lacta", code: "LACTA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Luxa", code: "LUXA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"], fitNotes: "B fit: BCM, DCM, LCM | C fit: LCM" },
  { name: "Prima", code: "PRIMA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"], fitNotes: "B fit: BCM, DCM, LCM | C fit: BCM, DCM" },
  { name: "Sara", code: "SARA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
  { name: "Softa", code: "SOFTA", fits: ["B", "C"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"], fitNotes: "B fit: LCM | C fit: BCM, DCM, LCM" },
  { name: "Sporta", code: "SPORTA", fits: ["B"], colorCodes: ["MCM"], sizes: ["S", "M", "L", "XL"] },
  { name: "Teena print", code: "TEENA", fits: ["B"], colorCodes: ["MCM"], sizes: ["S", "M", "L", "XL"] },
  { name: "Versa", code: "VERSA", fits: ["B"], colorCodes: ["BCM", "DCM", "LCM"], sizes: ["32", "34", "36", "38", "40"] },
];

withinBras.forEach(bra => {
  const artNumber = `WN-BRA-${bra.code}`;
  const pricing = ACTIVE_PRICES[artNumber] || { app: 0, ap: 0, a: 0, pcs: 6, pending: true };
  const id = `art-within-bra-${bra.code.toLowerCase()}`;
  const shades = bra.colorCodes.map(code => WITHIN_CODE_SHADES[code]);

  styles.push({
    id,
    artNumber,
    brand: "Within",
    brandId: "within",
    category: "Bras",
    styleName: bra.name,
    title: `Within ${bra.name}`,
    description: `Engineered support bra with ${bra.fits.join("/")} fit options and ${bra.colorCodes.join("/")} shade packs.`,
    pcsPerBox: pricing.pcs,
    boxesPerCase: 48,
    packSize: `Box of ${pricing.pcs} pcs`,
    tierAppPrice: pricing.app,
    tierApPrice: pricing.ap,
    tierAPrice: pricing.a,
    pricePending: pricing.pending,
    hsnCode: "62121000",
    gstRate: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
    availableFits: bra.fits,
    availableShades: shades,
    availableSizes: bra.sizes,
    hubStock: 9000,
    hubStockBoxes: 1500,
    hubStockPieces: 9000,
    isActive: true,
  });
});

const withinPanties = [
  { name: "Aaina blooms", code: "BLOOMS", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] },
  { name: "Aaina modal plain SLD", code: "MODAL-SLD", sizes: ["M", "L", "XL"] },
  { name: "Aaina modal print", code: "MODAL-PRT", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] },
  { name: "Aura print", code: "AURA-PRT", sizes: ["M", "L", "XL", "2XL", "3XL"] },
  { name: "Grace plain SLD", code: "GRACE-SLD", sizes: ["M", "L", "XL", "2XL"] },
];

withinPanties.forEach(pan => {
  const artNumber = `WN-PAN-${pan.code}`;
  const pricing = ACTIVE_PRICES[artNumber] || { app: 0, ap: 0, a: 0, pcs: 6, pending: true };
  const id = `art-within-pan-${pan.code.toLowerCase()}`;

  styles.push({
    id,
    artNumber,
    brand: "Within",
    brandId: "within",
    category: "Panties",
    styleName: pan.name,
    title: `Within ${pan.name}`,
    description: `Featherlight modal/cotton stretch hipster panties with comfort waistband and bonded seams.`,
    pcsPerBox: pricing.pcs,
    boxesPerCase: 48,
    packSize: `Box of ${pricing.pcs} pcs`,
    tierAppPrice: pricing.app,
    tierApPrice: pricing.ap,
    tierAPrice: pricing.a,
    pricePending: pricing.pending,
    hsnCode: "61082100",
    gstRate: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
    availableFits: undefined,
    availableShades: PANTY_ASSORTED_SHADES,
    availableSizes: pan.sizes,
    hubStock: 6600,
    hubStockBoxes: 1100,
    hubStockPieces: 6600,
    isActive: true,
  });
});

// ============================================================================
// 4. ASWATI (Bras & Panties)
// ============================================================================
const aswatiBras = [
  {
    name: "Bra 888",
    code: "888",
    shades: [{ name: "Colors Assorted", code: "CLR", hex: "#f59e0b" }],
    sizes: ["75", "80", "85", "90", "95", "100"],
  },
  {
    name: "Karishma",
    code: "KARISHMA",
    shades: [
      { name: "Black", code: "BK", hex: "#0f172a" },
      { name: "Color", code: "CLR", hex: "#ec4899" },
      { name: "Skin", code: "SK", hex: "#e7cba9" },
      { name: "White", code: "WH", hex: "#ffffff" },
      { name: "WBS mix (White, Black, Skin)", code: "WBS", hex: "#64748b" },
    ],
    sizes: ["65-70", "75-90", "95-100"],
  },
  {
    name: "Mould bra",
    code: "MOULD",
    shades: [{ name: "Standard Nude / Assorted", code: "STD", hex: "#e7cba9" }],
    sizes: ["75", "80", "85", "90", "95", "100"],
  },
  {
    name: "Sports bra",
    code: "SPORTS",
    shades: [
      { name: "Black", code: "BK", hex: "#0f172a" },
      { name: "Colors", code: "CLR", hex: "#8b5cf6" },
      { name: "Skin", code: "SK", hex: "#e7cba9" },
      { name: "White", code: "WH", hex: "#ffffff" },
      { name: "WBS mix (White, Black, Skin)", code: "WBS", hex: "#64748b" },
    ],
    sizes: ["75-90", "95-100"],
  },
  {
    name: "Sweety adj",
    code: "SWEETY",
    shades: [
      { name: "Black", code: "BK", hex: "#0f172a" },
      { name: "Color", code: "CLR", hex: "#f43f5e" },
      { name: "Skin", code: "SK", hex: "#e7cba9" },
      { name: "White", code: "WH", hex: "#ffffff" },
      { name: "WBS mix (White, Black, Skin)", code: "WBS", hex: "#64748b" },
    ],
    sizes: ["75-90", "95-100"],
  },
];

aswatiBras.forEach(bra => {
  const artNumber = `AS-BRA-${bra.code}`;
  const pricing = ACTIVE_PRICES[artNumber] || { app: 0, ap: 0, a: 0, pcs: 10, pending: true };
  const id = `art-aswati-bra-${bra.code.toLowerCase()}`;

  styles.push({
    id,
    artNumber,
    brand: "Aswati",
    brandId: "aswati",
    category: "Bras",
    styleName: bra.name,
    title: `Aswati ${bra.name}`,
    description: `All items box packed. Durable everyday cotton support bra with reinforced seam construction.`,
    pcsPerBox: pricing.pcs,
    boxesPerCase: 60,
    packSize: `Box of ${pricing.pcs} pcs`,
    tierAppPrice: pricing.app,
    tierApPrice: pricing.ap,
    tierAPrice: pricing.a,
    pricePending: pricing.pending,
    hsnCode: "62121000",
    gstRate: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
    availableFits: undefined,
    availableShades: bra.shades,
    availableSizes: bra.sizes,
    hubStock: 14000,
    hubStockBoxes: 1400,
    hubStockPieces: 14000,
    isActive: true,
  });
});

const aswatiPanties = [
  { name: "Mody print", code: "MODY-PRT", sizes: ["75-100 (75, 80, 85, 90, 95, 100)"] },
  { name: "Priya print", code: "PRIYA-PRT", sizes: ["75-100 (75, 80, 85, 90, 95, 100)"] },
  { name: "Priya plain", code: "PRIYA-PLN", sizes: ["75-100 (75, 80, 85, 90, 95, 100)"] },
];

aswatiPanties.forEach(pan => {
  const artNumber = `AS-PAN-${pan.code}`;
  const pricing = ACTIVE_PRICES[artNumber] || { app: 0, ap: 0, a: 0, pcs: 10, pending: true };
  const id = `art-aswati-pan-${pan.code.toLowerCase()}`;

  styles.push({
    id,
    artNumber,
    brand: "Aswati",
    brandId: "aswati",
    category: "Panties",
    styleName: pan.name,
    title: `Aswati ${pan.name} Panties`,
    description: `All items are box packed. Pure combed cotton daily comfort panties with soft elastic.`,
    pcsPerBox: pricing.pcs,
    boxesPerCase: 60,
    packSize: `Box of ${pricing.pcs} pcs`,
    tierAppPrice: pricing.app,
    tierApPrice: pricing.ap,
    tierAPrice: pricing.a,
    pricePending: pricing.pending,
    hsnCode: "61082100",
    gstRate: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
    availableFits: undefined,
    availableShades: PANTY_ASSORTED_SHADES,
    availableSizes: ["75 cm", "80 cm", "85 cm", "90 cm", "95 cm", "100 cm"],
    hubStock: 9500,
    hubStockBoxes: 950,
    hubStockPieces: 9500,
    isActive: true,
  });
});

// Generate variants for each style
styles.forEach(style => {
  const variants = [];
  const fits = style.availableFits || [undefined];
  
  fits.forEach(fit => {
    style.availableShades.forEach(shade => {
      style.availableSizes.forEach(size => {
        variants.push({
          id: `${style.id}-${fit ? fit.toLowerCase() + '-' : ''}${shade.code ? shade.code.toLowerCase() : 'sh'}-${size.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          fit,
          shade,
          size,
          stockBoxes: Math.floor(style.hubStockBoxes / (style.availableShades.length * style.availableSizes.length * (fits.length || 1))) || 20,
        });
      });
    });
  });
  style.variants = variants;
});

const output = {
  _todo: TODO_LIST,
  metadata: {
    totalStyles: styles.length,
    totalBrands: 7,
    categories: ["Leggings", "Petticoats", "Bras", "Panties"],
    updatedAt: new Date().toISOString(),
  },
  styles,
};

fs.writeFileSync(
  path.join(__dirname, "../src/lib/mock/catalogue.seed.json"),
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log(`Generated catalogue.seed.json with ${styles.length} styles.`);

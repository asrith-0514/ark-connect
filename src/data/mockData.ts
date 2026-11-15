// Data module re-exporting unified mock dataset from @/lib/mock
export * from "@/lib/mock";
import { MOCK_TIER_ARTICLES, TierPricingArticle, PricingTier } from "@/lib/mock";

export interface ProductVariant {
  color: string;
  colorHex: string;
  sizes: { [size: string]: number }; // quantity in stock or selected
}

export interface Product {
  id: string;
  artNumber: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  pricePerUnit: number;
  unitLabel: string; // e.g. "box (10 pcs)" or "pack (6 pcs)"
  piecesPerUnit: number;
  minOrderUnits: number;
  minOrderLabel: string;
  stockUnits: number;
  stockStatus: string;
  image: string;
  hsnCode: string;
  shades: { name: string; hex: string; code?: string }[];
  sizes: string[];

  // Real product structure fields
  pricePending?: boolean;
  pcsPerBox?: number;
  boxesPerCase?: number;
  availableFits?: string[];
  variants?: any[];

  // Compatibility aliases
  name?: string;
  sku?: string;
  imageUrl?: string;
  fabric?: string;
  wholesaleRate?: number;
  unitType?: string;
  piecesPerBox?: number;
  inStockCount?: number;
  minPack?: number;
}

// Visual catalog metadata lookup by artNumber to keep single source of truth for pricing/packs in MOCK_TIER_ARTICLES
const PRODUCT_METADATA_BY_ART: Record<string, {
  description: string;
  image: string;
  shades: { name: string; hex: string; code?: string }[];
  sizes: string[];

  // Real product structure fields
  pricePending?: boolean;
  pcsPerBox?: number;
  boxesPerCase?: number;
  availableFits?: string[];
  variants?: any[];
  minOrderUnits?: number;
}> = {
  "FB-104": {
    description: "Fine gauge 1x1 rib knit 100% carded cotton yarn with reinforced tubular seams for daily durability.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHHdIE1pHGl-Q9KYNUbi4SpTBWu_MBvQXNKQSwSDNs5LvshtzB4FKUhcAkzs2HfhhtWIUGgeqswPW-cp64SGsDItoYVzgsa9f4z5OxU5Yx1r1xVLbuHrf0QOBFRfHh-D9a3YSfGS9r25kqv-MZblfK2EnEyKViwc75dMvksdD2tOH0gmVLsepEz3KB1ztzbr2Ip4BTQayLXGEaJ_Gtmj4vhAVVBCQLqgNbctzRxyX",
    shades: [
      { name: "Classic White", hex: "#ffffff" },
      { name: "Heather Grey", hex: "#cbd5e1" },
      { name: "Jet Black", hex: "#0f172a" },
    ],
    sizes: ["S (75 cm)", "M (80 cm)", "L (85 cm)", "XL (90 cm)", "XXL (95 cm)"],
    minOrderUnits: 5,
  },
  "FB-301": {
    description: "100% Super combed long-staple cotton with moisture-wicking anti-chafing waistband. Pre-shrunk weave.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4wQ-vTj2W2WJrRMuJcXYaFeZL3BBYu_kFLhg_oaZed6mT3HadsSwAzj3a_UKXQ947nkedpWxP8ZEbH_Vwzfj4P-uwsBwGupaEUwaw4o6pQiLaCUUL2uR-GL1zjZIHimJk9-1lOQYxa7a2i45FzNin32bRZX0siNwAh-883T50IMQF2ILIRKGBGpQmyYMLnBhdhQYHcXpGb_n4VV1afhFqKO-8_S75_f0OtWvvjmoC",
    shades: [
      { name: "Jet Black", hex: "#0f172a" },
      { name: "Ink Navy", hex: "#1e3a8a" },
      { name: "Heather Grey", hex: "#cbd5e1" },
      { name: "Classic White", hex: "#ffffff" },
    ],
    sizes: ["S (75 cm)", "M (80 cm)", "L (85 cm)", "XL (90 cm)", "XXL (95 cm)"],
    minOrderUnits: 5,
  },
  "WN-220": {
    description: "Bonded laser-cut edges with micro-modal stretch fabric. Zero panty lines, featherlight breathability.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
    shades: [
      { name: "Nude Skin", hex: "#e7cba9" },
      { name: "Blush Pink", hex: "#fbcfe8" },
      { name: "Jet Black", hex: "#0f172a" },
    ],
    sizes: ["S", "M", "L", "XL"],
    minOrderUnits: 6,
  },
  "WN-105": {
    description: "Stretch elastane-cotton slip camisole with delicate lace scallop trims and adjustable satin straps.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAekMAHlmbovaLUy1WMuTECSKqKxxfUehYd_WizCHWu7hBc0aadRwqSltwDUEbqgL4RqoOdp8JGovxtJ3AuFuIY6UcifABH8nKub5xer2JuFhzz80eIF5qBf-JzbglS8fscD3BCmiCNHggl84Nvmit0KJ9CAdvRiqkRZJ-w7UXjajTeQV4wF18td3qJhKnwSuULUFWzRfnLc0C5fCwOZGEzZPVhCT6yUW2GJBVcNlsB",
    shades: [
      { name: "Pure White", hex: "#ffffff" },
      { name: "Soft Black", hex: "#1e293b" },
      { name: "Skin Nude", hex: "#e7cba9" },
    ],
    sizes: ["30B", "32B", "34B", "36B", "38B"],
    minOrderUnits: 6,
  },
  "SP-550": {
    description: "Bio-washed breathable modal blend woven lounge bottom with dual side pockets and elasticated drawstring.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnMbdcYNS5zFHOUvxIJMPH7rbsy7dDLo_MYJ5ATMKbNJQDgRQ-a_t-XVmmlg36EkD19kcWMtbaPfEnkQohiu0-K7jpQDhaTRp6DUaCe-VaRZgIOGIkyqq4VjIiRsq02UDMszRIlZas1beI4LGwWSDR0_y-mMtDB9u__V9p0LyoajnWGcvOvu7ovY3v3L1Yfk2_9h3eubQGL6T7Dqn0nRZcfhFyLcoP6T42bk_L-6KG",
    shades: [
      { name: "Navy Check", hex: "#1e3a8a" },
      { name: "Charcoal Grid", hex: "#334155" },
      { name: "Olive Tartan", hex: "#3f6212" },
    ],
    sizes: ["M (30-32)", "L (34-36)", "XL (38-40)", "XXL (42-44)"],
    minOrderUnits: 3,
  },
  "SP-810": {
    description: "Ultra-soft Lenzing Modal sleepwear with elastic waistband and anti-microbial bio-wash coating.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXbV1J-P39hSLjAPYCiOzEc5VNvRjIvxf7PyCwA2PwGnl-OttM_fOhd1MKRaJzDTBui71mEQmXFw898GMXMPMg3xB1LaoYDnquV_ydyngQoPDuQPBM8pgto5tGiMOvyBplZ7xMQ6tF48vPKpVTNVobQw_VpflC7NYN42CNWJzTLuE_PUztVEgARPvxJ78aabzOAaQDd42RON9Z27TaVt-fTeu03xx08w2Mg4e-qC7d",
    shades: [
      { name: "Sky Stripe", hex: "#7dd3fc" },
      { name: "Mint Green", hex: "#a7f3d0" },
      { name: "Pastel Lemon", hex: "#fef08a" },
    ],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-10Y"],
    minOrderUnits: 4,
  },
  "AS-501": {
    description: "Classic south Indian fine count single dhoti with zari gold border, woven from 100% pure combed cotton.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
    shades: [
      { name: "Bleached White", hex: "#ffffff" },
      { name: "Natural Ivory", hex: "#fef3c7" },
    ],
    sizes: ["Single (4 Mtr)", "Double (8 Mtr)"],
    minOrderUnits: 2,
  },
  "AS-102": {
    description: "Premium pure combed cotton banian vest with reinforced armholes and sweat-absorbent weave.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkHF7QBgfUImLnIA-TLyT2prQjwR8lKSXZKCTP9Kz11JyU7m6dB7kLxucrQvIssfykUkz9kVeCDf6n-0XExnlYThTyCi1148pDJ7zTHLj5EEBhpPiu_2D9VloYxji4-jyqsxjF00HywHOUmjXdiiSRWDQTpMeYpKykcwsAaqgBiuAizg_bc9uusm4v_aGoPM6k1CzUyBqCkmBEvilMGkR91JvMBMrajC82Ks1WioW5",
    shades: [
      { name: "Off White", hex: "#f8fafc" },
      { name: "Bleached White", hex: "#ffffff" },
    ],
    sizes: ["S (75 cm)", "M (80 cm)", "L (85 cm)", "XL (90 cm)", "XXL (95 cm)"],
    minOrderUnits: 5,
  },
  "FC-102": {
    description: "Super soft combed cotton bloomer pack with soft jacquard waistband, safe for sensitive skin.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfGNsdy_BnL79sV-awB5b_G_sjiXgACVKk6fcbPbTFUS65T-iR9XUFNHRYoRyONL3Sk9gG8w0Ov4g6e9J9FtKBbWYrMhMOurAMQMQz8DrnhYf4zRdMWBOxeQCuLBvOHfBDIrQOdLge-XTPErm1Uv6Ilr-yw4r3hEU69L-hSSZF4e9Gdqu5UlvZeSLNi3RR2gYeo4OXd2_a1uGxgloFaHbvtvlne-5BDNKvhbucuQNT",
    shades: [
      { name: "Pink Print", hex: "#fbcfe8" },
      { name: "Yellow Duck", hex: "#fef08a" },
      { name: "Sky Cloud", hex: "#bae6fd" },
    ],
    sizes: ["0-1Y", "1-2Y", "2-3Y", "3-4Y"],
    minOrderUnits: 4,
  },
  "FC-204": {
    description: "Infant ribbed cotton body suit vest with snap button gusset and expandable envelope neckline.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
    shades: [
      { name: "Pastel Mint", hex: "#a7f3d0" },
      { name: "Baby Pink", hex: "#fbcfe8" },
      { name: "Pure White", hex: "#ffffff" },
    ],
    sizes: ["0-3M", "3-6M", "6-12M"],
    minOrderUnits: 4,
  },
  "EX-701": {
    description: "Three-layer polyfill brushed warm interlock with heat-retention core and ribbed anti-curl cuffs.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZnpDA_fzKj4akJGwHxl1lzd9m4HAGcT0qABQQTmkffoPr9v1KUYtS7PMTc6ok8E3RsJ3EjdX_qxd0YmwfHaMfRgsBtUHBpf4k9weNC5MFUGp96ySC8C-YXxhZqMaxexI9NgTFUtOshQB64301CR1Dy85nbcnpLyeYKtNBJko5epOy2vOk6QFQzZb1aWaHd_nmMpiYRVANwwIMLSY3TQiPLgI_Sj21SqHoeo8tZued",
    shades: [
      { name: "Charcoal Melange", hex: "#334155" },
      { name: "Off White", hex: "#f8fafc" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    minOrderUnits: 3,
  },
  "LC-401": {
    description: "Cotton comfort slip camisole with adjustable straps and soft hand-feel rib fabric.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAekMAHlmbovaLUy1WMuTECSKqKxxfUehYd_WizCHWu7hBc0aadRwqSltwDUEbqgL4RqoOdp8JGovxtJ3AuFuIY6UcifABH8nKub5xer2JuFhzz80eIF5qBf-JzbglS8fscD3BCmiCNHggl84Nvmit0KJ9CAdvRiqkRZJ-w7UXjajTeQV4wF18td3qJhKnwSuULUFWzRfnLc0C5fCwOZGEzZPVhCT6yUW2GJBVcNlsB",
    shades: [
      { name: "Skin Nude", hex: "#e7cba9" },
      { name: "Pure White", hex: "#ffffff" },
      { name: "Jet Black", hex: "#0f172a" },
    ],
    sizes: ["75 cm", "80 cm", "85 cm", "90 cm"],
    minOrderUnits: 4,
  },
  "MX-301": {
    description: "30s super heavy combed cotton banian vest engineered for long-lasting daily workwear.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHHdIE1pHGl-Q9KYNUbi4SpTBWu_MBvQXNKQSwSDNs5LvshtzB4FKUhcAkzs2HfhhtWIUGgeqswPW-cp64SGsDItoYVzgsa9f4z5OxU5Yx1r1xVLbuHrf0QOBFRfHh-D9a3YSfGS9r25kqv-MZblfK2EnEyKViwc75dMvksdD2tOH0gmVLsepEz3KB1ztzbr2Ip4BTQayLXGEaJ_Gtmj4vhAVVBCQLqgNbctzRxyX",
    shades: [
      { name: "Classic White", hex: "#ffffff" },
      { name: "Heather Grey", hex: "#cbd5e1" },
    ],
    sizes: ["80 cm", "85 cm", "90 cm", "95 cm", "100 cm"],
    minOrderUnits: 5,
  },
  "LS-101": {
    description: "AZO-free certified non-toxic newborn jabla vest set with tie-up closures for supreme infant safety.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
    shades: [
      { name: "Baby Yellow", hex: "#fef08a" },
      { name: "Baby Blue", hex: "#bae6fd" },
      { name: "Baby Pink", hex: "#fbcfe8" },
    ],
    sizes: ["0-3M", "3-6M"],
    minOrderUnits: 4,
  },
};

/**
 * Builds the unified retailer product catalogue from MOCK_TIER_ARTICLES (Single Source of Truth).
 * Net price for each article is derived directly from the Backoffice tier price for that retailer's tier.
 * Sri Laxmi Narasimha Textiles (RET-0001) defaults to Tier A++.
 */
export function buildRetailerProductsFromArticles(
  articles: TierPricingArticle[] = MOCK_TIER_ARTICLES,
  retailerTier: PricingTier = "Tier A++"
): Product[] {
  return articles.map((art, idx) => {
    const meta = PRODUCT_METADATA_BY_ART[art.artNumber] || {
      description: `${art.brand} ${art.title}. Wholesale pack with guaranteed hub stock.`,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHHdIE1pHGl-Q9KYNUbi4SpTBWu_MBvQXNKQSwSDNs5LvshtzB4FKUhcAkzs2HfhhtWIUGgeqswPW-cp64SGsDItoYVzgsa9f4z5OxU5Yx1r1xVLbuHrf0QOBFRfHh-D9a3YSfGS9r25kqv-MZblfK2EnEyKViwc75dMvksdD2tOH0gmVLsepEz3KB1ztzbr2Ip4BTQayLXGEaJ_Gtmj4vhAVVBCQLqgNbctzRxyX",
      shades: [
        { name: "Classic White", hex: "#ffffff" },
        { name: "Jet Black", hex: "#0f172a" },
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      minOrderUnits: 3,
    };

    // Requirement 4: Retailer net price comes from the Backoffice tier price for that retailer's tier
    const netPrice =
      retailerTier === "Tier A++"
        ? art.tierAppPrice
        : retailerTier === "Tier A+"
        ? art.tierApPrice
        : art.tierAPrice;

    const unitShort = art.packSize.toLowerCase().includes("box")
      ? "box"
      : art.packSize.toLowerCase().includes("bundle")
      ? "bundle"
      : "pack";

    const isPending = art.pricePending === true;
    const shades = (art as any).availableShades || meta.shades;
    const sizes = (art as any).availableSizes || meta.sizes;

    return {
      id: `prod-${art.artNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      artNumber: art.artNumber,
      title: art.title,
      name: art.title,
      brand: art.brand,
      category: art.category,
      description: (art as any).description || meta.description,
      packSize: art.packSize,
      pricePerUnit: isPending ? 0 : netPrice,
      wholesaleRate: isPending ? 0 : netPrice,
      unitLabel: `${unitShort} (${art.piecesPerPack} pcs)`,
      unitType: unitShort,
      piecesPerUnit: art.piecesPerPack,
      piecesPerBox: art.piecesPerPack,
      minOrderUnits: 1,
      minOrderLabel: `Min order: 1 ${unitShort}`,
      stockUnits: art.hubStock ?? (art as any).hubStockPieces ?? 1000,
      stockStatus: `${(art.hubStock ?? (art as any).hubStockPieces ?? 1000).toLocaleString("en-IN")} pcs in Hub`,
      image: (art as any).image || meta.image,
      imageUrl: (art as any).image || meta.image,
      hsnCode: art.hsnCode || "61091000",
      shades,
      sizes,
      pricePending: isPending,
      pcsPerBox: art.pcsPerBox || art.piecesPerPack,
      boxesPerCase: art.boxesPerCase || 60,
      availableFits: art.availableFits,
      variants: (art as any).variants,
    };
  });
}

// Canonical retailer product catalogue, strictly derived from MOCK_TIER_ARTICLES
export const MOCK_PRODUCTS: Product[] = buildRetailerProductsFromArticles(MOCK_TIER_ARTICLES, "Tier A++");


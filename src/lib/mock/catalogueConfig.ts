// ============================================================================
// Single Configuration for all Brands and Categories in the ARK Platform
// Update brand spellings, active status, or taglines here in ONE place.
// ============================================================================

export interface BrandConfig {
  id: string;
  name: string;
  shortCode: string;
  tagline: string;
  description: string;
  categories: string[];
  stockPercentage: string;
  minOrder: string;
  accentColor: string;
  image: string;
  badge: string;
  colorConfig: {
    bgTint: string;
    borderTint: string;
    textCol: string;
    accentBadge: string;
  };
}

export const CATEGORIES_CONFIG = [
  "Leggings",
  "Petticoats",
  "Bras",
  "Panties",
] as const;

export type ProductCategory = (typeof CATEGORIES_CONFIG)[number];

export const BRANDS_CONFIG: Record<string, BrandConfig> = {
  flybirds: {
    id: "flybirds",
    name: "Flybirds",
    shortCode: "FB",
    tagline: "Premium Stretch Leggings & Bottoms",
    description: "High-density super combed 4-way stretch leggings, kurti pants, and contouring saree shapers.",
    categories: ["Leggings"],
    stockPercentage: "99% In Stock",
    minOrder: "1 Master Case (60 pcs)",
    accentColor: "bg-primary text-primary-foreground",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
    badge: "Bestseller: 4-Way Stretch Leggings",
    colorConfig: {
      bgTint: "bg-[#3B3BF5]/5 dark:bg-[#7C7CFF]/10",
      borderTint: "border-[#3B3BF5]/20 dark:border-[#7C7CFF]/25",
      textCol: "text-[#3B3BF5] dark:text-[#7C7CFF]",
      accentBadge: "bg-[#3B3BF5]/15 text-[#3B3BF5] dark:text-[#7C7CFF]",
    },
  },
  flycute: {
    id: "flycute",
    name: "Flycute",
    shortCode: "FC",
    tagline: "Fashion & Shimmer Leggings",
    description: "Vibrant everyday ankle, full length, shimmer leggings and trendy kurti pants.",
    categories: ["Leggings"],
    stockPercentage: "95% In Stock",
    minOrder: "2 Cartons (48 pcs)",
    accentColor: "bg-accent text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDy0Ns6Kj1Z8Dg_k17JRDxQ-A1DQR6PMVWli1AftKmKumT4IT_z1UXTry2LzH-Jc3SfjAM6sJOHy113S0HGUUkWrZIhDhlXNondfgjT-lMLMD3Acl_O5Fc3a4eUbqpi_xBv_sSFUu7oSHomx0BE8KErBViZsXSb3BxzzUujU4APFolHL5TzvyMeBayabTRyMpRrQxWbgEfYkf7_XTiWY8-27yP2gzkl4TrNpKk4e0Ug",
    badge: "Fast Moving: Shimmer & Ankle Leggings",
    colorConfig: {
      bgTint: "bg-[#FF6A3D]/5 dark:bg-[#FF8A63]/10",
      borderTint: "border-[#FF6A3D]/20 dark:border-[#FF8A63]/25",
      textCol: "text-[#FF6A3D] dark:text-[#FF8A63]",
      accentBadge: "bg-[#FF6A3D]/15 text-[#FF6A3D] dark:text-[#FF8A63]",
    },
  },
  loveit: {
    id: "loveit",
    name: "Loveit",
    shortCode: "LV",
    tagline: "Comfort Leggings & Kurti Bottoms",
    description: "Soft bio-wash knit ankle, full length, shimmer leggings, and tailored kurti pants.",
    categories: ["Leggings"],
    stockPercentage: "94% In Stock",
    minOrder: "1 Box (24 pcs)",
    accentColor: "bg-pink-600 text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAekMAHlmbovaLUy1WMuTECSKqKxxfUehYd_WizCHWu7hBc0aadRwqSltwDUEbqgL4RqoOdp8JGovxtJ3AuFuIY6UcifABH8nKub5xer2JuFhzz80eIF5qBf-JzbglS8fscD3BCmiCNHggl84Nvmit0KJ9CAdvRiqkRZJ-w7UXjajTeQV4wF18td3qJhKnwSuULUFWzRfnLc0C5fCwOZGEzZPVhCT6yUW2GJBVcNlsB",
    badge: "Trending: Kurti Pants & Bio-Wash Leggings",
    colorConfig: {
      bgTint: "bg-[#BE185D]/5 dark:bg-[#F472B6]/10",
      borderTint: "border-[#BE185D]/20 dark:border-[#F472B6]/25",
      textCol: "text-[#BE185D] dark:text-[#F472B6]",
      accentBadge: "bg-[#BE185D]/15 text-[#BE185D] dark:text-[#F472B6]",
    },
  },
  within: {
    id: "within",
    name: "Within",
    shortCode: "WN",
    tagline: "Engineered Fit Bras & Modal Panties",
    description: "Precision cup fits (B, C, D), colour-coded assortments (BCM, DCM, LCM, MCM), and silky modal prints.",
    categories: ["Bras", "Panties"],
    stockPercentage: "97% In Stock",
    minOrder: "1 Inner Pack (12 pcs)",
    accentColor: "bg-purple-600 text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
    badge: "Comprehensive Range: 21 Bra Fits & Modal Panties",
    colorConfig: {
      bgTint: "bg-[#7C3AED]/5 dark:bg-[#A78BFA]/10",
      borderTint: "border-[#7C3AED]/20 dark:border-[#A78BFA]/25",
      textCol: "text-[#7C3AED] dark:text-[#A78BFA]",
      accentBadge: "bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]",
    },
  },
  aswati: {
    id: "aswati",
    name: "Aswati",
    shortCode: "AS",
    tagline: "Classic Everyday Bras & Box-Packed Panties",
    description: "Sturdy daily support bras (888, Karishma, Mould, Sports, Sweety adj) and box-packed cotton panties.",
    categories: ["Bras", "Panties"],
    stockPercentage: "96% In Stock",
    minOrder: "1 Bundle (12 boxes)",
    accentColor: "bg-emerald-600 text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
    badge: "High Turnover: Karishma & Sweety Adj",
    colorConfig: {
      bgTint: "bg-[#12805C]/5 dark:bg-[#22C55E]/10",
      borderTint: "border-[#12805C]/20 dark:border-[#22C55E]/25",
      textCol: "text-[#12805C] dark:text-[#22C55E]",
      accentBadge: "bg-[#12805C]/15 text-[#12805C] dark:text-[#22C55E]",
    },
  },
  ira: {
    id: "ira",
    name: "Ira",
    shortCode: "IRA",
    tagline: "Fine Cotton Petticoats",
    description: "High-grade mercerized poplin petticoats available in Plain and Bra cuts.",
    categories: ["Petticoats"],
    stockPercentage: "92% In Stock",
    minOrder: "1 Bundle (20 pcs)",
    accentColor: "bg-amber-600 text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGNX3N4bECmULI--eixseQDph7ULZiPTbB0GFbULm-xspMssEUzEs5QfjFYzFGokpBz82dReM0WPlIxAw4eFYkaFxIVjyvG4VrWQiACe0vqr9l0-elREOhFT0s1bdZMNgHsl0F2dC0nZhQW4j8uxl4-Ta_VX-zBnGcoQOLWaWR_QIJIKIc720D3JESIItBSaygiwLUoXlWR5V1_TP8cAWvT1oTVrDiq1c6W0zvd29",
    badge: "Reliable: Pure Poplin Petticoats",
    colorConfig: {
      bgTint: "bg-[#B45309]/5 dark:bg-[#F59E0B]/10",
      borderTint: "border-[#B45309]/20 dark:border-[#F59E0B]/25",
      textCol: "text-[#B45309] dark:text-[#F59E0B]",
      accentBadge: "bg-[#B45309]/15 text-[#B45309] dark:text-[#F59E0B]",
    },
  },
  jyothika: {
    id: "jyothika",
    name: "Jyothika",
    shortCode: "JYO",
    tagline: "Traditional Petticoats & Liners",
    description: "Durable stitch poplin petticoats engineered for daily drape in Plain and Bra styles.",
    categories: ["Petticoats"],
    stockPercentage: "91% In Stock",
    minOrder: "1 Bundle (20 pcs)",
    accentColor: "bg-sky-600 text-white",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfGNsdy_BnL79sV-awB5b_G_sjiXgACVKk6fcbPbTFUS65T-iR9XUFNHRYoRyONL3Sk9gG8w0Ov4g6e9J9FtKBbWYrMhMOurAMQMQz8DrnhYf4zRdMWBOxeQCuLBvOHfBDIrQOdLge-XTPErm1Uv6Ilr-yw4r3hEU69L-hSSZF4e9Gdqu5UlvZeSLNi3RR2gYeo4OXd2_a1uGxgloFaHbvtvlne-5BDNKvhbucuQNT",
    badge: "Traditional: Plain & Bra Cut Petticoats",
    colorConfig: {
      bgTint: "bg-[#0284C7]/5 dark:bg-[#38BDF8]/10",
      borderTint: "border-[#0284C7]/20 dark:border-[#38BDF8]/25",
      textCol: "text-[#0284C7] dark:text-[#38BDF8]",
      accentBadge: "bg-[#0284C7]/15 text-[#0284C7] dark:text-[#38BDF8]",
    },
  },
};

export const BRAND_LIST: BrandConfig[] = Object.values(BRANDS_CONFIG);

export function getBrandConfig(brandIdOrName: string): BrandConfig {
  const normalized = brandIdOrName.toLowerCase().replace(/[\s-_]/g, "");
  for (const b of BRAND_LIST) {
    if (b.id === normalized || b.name.toLowerCase().replace(/[\s-_]/g, "") === normalized) {
      return b;
    }
  }
  // Fallback to first brand
  return BRAND_LIST[0];
}

// Data module re-exporting unified mock dataset from @/lib/mock
export * from "@/lib/mock";

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
  shades: { name: string; hex: string }[];
  sizes: string[];

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

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    artNumber: "FB-301",
    title: "Flybirds Premium Combed Cotton Brief",
    brand: "Flybirds",
    category: "Men's Innerwear",
    description: "100% Super combed long-staple cotton with moisture-wicking anti-chafing waistband. Pre-shrunk weave.",
    pricePerUnit: 325,
    unitLabel: "box (10 pcs)",
    piecesPerUnit: 10,
    minOrderUnits: 5,
    minOrderLabel: "Min order: 5 boxes",
    stockUnits: 3400,
    stockStatus: "3,400 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4wQ-vTj2W2WJrRMuJcXYaFeZL3BBYu_kFLhg_oaZed6mT3HadsSwAzj3a_UKXQ947nkedpWxP8ZEbH_Vwzfj4P-uwsBwGupaEUwaw4o6pQiLaCUUL2uR-GL1zjZIHimJk9-1lOQYxa7a2i45FzNin32bRZX0siNwAh-883T50IMQF2ILIRKGBGpQmyYMLnBhdhQYHcXpGb_n4VV1afhFqKO-8_S75_f0OtWvvjmoC",
    hsnCode: "610711",
    shades: [
      { name: "Jet Black", hex: "#0f172a" },
      { name: "Ink Navy", hex: "#1e3a8a" },
      { name: "Heather Grey", hex: "#cbd5e1" },
      { name: "Classic White", hex: "#ffffff" }
    ],
    sizes: ["S (75 cm)", "M (80 cm)", "L (85 cm)", "XL (90 cm)", "XXL (95 cm)"]
  },
  {
    id: "prod-2",
    artNumber: "FB-104",
    title: "Flybirds Classic Ribbed Cotton Vest",
    brand: "Flybirds",
    category: "Men's Innerwear",
    description: "Fine gauge 1x1 rib knit 100% carded cotton yarn with reinforced tubular seams for daily durability.",
    pricePerUnit: 340,
    unitLabel: "pack (6 pcs)",
    piecesPerUnit: 6,
    minOrderUnits: 5,
    minOrderLabel: "Min order: 5 packs",
    stockUnits: 1820,
    stockStatus: "1,820 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkHF7QBgfUImLnIA-TLyT2prQjwR8lKSXZKCTP9Kz11JyU7m6dB7kLxucrQvIssfykUkz9kVeCDf6n-0XExnlYThTyCi1148pDJ7zTHLj5EEBhpPiu_2D9VloYxji4-jyqsxjF00HywHOUmjXdiiSRWDQTpMeYpKykcwsAaqgBiuAizg_bc9uusm4v_aGoPM6k1CzUyBqCkmBEvilMGkR91JvMBMrajC82Ks1WioW5",
    hsnCode: "610910",
    shades: [
      { name: "Classic White", hex: "#ffffff" },
      { name: "Heather Grey", hex: "#cbd5e1" },
      { name: "Jet Black", hex: "#0f172a" }
    ],
    sizes: ["S (75 cm)", "M (80 cm)", "L (85 cm)", "XL (90 cm)", "XXL (95 cm)"]
  },
  {
    id: "prod-3",
    artNumber: "WN-220",
    title: "Within Seamless Comfort Hipster",
    brand: "Within",
    category: "Women's Intimates",
    description: "Bonded laser-cut edges with micro-modal stretch fabric. Zero panty lines, featherlight breathability.",
    pricePerUnit: 285,
    unitLabel: "pack (3 pcs)",
    piecesPerUnit: 3,
    minOrderUnits: 10,
    minOrderLabel: "Min order: 10 packs",
    stockUnits: 2150,
    stockStatus: "2,150 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
    hsnCode: "610822",
    shades: [
      { name: "Nude Skin", hex: "#e7cba9" },
      { name: "Blush Pink", hex: "#fbcfe8" },
      { name: "Jet Black", hex: "#0f172a" }
    ],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    id: "prod-4",
    artNumber: "SP-810",
    title: "Sleepy Panda Modal Night Pyjama Set",
    brand: "Sleepy Panda",
    category: "Kids Wear",
    description: "Ultra-soft Lenzing Modal sleepwear with elastic waistband and anti-microbial bio-wash coating.",
    pricePerUnit: 410,
    unitLabel: "set (2 pcs)",
    piecesPerUnit: 2,
    minOrderUnits: 6,
    minOrderLabel: "Min order: 6 sets",
    stockUnits: 940,
    stockStatus: "940 sets in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXbV1J-P39hSLjAPYCiOzEc5VNvRjIvxf7PyCwA2PwGnl-OttM_fOhd1MKRaJzDTBui71mEQmXFw898GMXMPMg3xB1LaoYDnquV_ydyngQoPDuQPBM8pgto5tGiMOvyBplZ7xMQ6tF48vPKpVTNVobQw_VpflC7NYN42CNWJzTLuE_PUztVEgARPvxJ78aabzOAaQDd42RON9Z27TaVt-fTeu03xx08w2Mg4e-qC7d",
    hsnCode: "610721",
    shades: [
      { name: "Sky Stripe", hex: "#7dd3fc" },
      { name: "Mint Green", hex: "#a7f3d0" },
      { name: "Pastel Lemon", hex: "#fef08a" }
    ],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-10Y"]
  },
  {
    id: "prod-5",
    artNumber: "FB-702",
    title: "Flybirds Winter Ultra Thermal Top",
    brand: "Flybirds",
    category: "Winter Thermals",
    description: "Three-layer polyfill brushed warm interlock with heat-retention core and ribbed anti-curl cuffs.",
    pricePerUnit: 580,
    unitLabel: "box (5 pcs)",
    piecesPerUnit: 5,
    minOrderUnits: 5,
    minOrderLabel: "Min order: 5 boxes",
    stockUnits: 1400,
    stockStatus: "1,400 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZnpDA_fzKj4akJGwHxl1lzd9m4HAGcT0qABQQTmkffoPr9v1KUYtS7PMTc6ok8E3RsJ3EjdX_qxd0YmwfHaMfRgsBtUHBpf4k9weNC5MFUGp96ySC8C-YXxhZqMaxexI9NgTFUtOshQB64301CR1Dy85nbcnpLyeYKtNBJko5epOy2vOk6QFQzZb1aWaHd_nmMpiYRVANwwIMLSY3TQiPLgI_Sj21SqHoeo8tZued",
    hsnCode: "610799",
    shades: [
      { name: "Charcoal Melange", hex: "#334155" },
      { name: "Off White", hex: "#f8fafc" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: "prod-6",
    artNumber: "WN-412",
    title: "Within Pure Cotton T-Shirt Bra",
    brand: "Within",
    category: "Women's Intimates",
    description: "Double-layer molded non-wired cups for full contour support and seamless under-garment finish.",
    pricePerUnit: 495,
    unitLabel: "pack (3 pcs)",
    piecesPerUnit: 3,
    minOrderUnits: 4,
    minOrderLabel: "Min order: 4 packs",
    stockUnits: 820,
    stockStatus: "820 packs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAekMAHlmbovaLUy1WMuTECSKqKxxfUehYd_WizCHWu7hBc0aadRwqSltwDUEbqgL4RqoOdp8JGovxtJ3AuFuIY6UcifABH8nKub5xer2JuFhzz80eIF5qBf-JzbglS8fscD3BCmiCNHggl84Nvmit0KJ9CAdvRiqkRZJ-w7UXjajTeQV4wF18td3qJhKnwSuULUFWzRfnLc0C5fCwOZGEzZPVhCT6yUW2GJBVcNlsB",
    hsnCode: "621210",
    shades: [
      { name: "Skin Nude", hex: "#e7cba9" },
      { name: "Soft Black", hex: "#1e293b" },
      { name: "Pure White", hex: "#ffffff" }
    ],
    sizes: ["30B", "32B", "34B", "36B", "38B"]
  },
  {
    id: "prod-aswathi",
    artNumber: "AS-501",
    title: "Aswathi Gold Border Pure Cotton Dhoti",
    brand: "Aswathi",
    category: "Traditional Wear",
    description: "Classic south Indian fine count single dhoti with zari gold border, woven from 100% pure combed cotton.",
    pricePerUnit: 364,
    unitLabel: "box (10 dhotis)",
    piecesPerUnit: 10,
    minOrderUnits: 2,
    minOrderLabel: "Min order: 2 boxes",
    stockUnits: 1250,
    stockStatus: "1,250 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
    hsnCode: "520811",
    shades: [
      { name: "Bleached White", hex: "#ffffff" },
      { name: "Natural Ivory", hex: "#fef3c7" }
    ],
    sizes: ["Single (4 Mtr)", "Double (8 Mtr)"]
  },
  {
    id: "prod-sleepy-1",
    artNumber: "SP-550",
    title: "Sleepy Panda Modal Checked Lounge Pants",
    brand: "Sleepy Panda",
    category: "Loungewear",
    description: "Bio-washed breathable modal blend woven lounge bottom with dual side pockets and elasticated drawstring.",
    pricePerUnit: 510,
    unitLabel: "pack (5 pcs)",
    piecesPerUnit: 5,
    minOrderUnits: 3,
    minOrderLabel: "Min order: 3 packs",
    stockUnits: 1100,
    stockStatus: "1,100 pcs in Hub",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnMbdcYNS5zFHOUvxIJMPH7rbsy7dDLo_MYJ5ATMKbNJQDgRQ-a_t-XVmmlg36EkD19kcWMtbaPfEnkQohiu0-K7jpQDhaTRp6DUaCe-VaRZgIOGIkyqq4VjIiRsq02UDMszRIlZas1beI4LGwWSDR0_y-mMtDB9u__V9p0LyoajnWGcvOvu7ovY3v3L1Yfk2_9h3eubQGL6T7Dqn0nRZcfhFyLcoP6T42bk_L-6KG",
    hsnCode: "610342",
    shades: [
      { name: "Navy Check", hex: "#1e3a8a" },
      { name: "Charcoal Grid", hex: "#334155" },
      { name: "Olive Tartan", hex: "#3f6212" }
    ],
    sizes: ["M (30-32)", "L (34-36)", "XL (38-40)", "XXL (42-44)"]
  }
];

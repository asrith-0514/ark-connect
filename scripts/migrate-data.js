const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../src/lib/mock/data.ts");
const retailerPath = path.join(__dirname, "../src/lib/mock/retailer.ts");

let dataContent = fs.readFileSync(dataPath, "utf8");
let retailerContent = fs.readFileSync(retailerPath, "utf8");

// 1. Add imports to data.ts
if (!dataContent.includes('from "./catalogueConfig"')) {
  dataContent = `import { BRAND_LIST, CATEGORIES_CONFIG, getBrandConfig } from "./catalogueConfig";\nimport catalogueSeed from "./catalogue.seed.json";\n` + dataContent;
}

// 2. Replace SHARED_PRODUCT_CATEGORIES and MOCK_BRANDS
const oldBrandsRegex = /export const SHARED_PRODUCT_CATEGORIES = \[[\s\S]*?export const MOCK_BRANDS: Brand\[\] = \[[\s\S]*?\n\];/;
const newBrandsBlock = `export const SHARED_PRODUCT_CATEGORIES = [
  "All",
  ...CATEGORIES_CONFIG,
] as const;

export type SharedProductCategory = (typeof SHARED_PRODUCT_CATEGORIES)[number];

export const MOCK_BRANDS: Brand[] = BRAND_LIST.map(b => ({
  id: b.id,
  name: b.name,
  shortCode: b.shortCode,
  tagline: b.tagline,
  description: b.description,
  stockPercentage: b.stockPercentage,
  minOrder: b.minOrder,
  accentColor: b.accentColor,
  image: b.image,
  badge: b.badge,
}));`;

dataContent = dataContent.replace(oldBrandsRegex, newBrandsBlock);

// 3. Replace MOCK_TIER_ARTICLES
const oldTierRegex = /export const MOCK_TIER_ARTICLES: TierPricingArticle\[\] = \[[\s\S]*?\n\];/;
const newTierBlock = `export const MOCK_TIER_ARTICLES: TierPricingArticle[] = (catalogueSeed as any).styles;`;
dataContent = dataContent.replace(oldTierRegex, newTierBlock);

// 4. Update MOCK_ORDERS in data.ts
// ARK-8841 items
const oldArk8841Items = /items:\s*\[[\s\S]*?productId:\s*"prod-2"[\s\S]*?artNumber:\s*"FB-104"[\s\S]*?productId:\s*"prod-aswathi-2"[\s\S]*?rate:\s*364,[\s\S]*?totalPieces:\s*200,[\s\S]*?image:[\s\S]*?\n\s*\],/;
const newArk8841Items = `items: [
      {
        productId: "prod-flybirds-leg-ankle",
        productTitle: "Flybirds Ankle leggings",
        artNumber: "FB-LEG-ANKLE",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Free Size",
        units: 40,
        rate: 400,
        totalPieces: 240,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-flybirds-leg-saree",
        productTitle: "Flybirds Saree shaper",
        artNumber: "FB-LEG-SAREE",
        brand: "Flybirds",
        color: "Jet Black",
        colorHex: "#0f172a",
        size: "Free Size",
        units: 30,
        rate: 400,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-aswati-bra-karishma",
        productTitle: "Aswati Karishma",
        artNumber: "AS-BRA-KARISHMA",
        brand: "Aswati",
        color: "White",
        colorHex: "#ffffff",
        size: "75-90",
        units: 30,
        rate: 364,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
      },
      {
        productId: "prod-aswati-bra-sweety",
        productTitle: "Aswati Sweety adj",
        artNumber: "AS-BRA-SWEETY",
        brand: "Aswati",
        color: "Skin",
        colorHex: "#e7cba9",
        size: "75-90",
        units: 20,
        rate: 364,
        totalPieces: 200,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJtzH6tZ8RjHvM40kStllYoqIyqO76mnH5Ta0ouxHXP6lWvcTzT8CoLPMr09jE-KwsXICzDBSSyRdMk5cmNcI3sUQrB7ZJbaktU-66GTNoKl8TIna09S4kag1obGbZ9bAERHeb8xWSStCE7L1lco537hqgmfH4TWvStlOfLIdRntE-Wr6Oukn6Xnemn1uEjzCBEKCeiReoo-mpIXvnwYa7rFBHBuSwQJE9MIv2wiU",
      },
    ],`;

dataContent = dataContent.replace(oldArk8841Items, newArk8841Items);

// ARK-8902 items
const oldArk8902Items = /items:\s*\[[\s\S]*?productId:\s*"prod-2"[\s\S]*?artNumber:\s*"FB-104"[\s\S]*?productId:\s*"prod-sleepy-2"[\s\S]*?rate:\s*608\.65,[\s\S]*?totalPieces:\s*120,[\s\S]*?image:[\s\S]*?\n\s*\],/;
const newArk8902Items = `items: [
      {
        productId: "prod-flybirds-leg-ankle",
        productTitle: "Flybirds Ankle leggings",
        artNumber: "FB-LEG-ANKLE",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Free Size",
        units: 12,
        rate: 325.0, // 12 * 325 = 3900.00
        totalPieces: 120,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-flybirds-leg-ankle",
        productTitle: "Flybirds Ankle leggings",
        artNumber: "FB-LEG-ANKLE",
        brand: "Flybirds",
        color: "Jet Black",
        colorHex: "#0f172a",
        size: "XL",
        units: 18,
        rate: 325.0, // 18 * 325 = 5850.00
        totalPieces: 180,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-flybirds-leg-kurti",
        productTitle: "Flybirds Kurti pant",
        artNumber: "FB-LEG-KURTI",
        brand: "Flybirds",
        color: "Ink Navy",
        colorHex: "#1e3a8a",
        size: "Free Size",
        units: 40,
        rate: 348.97, // 40 * 348.97 = 13958.80
        totalPieces: 400,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-within-bra-clara",
        productTitle: "Within Clara",
        artNumber: "WN-BRA-CLARA",
        brand: "Within",
        color: "Basic Colour Mix (BCM)",
        colorHex: "#3b82f6",
        size: "34",
        units: 16,
        rate: 505.5, // 16 * 505.50 = 8088.00
        totalPieces: 160,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
      },
      {
        productId: "prod-within-pan-blooms",
        productTitle: "Within Aaina blooms",
        artNumber: "WN-PAN-BLOOMS",
        brand: "Within",
        color: "Assorted Pastels",
        colorHex: "#f472b6",
        size: "M",
        units: 14,
        rate: 608.65, // 14 * 608.65 = 8521.10
        totalPieces: 120, // Sum = 3900 + 5850 + 13958.80 + 8088 + 8521.10 = 40,317.90
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
      },
    ],`;

dataContent = dataContent.replace(oldArk8902Items, newArk8902Items);

// ARK-8903 items
const oldArk8903Items = /items:\s*\[[\s\S]*?productId:\s*"prod-1"[\s\S]*?artNumber:\s*"FB-301"[\s\S]*?productId:\s*"prod-2"[\s\S]*?artNumber:\s*"FB-104"[\s\S]*?rate:\s*416\.67,[\s\S]*?totalPieces:\s*300,[\s\S]*?image:[\s\S]*?\n\s*\],/;
const newArk8903Items = `items: [
      {
        productId: "prod-flybirds-leg-full",
        productTitle: "Flybirds Full length leggings",
        artNumber: "FB-LEG-FULL",
        brand: "Flybirds",
        color: "Classic White",
        colorHex: "#ffffff",
        size: "Free Size",
        units: 30,
        rate: 400,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
      {
        productId: "prod-flybirds-leg-ankle",
        productTitle: "Flybirds Ankle leggings",
        artNumber: "FB-LEG-ANKLE",
        brand: "Flybirds",
        color: "Jet Black",
        colorHex: "#0f172a",
        size: "XL",
        units: 30,
        rate: 416.67,
        totalPieces: 300,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLBi96Ov1PZTKzqz4dFnc06-tbXn2rSmLproCF4Q4i4VpnHU3aLcq_KMQ2bCLoupHW9MmOBK6Uw4EobnaSJq4Vs5b4vg-WIf5e1A5nzMl8k_nj-sdQSPoSIZeqGJO7AntQF1exVxf3XpgiD-ztpycDxIxBBK4XfihyyizsefA55rjBZu_vvhQE7V5Qioy6PtBoAMMdWVhqAmUdlaXZPVnVi9UHb_ChlAb5Etayt1c6",
      },
    ],`;

dataContent = dataContent.replace(oldArk8903Items, newArk8903Items);

// ARK-8839 items
const oldArk8839Items = /items:\s*\[[\s\S]*?productId:\s*"prod-3"[\s\S]*?artNumber:\s*"WN-220"[\s\S]*?rate:\s*390,[\s\S]*?totalPieces:\s*500,[\s\S]*?image:[\s\S]*?\n\s*\],/;
const newArk8839Items = `items: [
      {
        productId: "prod-within-bra-clara",
        productTitle: "Within Clara",
        artNumber: "WN-BRA-CLARA",
        brand: "Within",
        color: "Basic Colour Mix (BCM)",
        colorHex: "#3b82f6",
        size: "34",
        units: 50,
        rate: 390,
        totalPieces: 500,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDce7_hUWwSU8gpC-P3IBbizrBO_Py60IS50wOvHGp-EDYw6_TDgzKKrPyp9EjGjePJ1XB8fMBbD61KNOqGtOGjezUOvlh1aGrChyvbBT6ZycApf0OxZn0GRMFCgyEhyIib9we5ZXeioUyiScUldvWDiZ5BvYZlDZqUqzS5ILAwYnKxQSaWwXsE8WhALaxwGjVF1oQGoNl4iockOxqhk9XQavETUnwJd_h64w6CD5C5",
      },
    ],`;

dataContent = dataContent.replace(oldArk8839Items, newArk8839Items);

// 5. Update MOCK_INVOICES items (INV-0094, INV-0087, INV-0079)
// INV-0094
const oldInv94Items = /description:\s*"Combed Cotton Rib Vest RN75"[\s\S]*?variant:\s*"Classic White \/ Size L"[\s\S]*?amount:\s*15369\.05,\s*\}/;
const newInv94Items = `description: "Flybirds Ankle leggings",
        variant: "Classic White / Free Size",
        brand: "Flybirds",
        hsn: "61046200",
        boxes: 50,
        rate: 325,
        amount: 16250,
      },
      {
        description: "Flybirds Kurti pant",
        variant: "Ink Navy / Free Size",
        brand: "Flybirds",
        hsn: "61046200",
        boxes: 45,
        rate: 341.53,
        amount: 15369.05,
      }`;

dataContent = dataContent.replace(oldInv94Items, newInv94Items);

// INV-0087
const oldInv87Items = /description:\s*"Modal Checked Lounge Pants"[\s\S]*?brand:\s*"Sleepy Panda"[\s\S]*?amount:\s*24600,\s*\}/;
const newInv87Items = `description: "Within Clara",
        variant: "Basic Colour Mix (BCM) / 36",
        brand: "Within",
        hsn: "62121000",
        boxes: 50,
        rate: 492,
        amount: 24600,
      }`;

dataContent = dataContent.replace(oldInv87Items, newInv87Items);

// INV-0079
const oldInv79Items = /description:\s*"Gold Border Pure Cotton Dhoti"[\s\S]*?brand:\s*"Aswathi"[\s\S]*?amount:\s*29523\.81,\s*\}/;
const newInv79Items = `description: "Aswati Karishma",
        variant: "White / 75-90",
        brand: "Aswati",
        hsn: "62121000",
        boxes: 80,
        rate: 369.05,
        amount: 29523.81,
      }`;

dataContent = dataContent.replace(oldInv79Items, newInv79Items);

// 6. Global replace in invoices and datasets for old brands:
// Aswathi -> Aswati
// Sleepy Panda -> Loveit
// Exena -> Ira
// Lichi Intimates / Lichi -> Jyothika
// Maxwell -> Loveit
// Little Star -> Flycute
dataContent = dataContent.replace(/brand:\s*"Aswathi"/g, 'brand: "Aswati"');
dataContent = dataContent.replace(/brand:\s*"Sleepy Panda"/g, 'brand: "Loveit"');
dataContent = dataContent.replace(/brand:\s*"Exena"/g, 'brand: "Ira"');
dataContent = dataContent.replace(/brand:\s*"Lichi Intimates"/g, 'brand: "Jyothika"');
dataContent = dataContent.replace(/brand:\s*"Lichi"/g, 'brand: "Jyothika"');
dataContent = dataContent.replace(/brand:\s*"Maxwell"/g, 'brand: "Loveit"');
dataContent = dataContent.replace(/brand:\s*"Little Star"/g, 'brand: "Flycute"');

retailerContent = retailerContent.replace(/Aswathi/g, 'Aswati');
retailerContent = retailerContent.replace(/Sleepy Panda/g, 'Loveit');
retailerContent = retailerContent.replace(/Exena/g, 'Ira');
retailerContent = retailerContent.replace(/Lichi/g, 'Jyothika');

fs.writeFileSync(dataPath, dataContent, "utf8");
fs.writeFileSync(retailerPath, retailerContent, "utf8");

console.log("Successfully migrated data.ts and retailer.ts to real catalogue.");

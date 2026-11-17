// Unified Mock Data and Derivation Selectors for ARK Connect and ARK Distributors
// Single source of truth module for both Retailer and Distributor portals

export * from "./types";
export * from "./data";
export * from "./selectors";
export * from "./retailer";
export * from "../pdf/generateInvoicePDF";
export * from "../pdf/generateOrderPDF";
export { SHARED_PRODUCT_CATEGORIES, type SharedProductCategory } from "./data";


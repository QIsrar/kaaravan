export * from "./types";

/**
 * Adapter Registry for Couriers (TCS, Leopard, PostEx, Trax, DHL, etc.)
 * Concrete implementations will be plugged in during courier integration phase.
 */
export interface CourierRegistry {
  getAdapter(courierId: string): import("./types").CourierAdapter | undefined;
  registerAdapter(adapter: import("./types").CourierAdapter): void;
}

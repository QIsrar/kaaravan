/**
 * Courier Service Adapter Types
 *
 * NON-NEGOTIABLE RULE 9:
 * Couriers are accessed ONLY through adapter interfaces (lib/couriers).
 * No courier-specific code outside its adapter.
 *
 * KAARAVAN IDENTITY:
 * Order tracking maps to a journey:
 * stops along a route (Placed -> Packed -> On the way -> Arrived).
 */

export type JourneyStop = "placed" | "packed" | "on_the_way" | "arrived";

export interface Address {
  fullName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  provinceState: string;
  postalCode?: string;
  country: string;
}

export interface ParcelDimensions {
  weightInGrams: number;
  lengthInCm?: number;
  widthInCm?: number;
  heightInCm?: number;
}

export interface CreateShipmentParams {
  orderId: string;
  sellerId: string;
  origin: Address;
  destination: Address;
  parcel: ParcelDimensions;
  codAmountInPaisa?: bigint; // Cash on delivery if applicable
  instructions?: string;
}

export interface ShipmentResult {
  trackingNumber: string;
  bookingReference: string;
  labelUrl?: string;
  courierName: string;
  status: JourneyStop;
  rawResponse?: unknown;
}

export interface TrackingCheckpoint {
  timestamp: string;
  location: string;
  description: string;
  journeyStop: JourneyStop;
}

export interface TrackingInfo {
  trackingNumber: string;
  currentStop: JourneyStop;
  estimatedDeliveryDate?: string;
  checkpoints: TrackingCheckpoint[];
}

export interface CourierAdapter {
  readonly id: string;
  readonly displayName: string;

  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;
  cancelShipment(trackingNumber: string): Promise<{ success: boolean; message?: string }>;
}

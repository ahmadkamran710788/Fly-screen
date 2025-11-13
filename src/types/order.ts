export type Store = '.nl' | '.de' | '.dk' | '.fr' | '.uk';

export type Role = 'Admin' | 'Frame Cutting' | 'Mesh Cutting' | 'Quality';

// New: Separate status types for each stage
export type FrameCuttingStatus = 'Pending' | 'Ready to Package';
export type MeshCuttingStatus = 'Pending' | 'Ready to Package';
export type QualityStatus = 'Pending' | 'Ready to Package' | 'Packed';

// Overall order status
export type OrderStatus = 'Pending' | 'In Progress' | 'Completed';

export interface OrderItem {
  id: string;
  width: number; // cm
  height: number; // cm
  profileColor: string; // e.g., "White 9016"
  orientation: string; // store-specific language
  installationType: string; // store-specific language
  thresholdType: string; // store-specific language
  meshType: string; // store-specific language
  curtainType: string; // store-specific language
  fabricColor: string;
  closureType: string; // store-specific language
  mountingType: string; // store-specific language
  // New: Three separate statuses per item
  frameCuttingStatus: FrameCuttingStatus;
  meshCuttingStatus: MeshCuttingStatus;
  qualityStatus: QualityStatus;
}

export interface Box {
  id: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  items: string[]; // which items are in this box (array of item IDs)
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  store: Store;
  items: OrderItem[];
  boxes: Box[];
}

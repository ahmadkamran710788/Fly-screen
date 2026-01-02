export type Store = '.nl' | '.de' | '.dk' | '.fr' | '.uk';

export type Role = 'Admin' | 'Frame Cutting' | 'Mesh Cutting' | 'Quality' | 'Packaging' | 'Assembly' | 'Shipping';

// New: Separate status types for each stage
export type FrameCuttingStatus = 'Pending' | 'Complete';
export type MeshCuttingStatus = 'Pending' | 'Complete';
export type QualityStatus = 'Pending' | 'Complete';
export type PackagingStatus = 'Pending' | 'Complete';
export type AssemblyStatus = 'Pending' | 'Complete';

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
  // New: Separate statuses per item
  frameCuttingStatus: FrameCuttingStatus;
  meshCuttingStatus: MeshCuttingStatus;
  qualityStatus: QualityStatus;
  packagingStatus: PackagingStatus;
  assemblyStatus: AssemblyStatus;
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
  shippingStatus?: 'Pending' | 'Complete';
  firstName?: string;
  lastName?: string;
}

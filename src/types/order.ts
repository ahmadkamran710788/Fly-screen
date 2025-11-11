export type Store = '.nl' | '.de' | '.dk' | '.fr' | '.uk';

export type Role = 'Admin' | 'Frame Cutting' | 'Mesh Cutting' | 'Quality';

export type ItemStatus = 
  | 'Pending'
  | 'Frame Cut Complete'
  | 'Mesh Cut Complete'
  | 'Ready for Packaging'
  | 'Packed'
  | 'Shipped';

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
  frameCutComplete: boolean;
  meshCutComplete: boolean;
  status: ItemStatus;
}

export interface Box {
  id: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  itemIds: string[]; // which items are in this box
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  store: Store;
  items: OrderItem[];
  boxes: Box[];
}

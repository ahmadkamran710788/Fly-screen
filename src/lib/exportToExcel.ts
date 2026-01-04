import * as XLSX from 'xlsx';
import { Order, OrderItem, Store } from '@/types/order';
import { mapToTurkish, extractColorCode } from './mappings';
import { formatDateGMT1 } from './timezone';

// Calculate overall status of an order
const getOverallStatus = (order: Order): string => {
  // Check if all items are completely finished (all 5 stages are Complete)
  const allPacked = order.items?.every(
    (item) =>
      item.frameCuttingStatus === "Complete" &&
      item.meshCuttingStatus === "Complete" &&
      item.qualityStatus === "Complete" &&
      item.assemblyStatus === "Complete" &&
      item.packagingStatus === "Complete"
  );

  // Check if all items are still pending (all 5 statuses are pending)
  const allPending = order.items?.every(
    (item) =>
      item.frameCuttingStatus === "Pending" &&
      item.meshCuttingStatus === "Pending" &&
      item.qualityStatus === "Pending" &&
      item.assemblyStatus === "Pending" &&
      item.packagingStatus === "Pending"
  );

  if (allPacked) {
    if (order.shippingStatus === "In Transit") return "Completed";
    return "In Progress";
  }
  if (allPending) return "Pending";
  return "In Progress";
};

// Frame Cutting calculations
const calculateFrameCutting = (item: OrderItem, store: Store) => ({
  en: item.width - 5,
  boy: item.height - 5,
  kanat: item.height - 5.5,
  profilRenk: extractColorCode(item.profileColor),
  yon: mapToTurkish(item.orientation, store, 'orientation'),
  kurulum: mapToTurkish(item.installationType, store, 'installation'),
  esik: mapToTurkish(item.thresholdType, store, 'threshold'),
});

// Mesh Cutting calculations
const calculateMeshCutting = (item: OrderItem, store: Store) => ({
  pileSayisi: item.width / 2,
  boy: item.height - 4.2,
  ipUzunlugu: item.width + item.height + 20,
  yon: mapToTurkish(item.orientation, store, 'orientation'),
  tul: mapToTurkish(item.meshType, store, 'mesh'),
  perdeTuru: mapToTurkish(item.curtainType, store, 'curtain'),
  kumasRenk: item.fabricColor,
  kapanma: mapToTurkish(item.closureType, store, 'closure'),
});

// Create All Orders sheet data
const createAllOrdersSheet = (orders: Order[]) => {
  const data: any[] = [];

  // Header row
  data.push([
    'Order Number',
    'Order Date',
    'Store',
    'Item ID',
    'Width (cm)',
    'Height (cm)',
    'Frame Cutting Status',
    'Mesh Cutting Status',
    'Quality Status',
    'Box',
    'Box Dimensions (LxWxH)',
    'Box Weight (kg)',
    'Overall Status',
  ]);

  // Data rows
  orders.forEach((order) => {
    const overallStatus = getOverallStatus(order);
    order.items.forEach((item) => {
      const boxIndex = order.boxes?.findIndex(box => box.items.includes(item.id)) ?? -1;
      const box = boxIndex !== -1 && order.boxes ? order.boxes[boxIndex] : null;
      const boxName = boxIndex !== -1 ? `Box ${boxIndex + 1}` : '-';
      const boxDimensions = box ? `${box.length}x${box.width}x${box.height}` : '-';
      const boxWeight = box ? box.weight : '-';

      data.push([
        order.orderNumber,
        formatDateGMT1(order.orderDate),
        order.store,
        item.id,
        item.width,
        item.height,
        item.frameCuttingStatus,
        item.meshCuttingStatus,
        item.qualityStatus,
        boxName,
        boxDimensions,
        boxWeight,
        overallStatus,
      ]);
    });
  });

  return data;
};

// Create Frame Cutting Detail sheet data
const createFrameCuttingSheet = (orders: Order[]) => {
  const data: any[] = [];

  // Header row
  data.push([
    'Order Number',
    'Item ID',
    'En (cm)',
    'Boy (cm)',
    'Kanat (cm)',
    'Profil renk',
    'Yon',
    'Kurulum',
    'Esik',
    'Status',
  ]);

  // Data rows
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const calc = calculateFrameCutting(item, order.store);
      data.push([
        order.orderNumber,
        item.id,
        calc.en,
        calc.boy,
        calc.kanat,
        calc.profilRenk,
        calc.yon,
        calc.kurulum,
        calc.esik,
        item.frameCuttingStatus,
      ]);
    });
  });

  return data;
};

// Create Mesh Cutting Details sheet data
const createMeshCuttingSheet = (orders: Order[]) => {
  const data: any[] = [];

  // Header row
  data.push([
    'Order Number',
    'Item ID',
    'Pile sayisi',
    'Boy (cm)',
    'Ip uzunlugu (cm)',
    'Yon',
    'Tul',
    'Perde türü',
    'Kumas renk',
    'Kapanma',
    'Status',
  ]);

  // Data rows
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const calc = calculateMeshCutting(item, order.store);
      data.push([
        order.orderNumber,
        item.id,
        calc.pileSayisi,
        calc.boy,
        calc.ipUzunlugu,
        calc.yon,
        calc.tul,
        calc.perdeTuru,
        calc.kumasRenk,
        calc.kapanma,
        item.meshCuttingStatus,
      ]);
    });
  });

  return data;
};



// Export for Admin: 3 sheets (All Orders, Frame Cutting Detail, Mesh Cutting Details)
export const exportAdminToExcel = (orders: Order[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Orders
  const allOrdersData = createAllOrdersSheet(orders);
  const ws1 = XLSX.utils.aoa_to_sheet(allOrdersData);
  XLSX.utils.book_append_sheet(wb, ws1, 'All Orders');

  // Sheet 2: Frame Cutting Detail
  const frameCuttingData = createFrameCuttingSheet(orders);
  const ws2 = XLSX.utils.aoa_to_sheet(frameCuttingData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Frame Cutting Detail');

  // Sheet 3: Mesh Cutting Details
  const meshCuttingData = createMeshCuttingSheet(orders);
  const ws3 = XLSX.utils.aoa_to_sheet(meshCuttingData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Mesh Cutting Details');



  // Download
  XLSX.writeFile(wb, `Admin_Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export for Frame Cutting: 1 sheet (Frame Cutting Detail)
export const exportFrameToExcel = (orders: Order[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet: Frame Cutting Detail
  const frameCuttingData = createFrameCuttingSheet(orders);
  const ws = XLSX.utils.aoa_to_sheet(frameCuttingData);
  XLSX.utils.book_append_sheet(wb, ws, 'Frame Cutting Detail');

  // Download
  XLSX.writeFile(wb, `Frame_Cutting_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export for Mesh Cutting: 1 sheet (Mesh Cutting Details)
export const exportMeshToExcel = (orders: Order[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet: Mesh Cutting Details
  const meshCuttingData = createMeshCuttingSheet(orders);
  const ws = XLSX.utils.aoa_to_sheet(meshCuttingData);
  XLSX.utils.book_append_sheet(wb, ws, 'Mesh Cutting Details');

  // Download
  XLSX.writeFile(wb, `Mesh_Cutting_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export for Quality: 2 sheets (Frame Cutting Detail, Mesh Cutting Details)
export const exportQualityToExcel = (orders: Order[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Frame Cutting Detail
  const frameCuttingData = createFrameCuttingSheet(orders);
  const ws1 = XLSX.utils.aoa_to_sheet(frameCuttingData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Frame Cutting Detail');

  // Sheet 2: Mesh Cutting Details
  const meshCuttingData = createMeshCuttingSheet(orders);
  const ws2 = XLSX.utils.aoa_to_sheet(meshCuttingData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Mesh Cutting Details');

  // Download
  XLSX.writeFile(wb, `Quality_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export for Packing: 2 sheets (All Orders, Box Details)
export const exportPackingToExcel = (orders: Order[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Orders
  const allOrdersData = createAllOrdersSheet(orders);
  const ws1 = XLSX.utils.aoa_to_sheet(allOrdersData);
  XLSX.utils.book_append_sheet(wb, ws1, 'All Orders');



  // Download
  XLSX.writeFile(wb, `Packing_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};


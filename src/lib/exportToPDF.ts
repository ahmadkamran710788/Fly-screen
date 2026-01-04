import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, OrderItem, Store } from '@/types/order';
import { mapToTurkish, extractColorCode } from './mappings';
import { formatDateGMT1 } from './timezone';

// Calculate overall status of an order
const getOverallStatus = (order: Order): string => {
  if (!order) return "Pending";
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

// Add All Orders table to PDF
const addAllOrdersTable = (doc: jsPDF, orders: Order[], startY: number = 20) => {
  const tableData: any[] = [];

  orders.forEach((order) => {
    const overallStatus = getOverallStatus(order);
    order.items.forEach((item) => {
      const boxIndex = order.boxes?.findIndex(box => box.items.includes(item.id)) ?? -1;
      const box = boxIndex !== -1 && order.boxes ? order.boxes[boxIndex] : null;
      const boxName = boxIndex !== -1 ? `Box ${boxIndex + 1}` : '-';
      const boxDimensions = box ? `${box.length}x${box.width}x${box.height}` : '-';
      const boxWeight = box ? box.weight : '-';

      tableData.push([
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

  autoTable(doc, {
    startY,
    head: [
      [
        'Order Number',
        'Order Date',
        'Store',
        'Item ID',
        'Width (cm)',
        'Height (cm)',
        'Frame Status',
        'Mesh Status',
        'Quality Status',
        'Box',
        'Box Dims',
        'Box Kg',
        'Overall Status',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  return doc;
};

// Add Frame Cutting Detail table to PDF
const addFrameCuttingTable = (doc: jsPDF, orders: Order[], startY: number = 20) => {
  const tableData: any[] = [];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const calc = calculateFrameCutting(item, order.store);
      tableData.push([
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

  autoTable(doc, {
    startY,
    head: [
      [
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
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  return doc;
};

// Add Mesh Cutting Details table to PDF
const addMeshCuttingTable = (doc: jsPDF, orders: Order[], startY: number = 20) => {
  const tableData: any[] = [];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const calc = calculateMeshCutting(item, order.store);
      tableData.push([
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

  autoTable(doc, {
    startY,
    head: [
      [
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
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  return doc;
};




// Export for Admin: 3 pages (All Orders, Frame Cutting Detail, Mesh Cutting Details)
export const exportAdminToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  // Page 1: All Orders
  doc.setFontSize(16);
  doc.text('All Orders', 14, 15);
  addAllOrdersTable(doc, orders, 20);

  // Page 2: Frame Cutting Detail
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Frame Cutting Detail', 14, 15);
  addFrameCuttingTable(doc, orders, 20);

  // Page 3: Mesh Cutting Details
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Mesh Cutting Details', 14, 15);
  addMeshCuttingTable(doc, orders, 20);



  // Download
  doc.save(`Admin_Orders_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Frame Cutting: 1 page (Frame Cutting Detail)
export const exportFrameToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  // Page: Frame Cutting Detail
  doc.setFontSize(16);
  doc.text('Frame Cutting Detail', 14, 15);
  addFrameCuttingTable(doc, orders, 20);

  // Download
  doc.save(`Frame_Cutting_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Mesh Cutting: 1 page (Mesh Cutting Details)
export const exportMeshToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  // Page: Mesh Cutting Details
  doc.setFontSize(16);
  doc.text('Mesh Cutting Details', 14, 15);
  addMeshCuttingTable(doc, orders, 20);

  // Download
  doc.save(`Mesh_Cutting_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Quality: 2 pages (Frame Cutting Detail, Mesh Cutting Details)
export const exportQualityToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  // Page 1: Frame Cutting Detail
  doc.setFontSize(16);
  doc.text('Frame Cutting Detail', 14, 15);
  addFrameCuttingTable(doc, orders, 20);

  // Page 2: Mesh Cutting Details
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Mesh Cutting Details', 14, 15);
  addMeshCuttingTable(doc, orders, 20);

  // Download
  doc.save(`Quality_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Admin - All Orders Only
export const exportAllOrdersToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('All Orders', 14, 15);
  addAllOrdersTable(doc, orders, 20);

  doc.save(`All_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Admin - Frame Cutting Detail Only
export const exportFrameCuttingOnlyToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Frame Cutting Detail', 14, 15);
  addFrameCuttingTable(doc, orders, 20);

  doc.save(`Frame_Cutting_Detail_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Admin - Mesh Cutting Detail Only
export const exportMeshCuttingOnlyToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  doc.setFontSize(16);
  doc.text('Mesh Cutting Details', 14, 15);
  addMeshCuttingTable(doc, orders, 20);

  doc.save(`Mesh_Cutting_Detail_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Packing: 2 pages (All Orders, Box Details)
export const exportPackingToPDF = (orders: Order[]) => {
  const doc = new jsPDF('landscape');

  // Page 1: All Orders
  doc.setFontSize(16);
  doc.text('All Orders', 14, 15);
  addAllOrdersTable(doc, orders, 20);



  // Download
  doc.save(`Packing_Export_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Packaging: Simple order summary (Order Number, Name, Item Count)
export const exportPackagingOrderToPDF = (order: Order) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150] // label format
  });

  const firstName = order.firstName || "";
  const lastName = order.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "-";
  const itemCount = order.items?.length || 0;

  // Header - Order Number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Order Number', 10, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text(order.orderNumber, 10, 32);

  // Name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Name', 10, 50);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(fullName, 10, 62);

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Items', 10, 80);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`, 10, 92);

  // Open in new window for printing
  doc.autoPrint();
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

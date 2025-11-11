import React, { createContext, useContext, useState } from 'react';
import { Order, OrderItem, Box } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  getOrder: (id: string) => Order | undefined;
  updateItemStatus: (orderId: string, itemId: string, updates: Partial<OrderItem>) => void;
  addBox: (orderId: string, box: Omit<Box, 'id'>) => void;
  deleteBox: (orderId: string, boxId: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'boxes'>) => void;
  deleteOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with no demo data; will be populated via real sync/API later
  const [orders, setOrders] = useState<Order[]>([]);

  const getOrder = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const updateItemStatus = (orderId: string, itemId: string, updates: Partial<OrderItem>) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        return {
          ...order,
          items: order.items.map(item => {
            if (item.id !== itemId) return item;

            const updatedItem = { ...item, ...updates };

            // Auto-set "Ready for Packaging" when both frame and mesh are complete
            if (updatedItem.frameCutComplete && updatedItem.meshCutComplete) {
              updatedItem.status = 'Ready for Packaging';
            } else if (updatedItem.frameCutComplete) {
              updatedItem.status = 'Frame Cut Complete';
            } else if (updatedItem.meshCutComplete) {
              updatedItem.status = 'Mesh Cut Complete';
            } else {
              updatedItem.status = 'Pending';
            }

            return updatedItem;
          }),
        };
      })
    );
  };

  const addBox = (orderId: string, box: Omit<Box, 'id'>) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        const newBox: Box = {
          ...box,
          id: `box-${Date.now()}`,
        };

        return {
          ...order,
          boxes: [...order.boxes, newBox],
        };
      })
    );
  };

  const deleteBox = (orderId: string, boxId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        return {
          ...order,
          boxes: order.boxes.filter(box => box.id !== boxId),
        };
      })
    );
  };

  const addOrder = (order: Omit<Order, 'id' | 'boxes'>) => {
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      boxes: [],
    };
    setOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        getOrder,
        updateItemStatus,
        addBox,
        deleteBox,
        addOrder,
        deleteOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};

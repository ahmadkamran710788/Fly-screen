import React, { createContext, useContext, useState } from 'react';
import { Order, OrderItem, Box } from '@/types/order';

interface OrderContextType {
  orders: Order[];
  getOrder: (id: string) => Order | undefined;
  updateItemStatus: (orderId: string, itemId: string, updates: Partial<OrderItem>) => Promise<void>;
  addBox: (orderId: string, box: Omit<Box, 'id'>) => Promise<void>;
  deleteBox: (orderId: string, boxId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'boxes'>) => Promise<void>;
  deleteOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with no demo data; will be populated via real sync/API later
  const [orders, setOrders] = useState<Order[]>([]);

  const getOrder = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const updateItemStatus = async (orderId: string, itemId: string, updates: Partial<OrderItem>) => {
    // Optimistic update
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        return {
          ...order,
          items: order.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, ...updates };
          }),
        };
      })
    );

    // Persist to backend
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      const result = await response.json();
      console.log('Item status updated successfully:', result);
    } catch (error) {
      console.error('Error updating item status:', error);
      // Could implement revert logic here if needed
    }
  };

  const addBox = async (orderId: string, box: Omit<Box, 'id'>) => {
    // Optimistic update
    const tempBox: Box = {
      ...box,
      id: `box-${Date.now()}`,
    };

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          boxes: [...order.boxes, tempBox],
        };
      })
    );

    // Persist to backend
    try {
      const response = await fetch(`/api/orders/${orderId}/boxes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(box),
      });

      if (!response.ok) {
        throw new Error('Failed to add box');
      }

      const result = await response.json();
      console.log('Box added successfully:', result);
    } catch (error) {
      console.error('Error adding box:', error);
      // Revert optimistic update
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            boxes: order.boxes.filter(b => b.id !== tempBox.id),
          };
        })
      );
    }
  };

  const deleteBox = async (orderId: string, boxId: string) => {
    // Optimistic update
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          boxes: order.boxes.filter(box => box.id !== boxId),
        };
      })
    );

    // Persist to backend
    try {
      const response = await fetch(`/api/orders/${orderId}/boxes/${boxId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete box');
      }

      console.log('Box deleted successfully');
    } catch (error) {
      console.error('Error deleting box:', error);
      // Could implement revert logic here if needed
    }
  };

  const addOrder = async (order: Omit<Order, 'id' | 'boxes'>) => {
    try {
      // Call API to create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          store: order.store,
          items: order.items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();

      // Create order object for local state
      const newOrder: Order = {
        ...order,
        id: result.order.id,
        boxes: [],
      };

      setOrders(prevOrders => [newOrder, ...prevOrders]);

      console.log('Order created successfully:', result);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error; // Re-throw to let the component handle it
    }
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

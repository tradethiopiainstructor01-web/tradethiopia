import React from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from '@chakra-ui/react';

const OrderDetailsDrawer = ({ isOpen, onClose, order }) => {
  return (
    <Drawer isOpen={!!isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Order Details</DrawerHeader>
        <DrawerBody>
          {order ? (
            <div>
              <p><strong>Order ID:</strong> {order._id || order.id}</p>
              <p><strong>Customer:</strong> {order.customerName || order.customer || 'N/A'}</p>
              <p><strong>Status:</strong> {order.status}</p>
            </div>
          ) : (
            <div>No order selected.</div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDetailsDrawer;

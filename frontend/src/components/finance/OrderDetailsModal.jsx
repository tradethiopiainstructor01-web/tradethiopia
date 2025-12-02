import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from '@chakra-ui/react';

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  return (
    <Modal isOpen={!!isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Order Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {order ? (
            <div>
              <p><strong>Order ID:</strong> {order._id || order.id}</p>
              <p><strong>Customer:</strong> {order.customerName || order.customer || 'N/A'}</p>
              <p><strong>Status:</strong> {order.status}</p>
            </div>
          ) : (
            <div>No order selected.</div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default OrderDetailsModal;

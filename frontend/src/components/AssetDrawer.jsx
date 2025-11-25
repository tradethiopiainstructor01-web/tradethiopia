import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
} from "@chakra-ui/react";
import AssetForm from "./AssetForm";

const AssetDrawer = ({ isOpen, onClose, onSuccess }) => {
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Add or Edit Asset</DrawerHeader>
        <DrawerBody>
          <AssetForm onSuccess={onSuccess} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default AssetDrawer;

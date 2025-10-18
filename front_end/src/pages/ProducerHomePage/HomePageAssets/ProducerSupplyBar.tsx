import React from "react";
import { Box, VStack, Text, Divider, Button, useDisclosure } from "@chakra-ui/react";
import ProductEntryForm from "./ProductEntryForm";

interface ProducerSupplyBarProps {
  onProductAdded?: () => void;
}

const ProducerSupplyBar: React.FC<ProducerSupplyBarProps> = ({ onProductAdded }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box width="220px" bg="gray.100" p={4} boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="bold" fontSize="md" color="teal.700">Products</Text>
        <Divider />
        <Text fontWeight="bold" fontSize="md" color="teal.700">Deals</Text>
        <Divider />
        <Text fontWeight="bold" fontSize="md" color="teal.700">Customers</Text>
        <Divider />
        <Button colorScheme="teal" variant="solid" onClick={onOpen}>
          Add Products
        </Button>
      </VStack>
      <ProductEntryForm isOpen={isOpen} onClose={onClose} onProductAdded={onProductAdded} />
    </Box>
  );
};

export default ProducerSupplyBar;
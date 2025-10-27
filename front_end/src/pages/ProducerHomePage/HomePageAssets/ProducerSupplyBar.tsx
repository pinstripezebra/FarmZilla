import React from "react";
import { Box, VStack, Text, Divider, Button, useDisclosure } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ProductEntryForm from "./ProductEntryForm";

interface ProducerSupplyBarProps {
  onProductAdded?: () => void;
  showAddProducts?: boolean; // New prop to control Add Products button visibility
}

const ProducerSupplyBar: React.FC<ProducerSupplyBarProps> = ({ 
  onProductAdded, 
  showAddProducts = true 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleCustomersClick = () => {
    navigate("/Customers");
  };

  const handleProductsClick = () => {
    navigate("/");
  };

  return (
    <Box width="220px" bg="gray.100" p={4} boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Button 
          variant="ghost" 
          colorScheme="teal" 
          fontWeight="bold" 
          fontSize="md" 
          justifyContent="flex-start" 
          p={0}
          onClick={handleProductsClick}
        >
          Products
        </Button>
        <Divider />
        <Text fontWeight="bold" fontSize="md" color="teal.700">Deals</Text>
        <Divider />
        <Button 
          variant="ghost" 
          colorScheme="teal" 
          fontWeight="bold" 
          fontSize="md" 
          justifyContent="flex-start" 
          p={0}
          onClick={handleCustomersClick}
        >
          Customers
        </Button>
        <Divider />
        {showAddProducts && (
          <Button colorScheme="teal" variant="solid" onClick={onOpen}>
            Add Products
          </Button>
        )}
      </VStack>
      <ProductEntryForm isOpen={isOpen} onClose={onClose} onProductAdded={onProductAdded} />
    </Box>
  );
};

export default ProducerSupplyBar;
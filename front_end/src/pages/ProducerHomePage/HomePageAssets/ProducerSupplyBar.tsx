import React from "react";
import { Box, VStack, Divider, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface ProducerSupplyBarProps {
  activePage?: 'products' | 'customers' | 'events'; // Updated to include events page
}

const ProducerSupplyBar: React.FC<ProducerSupplyBarProps> = ({ 
  activePage = 'products'
}) => {
  const navigate = useNavigate();

  const handleCustomersClick = () => {
    navigate("/Customers");
  };

  const handleProductsClick = () => {
    navigate("/");
  };

  const handleEventsClick = () => {
    navigate("/UpcomingEvents");
  };

  return (
    <Box width="220px" bg="gray.100" p={4} boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Button 
          variant={activePage === 'products' ? "solid" : "ghost"}
          colorScheme="teal" 
          fontWeight="bold" 
          fontSize="md" 
          justifyContent="flex-start" 
          p={0}
          onClick={handleProductsClick}
          bg={activePage === 'products' ? "teal.500" : "transparent"}
          color={activePage === 'products' ? "white" : "teal.600"}
          _hover={{
            bg: activePage === 'products' ? "teal.600" : "teal.50"
          }}
        >
          Products
        </Button>
        <Divider />
        <Button 
          variant={activePage === 'events' ? "solid" : "ghost"}
          colorScheme="teal" 
          fontWeight="bold" 
          fontSize="md" 
          justifyContent="flex-start" 
          p={0}
          onClick={handleEventsClick}
          bg={activePage === 'events' ? "teal.500" : "transparent"}
          color={activePage === 'events' ? "white" : "teal.600"}
          _hover={{
            bg: activePage === 'events' ? "teal.600" : "teal.50"
          }}
        >
          Upcoming Events
        </Button>
        <Divider />
        <Button 
          variant={activePage === 'customers' ? "solid" : "ghost"}
          colorScheme="teal" 
          fontWeight="bold" 
          fontSize="md" 
          justifyContent="flex-start" 
          p={0}
          onClick={handleCustomersClick}
          bg={activePage === 'customers' ? "teal.500" : "transparent"}
          color={activePage === 'customers' ? "white" : "teal.600"}
          _hover={{
            bg: activePage === 'customers' ? "teal.600" : "teal.50"
          }}
        >
          Customers
        </Button>
        <Divider />
      </VStack>
    </Box>
  );
};

export default ProducerSupplyBar;
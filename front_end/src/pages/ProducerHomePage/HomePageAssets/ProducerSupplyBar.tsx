import React from "react";
import { Box, VStack, Text, Divider } from "@chakra-ui/react";

const ProducerSupplyBar: React.FC = () => {
  return (
    <Box width="220px" bg="gray.100" p={4} boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="bold" fontSize="md" color="teal.700">Products</Text>
        <Divider />
        <Text fontWeight="bold" fontSize="md" color="teal.700">Deals</Text>
        <Divider />
        <Text fontWeight="bold" fontSize="md" color="teal.700">Customers</Text>
      </VStack>
    </Box>
  );
};

export default ProducerSupplyBar;

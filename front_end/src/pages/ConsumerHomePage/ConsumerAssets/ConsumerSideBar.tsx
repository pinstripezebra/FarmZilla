import React from "react";
import { Box, VStack, Text, Divider, Button } from "@chakra-ui/react";

interface ConsumerSideBarProps {
  onActionTriggered?: (action: string) => void;
}

const ConsumerSideBar: React.FC<ConsumerSideBarProps> = ({ onActionTriggered }) => {

  const handleBrowseProducts = () => {
    console.log("Browse Products clicked");
    onActionTriggered?.("browse-products");
  };

  const handleBrowseFarmers = () => {
    console.log("Browse Farmers clicked");
    onActionTriggered?.("browse-farmers");
  };

  const handleViewOrders = () => {
    console.log("View Orders clicked");
    onActionTriggered?.("my-orders");
  };

  const handleViewFavorites = () => {
    console.log("View Favorites clicked");
    onActionTriggered?.("favorites");
  };

  const handleCategoryClick = (category: string) => {
    console.log(`Category clicked: ${category}`);
    onActionTriggered?.(`category-${category.toLowerCase()}`);
  };

  return (
    <Box width="220px" bg="gray.100" p={4} boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="bold" fontSize="md" color="teal.700">Browse</Text>
        <Button colorScheme="teal" variant="outline" onClick={handleBrowseProducts}>
          Products
        </Button>
        <Button colorScheme="teal" variant="outline" onClick={handleBrowseFarmers}>
          Farmers
        </Button>
        
        <Divider />
        
        <Text fontWeight="bold" fontSize="md" color="teal.700">My Account</Text>
        <Button colorScheme="teal" variant="outline" onClick={handleViewOrders}>
          My Orders
        </Button>
        <Button colorScheme="teal" variant="outline" onClick={handleViewFavorites}>
          Favorites
        </Button>
        
        <Divider />
        
        <Text fontWeight="bold" fontSize="md" color="teal.700">Categories</Text>
        <Button colorScheme="gray" variant="ghost" size="sm" onClick={() => handleCategoryClick("Vegetables")}>
          Vegetables
        </Button>
        <Button colorScheme="gray" variant="ghost" size="sm" onClick={() => handleCategoryClick("Fruits")}>
          Fruits
        </Button>
        <Button colorScheme="gray" variant="ghost" size="sm" onClick={() => handleCategoryClick("Grains")}>
          Grains
        </Button>
        <Button colorScheme="gray" variant="ghost" size="sm" onClick={() => handleCategoryClick("Dairy")}>
          Dairy
        </Button>
        <Button colorScheme="gray" variant="ghost" size="sm" onClick={() => handleCategoryClick("Meat")}>
          Meat
        </Button>
      </VStack>
    </Box>
  );
};

export default ConsumerSideBar;
import React from "react";
import { Box, VStack, Text, Divider, Button } from "@chakra-ui/react";

interface ConsumerSideBarProps {
  onActionTriggered?: (action: string) => void;
  currentView?: string;
}

const ConsumerSideBar: React.FC<ConsumerSideBarProps> = ({ onActionTriggered, currentView }) => {

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
        <Button 
          colorScheme="teal" 
          variant={currentView === "browse-products" ? "solid" : "outline"}
          onClick={handleBrowseProducts}
          bg={currentView === "browse-products" ? "teal.600" : undefined}
          color={currentView === "browse-products" ? "white" : undefined}
        >
          Products
        </Button>
        <Button 
          colorScheme="teal" 
          variant={currentView === "browse-farmers" ? "solid" : "outline"}
          onClick={handleBrowseFarmers}
          bg={currentView === "browse-farmers" ? "teal.600" : undefined}
          color={currentView === "browse-farmers" ? "white" : undefined}
        >
          Farmers
        </Button>
        
        <Divider />
        
        <Text fontWeight="bold" fontSize="md" color="teal.700">My Account</Text>
        <Button 
          colorScheme="teal" 
          variant={currentView === "my-orders" ? "solid" : "outline"}
          onClick={handleViewOrders}
          bg={currentView === "my-orders" ? "teal.600" : undefined}
          color={currentView === "my-orders" ? "white" : undefined}
        >
          My Orders
        </Button>
        <Button 
          colorScheme="teal" 
          variant={currentView === "favorites" ? "solid" : "outline"}
          onClick={handleViewFavorites}
          bg={currentView === "favorites" ? "teal.600" : undefined}
          color={currentView === "favorites" ? "white" : undefined}
        >
          Favorites
        </Button>
        
        <Divider />
        
        <Text fontWeight="bold" fontSize="md" color="teal.700">Categories</Text>
        <Button 
          colorScheme={currentView === "category-vegetables" ? "teal" : "gray"} 
          variant={currentView === "category-vegetables" ? "solid" : "ghost"} 
          size="sm" 
          onClick={() => handleCategoryClick("Vegetables")}
          bg={currentView === "category-vegetables" ? "teal.500" : undefined}
          color={currentView === "category-vegetables" ? "white" : undefined}
        >
          Vegetables
        </Button>
        <Button 
          colorScheme={currentView === "category-fruits" ? "teal" : "gray"} 
          variant={currentView === "category-fruits" ? "solid" : "ghost"} 
          size="sm" 
          onClick={() => handleCategoryClick("Fruits")}
          bg={currentView === "category-fruits" ? "teal.500" : undefined}
          color={currentView === "category-fruits" ? "white" : undefined}
        >
          Fruits
        </Button>
        <Button 
          colorScheme={currentView === "category-grains" ? "teal" : "gray"} 
          variant={currentView === "category-grains" ? "solid" : "ghost"} 
          size="sm" 
          onClick={() => handleCategoryClick("Grains")}
          bg={currentView === "category-grains" ? "teal.500" : undefined}
          color={currentView === "category-grains" ? "white" : undefined}
        >
          Grains
        </Button>
        <Button 
          colorScheme={currentView === "category-dairy" ? "teal" : "gray"} 
          variant={currentView === "category-dairy" ? "solid" : "ghost"} 
          size="sm" 
          onClick={() => handleCategoryClick("Dairy")}
          bg={currentView === "category-dairy" ? "teal.500" : undefined}
          color={currentView === "category-dairy" ? "white" : undefined}
        >
          Dairy
        </Button>
        <Button 
          colorScheme={currentView === "category-meat" ? "teal" : "gray"} 
          variant={currentView === "category-meat" ? "solid" : "ghost"} 
          size="sm" 
          onClick={() => handleCategoryClick("Meat")}
          bg={currentView === "category-meat" ? "teal.500" : undefined}
          color={currentView === "category-meat" ? "white" : undefined}
        >
          Meat
        </Button>
      </VStack>
    </Box>
  );
};

export default ConsumerSideBar;
import React, { useState } from "react";
import { Box, Flex, Text, Heading, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ConsumerSideBar from "./ConsumerAssets/ConsumerSideBar";
import MarketplaceProductsTable from "../../components/MarketplaceProductsTable";
import MarketPlaceFarmsTable from "../../components/MarketPlaceFarmsTable";
import ConsumerFavoritesPage from "./ConsumerAssets/ConsumerFavoritesPage";
import { useUser } from "../../context/UserContex";

const ConsumerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const username = user?.username || localStorage.getItem("username") || "User";
  const [currentView, setCurrentView] = useState<string>("welcome");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null); // Clear user context
    navigate("/Logout");
  };

  const handleSidebarAction = (action: string) => {
    console.log("Sidebar action triggered:", action);
    setCurrentView(action);
  };

  const renderContent = () => {
    switch (currentView) {
      case "browse-products":
        return <MarketplaceProductsTable />;
      case "browse-farmers":
        return <MarketPlaceFarmsTable />;
      case "my-orders":
        return (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text fontWeight="bold" fontSize="2xl" color="gray.500">
              My Orders - Coming Soon
            </Text>
          </Box>
        );
      case "favorites":
        return <ConsumerFavoritesPage />;
      case "category-vegetables":
      case "category-fruits":
      case "category-grains":
      case "category-dairy":
      case "category-meat":
        const category = currentView.replace("category-", "");
        return (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text fontWeight="bold" fontSize="2xl" color="gray.500">
              {category.charAt(0).toUpperCase() + category.slice(1)} - Coming Soon
            </Text>
          </Box>
        );
      default:
        return (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text fontWeight="bold" fontSize="2xl" color="gray.500">
              Welcome to FarmZilla Marketplace! Browse products using the sidebar.
            </Text>
          </Box>
        );
    }
  };

  return (
    <Flex height="100vh" direction="column">
      {/* Top Bar */}
      <Flex bg="teal.600" color="white" align="center" height="60px" px={6} boxShadow="md">
        <Text fontWeight="bold" fontSize="lg">{username}</Text>
      </Flex>
      
      <Flex flex="1" direction="row">
        {/* Sidebar */}
        <ConsumerSideBar onActionTriggered={handleSidebarAction} currentView={currentView} />
        
        {/* Main Content */}
        <Flex flex="1" direction="column" p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading color="teal.600" size="lg">Marketplace</Heading>
            <Button colorScheme="teal" onClick={handleLogout}>
              Logout
            </Button>
          </Flex>
          
          {/* Content Area */}
          <Box flex="1" overflowY="auto">
            {renderContent()}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConsumerHome;

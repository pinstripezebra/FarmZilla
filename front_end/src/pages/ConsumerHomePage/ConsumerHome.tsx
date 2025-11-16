import React, { useState } from "react";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";
import ConsumerSideBar from "./ConsumerAssets/ConsumerSideBar";
import MarketplaceProductsTable from "../../components/MarketplaceProductsTable";
import MarketPlaceFarmsTable from "../../components/MarketPlaceFarmsTable";
import ConsumerFavoritesPage from "./ConsumerAssets/ConsumerFavoritesPage";
import ViewFarmerProducts from "./ConsumerAssets/ViewFarmerProducts";
import ConsumerMap from "./ConsumerAssets/ConsumerMap";
import TopBar from "../../components/TopBar";

interface Producer {
  id: string;
  username: string;
  email: string;
  role: string;
  productCount?: number;
}

const ConsumerHome: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>("maps");
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);

  const handleSidebarAction = (action: string) => {
    console.log("Sidebar action triggered:", action);
    setCurrentView(action);
    setSelectedProducer(null); // Clear selected producer when changing views
  };

  const handleViewFarmerProducts = (producer: Producer) => {
    setSelectedProducer(producer);
    setCurrentView("view-farmer-products");
  };

  const handleBackToFarmers = () => {
    setSelectedProducer(null);
    setCurrentView("browse-farmers");
  };

  const renderContent = () => {
    switch (currentView) {
      case "maps":
        return <ConsumerMap height="calc(100vh - 200px)" />;
      case "browse-products":
        return <MarketplaceProductsTable onViewProducer={handleViewFarmerProducts} />;
      case "browse-farmers":
        return <MarketPlaceFarmsTable onViewProducts={handleViewFarmerProducts} />;
      case "view-farmer-products":
        return selectedProducer ? (
          <ViewFarmerProducts 
            producer={selectedProducer} 
            onBack={handleBackToFarmers} 
          />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text fontWeight="bold" fontSize="2xl" color="gray.500">
              No farmer selected
            </Text>
          </Box>
        );
      case "my-orders":
        return (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text fontWeight="bold" fontSize="2xl" color="gray.500">
              My Orders - Coming Soon
            </Text>
          </Box>
        );
      case "favorites":
        return <ConsumerFavoritesPage onViewProducts={handleViewFarmerProducts} />;
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
      <TopBar showLogoutButton={true} />
      
      <Flex flex="1" direction="row">
        {/* Sidebar */}
        <ConsumerSideBar onActionTriggered={handleSidebarAction} currentView={currentView} />
        
        {/* Main Content */}
        <Flex flex="1" direction="column" p={6}>
          <Heading color="teal.600" size="lg" mb={6}>
            {currentView === "view-farmer-products" && selectedProducer 
              ? `${selectedProducer.username}'s Products`
              : currentView === "maps" 
              ? "Local Market Map"
              : "Marketplace"
            }
          </Heading>
          
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

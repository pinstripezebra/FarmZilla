import React from "react";
import { Heading, Button, Flex, Text, Box } from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import EventsMap from "../../components/EventsMap";
import { useNavigate } from "react-router-dom";

const UpcomingEvents: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <Flex height="100vh" direction="column">
      {/* Top Bar */}
      <Flex bg="teal.600" color="white" align="center" justify="space-between" height="60px" px={6} boxShadow="md">
        <Text fontWeight="bold" fontSize="lg">{username}</Text>
        <Button 
          bg="white" 
          color="teal.600" 
          variant="solid" 
          onClick={handleLogout}
          _hover={{
            bg: "gray.100",
            transform: "translateY(-1px)",
            boxShadow: "md"
          }}
          _active={{
            bg: "gray.200",
            transform: "translateY(0)"
          }}
        >
          Logout
        </Button>
      </Flex>
      
      <Flex flex="1" direction="row">
        {/* Sidebar */}
        <ProducerSupplyBar activePage="events" />
        
        {/* Main Content */}
        <Flex flex="1" direction="column" p={6}>
          <Flex justify="flex-start" align="center" mb={6}>
            <Flex align="center" gap={4}>
              <Button variant="outline" colorScheme="teal" onClick={handleBack}>
                ← Back to Products
              </Button>
              <Heading color="teal.600" size="lg">Upcoming Events</Heading>
            </Flex>
          </Flex>
          
          {/* Map Container */}
          <Box flex="1" minHeight="0">
            <EventsMap height="100%" />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default UpcomingEvents;
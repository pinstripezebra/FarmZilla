
import React from "react";
import { Heading, Button, Flex, Text } from "@chakra-ui/react";
import ProducerSupplyBar from "./HomePageAssets/ProducerSupplyBar";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  return (
    <Flex height="100vh" direction="column">
      {/* Top Bar */}
      <Flex bg="teal.600" color="white" align="center" height="60px" px={6} boxShadow="md">
        <Text fontWeight="bold" fontSize="lg">{username}</Text>
      </Flex>
      <Flex flex="1" direction="row">
        {/* Sidebar */}
        <ProducerSupplyBar />
        {/* Main Content */}
        <Flex flex="1" align="center" justify="center" direction="column">
          <Heading color="teal.600" mb={8}>Successfully logged in</Heading>
          <Button colorScheme="teal" onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Home;

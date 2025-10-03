import React from "react";
import { Box, Heading, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/Logout");
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Heading color="teal.600" mb={8}>Successfully logged in</Heading>
      <Button colorScheme="teal" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
};

export default Home;

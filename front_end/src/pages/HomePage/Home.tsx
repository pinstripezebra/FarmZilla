import React from "react";
import { Box, Heading } from "@chakra-ui/react";

const Home: React.FC = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
      <Heading color="teal.600">Successfully logged in</Heading>
    </Box>
  );
};

export default Home;

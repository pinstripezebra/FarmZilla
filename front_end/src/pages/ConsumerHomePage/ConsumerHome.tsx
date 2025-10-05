import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import ConsumeTopBar from "./ConsumerAssets/ConsumeTopBar";

const ConsumerHome: React.FC = () => {
  const username = localStorage.getItem("username") || "User";

  return (
    <Flex direction="column" height="100vh">
      {/* Top Bar */}
      <ConsumeTopBar username={username} />
      {/* Scrollable Center Content */}
      <Box flex="1" overflowY="auto" display="flex" alignItems="center" justifyContent="center">
        <Text fontWeight="bold" fontSize="2xl">Placeholder</Text>
      </Box>
    </Flex>
  );
};

export default ConsumerHome;

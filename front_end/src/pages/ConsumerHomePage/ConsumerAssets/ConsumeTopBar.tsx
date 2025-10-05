import React from "react";
import { Flex, Input, Text } from "@chakra-ui/react";

interface ConsumeTopBarProps {
  username: string;
}

const ConsumeTopBar: React.FC<ConsumeTopBarProps> = ({ username }) => {
  return (
    <Flex bg="teal.600" color="white" align="center" height="60px" px={6} boxShadow="md" justify="space-between">
      <Flex flex="1" justify="center">
        <Input
          placeholder="Search..."
          width="300px"
          bg="white"
          color="black"
          borderRadius="md"
          _placeholder={{ color: "gray.500" }}
        />
      </Flex>
      <Text fontWeight="bold" fontSize="lg" ml={4} minWidth="120px" textAlign="right">
        {username}
      </Text>
    </Flex>
  );
};

export default ConsumeTopBar;

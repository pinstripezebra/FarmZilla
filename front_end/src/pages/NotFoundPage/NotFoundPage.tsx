import React from "react";
import { Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div>
      <Text fontSize="xl" marginBottom="4">
        404 Page not found
      </Text>
      <Button as={Link} to="/" colorScheme="teal" size="md">
        Go back to Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
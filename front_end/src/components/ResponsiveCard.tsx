import React from 'react';
import {
  Card,
  CardBody,
  useBreakpointValue
} from '@chakra-ui/react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  minHeight?: string;
  shadow?: string;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
  children, 
  minHeight = "200px",
  shadow = "md"
}) => {
  const cardPadding = useBreakpointValue({ base: 4, md: 6 });
  
  return (
    <Card 
      shadow={shadow}
      borderRadius="lg"
      overflow="hidden"
      minH={minHeight}
      transition="all 0.2s"
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
    >
      <CardBody p={cardPadding}>
        {children}
      </CardBody>
    </Card>
  );
};

export default ResponsiveCard;
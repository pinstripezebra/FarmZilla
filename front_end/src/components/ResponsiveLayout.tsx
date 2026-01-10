import React from 'react';
import {
  Box,
  Container,
  useBreakpointValue,
  useColorModeValue
} from '@chakra-ui/react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
  fullHeight?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  maxWidth = "7xl",
  fullHeight = true 
}) => {
  const padding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Box minH={fullHeight ? "100vh" : "auto"} bg={bgColor}>
      <Container maxW={maxWidth} p={padding}>
        {children}
      </Container>
    </Box>
  );
};

export default ResponsiveLayout;
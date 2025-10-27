import React from 'react';
import { Box, VStack, Card, CardBody, Heading, Text, Grid, GridItem } from '@chakra-ui/react';

interface EventsMapProps {
  height?: string;
  width?: string;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  height = "400px", 
  width = "100%" 
}) => {
  // Sample events data
  const sampleEvents = [
    {
      id: 1,
      name: "Farmers Market Downtown",
      date: "2025-11-01",
      time: "8:00 AM - 2:00 PM",
      location: "Downtown Seattle",
      description: "Weekly farmers market featuring local produce",
      coordinates: "47.6062, -122.3321"
    },
    {
      id: 2,
      name: "Agricultural Fair",
      date: "2025-11-15",
      time: "9:00 AM - 6:00 PM",
      location: "Seattle Center",
      description: "Annual agricultural fair and exhibition",
      coordinates: "47.6205, -122.3493"
    },
    {
      id: 3,
      name: "Farm to Table Event",
      date: "2025-12-01",
      time: "5:00 PM - 9:00 PM",
      location: "Capitol Hill",
      description: "Farm to table dining experience",
      coordinates: "47.5952, -122.3316"
    }
  ];

  // OpenStreetMap iframe URL for Seattle area
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik&marker=47.6062%2C-122.3321";

  return (
    <Box height={height} width={width} borderRadius="md" overflow="hidden" boxShadow="md">
      <Grid templateColumns="1fr 1fr" height="100%">
        {/* Map Section */}
        <GridItem>
          <Box height="100%" position="relative">
            <iframe
              src={mapUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px 0 0 8px'
              }}
              title="Events Map"
            />
            <Box
              position="absolute"
              top={2}
              left={2}
              bg="white"
              px={2}
              py={1}
              borderRadius="md"
              boxShadow="sm"
              fontSize="xs"
              fontWeight="bold"
              color="teal.600"
            >
              📍 Event Locations
            </Box>
          </Box>
        </GridItem>

        {/* Events List Section */}
        <GridItem bg="gray.50" p={4}>
          <VStack spacing={4} align="stretch" height="100%" overflowY="auto">
            <Heading size="md" color="teal.600" textAlign="center">
              Upcoming Events
            </Heading>
            
            {sampleEvents.map((event) => (
              <Card key={event.id} variant="outline" size="sm">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Heading size="sm" color="teal.600">
                      {event.name}
                    </Heading>
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">
                      📅 {event.date}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      🕐 {event.time}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      📍 {event.location}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Coordinates: {event.coordinates}
                    </Text>
                    <Text fontSize="sm">
                      {event.description}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default EventsMap;
import React, { useState, useEffect } from 'react';
import { Box, VStack, Card, CardBody, Heading, Text, Grid, GridItem, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { eventService, type Event } from '../services/eventService';

interface EventsMapProps {
  height?: string;
  width?: string;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  height = "400px", 
  width = "100%" 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData);
        setError("");
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // OpenStreetMap iframe URL for Seattle area
  const mapUrl = "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik&marker=47.6062%2C-122.3321";

  const renderEventsContent = () => {
    if (loading) {
      return (
        <VStack spacing={4} align="center" justify="center" height="100%">
          <Spinner size="lg" color="teal.500" />
          <Text>Loading events...</Text>
        </VStack>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      );
    }

    if (events.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No events found
        </Alert>
      );
    }

    return (
      <VStack spacing={4} align="stretch" height="100%" overflowY="auto">
        <Heading size="md" color="teal.600" textAlign="center">
          Upcoming Events
        </Heading>
        
        {events.map((event) => (
          <Card key={event.event_id} variant="outline" size="sm">
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
    );
  };

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
          {renderEventsContent()}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default EventsMap;
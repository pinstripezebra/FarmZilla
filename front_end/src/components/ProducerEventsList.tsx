import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  Grid, 
  GridItem, 
  Spinner, 
  Alert, 
  AlertIcon,
  Badge,
  HStack,
  Icon,
  Button
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, InfoIcon } from '@chakra-ui/icons';
import { eventService, type Event } from '../services/eventService';

interface ProducerEventsListProps {
  producerId: string;
  maxEvents?: number;
  showHeading?: boolean;
  compact?: boolean;
  showWithdraw?: boolean;
  onWithdraw?: (eventId: string) => void;
  withdrawLoading?: string;
}

const ProducerEventsList: React.FC<ProducerEventsListProps> = ({ 
  producerId, 
  maxEvents,
  showHeading = true,
  compact = false,
  showWithdraw = false,
  onWithdraw,
  withdrawLoading
}) => {
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProducerEvents = async () => {
      if (!producerId) {
        setError("Producer ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch all events
        const allEvents = await eventService.getAllEvents();
        
        // Fetch producer's event vendor relationships
        const userEventVendors = await eventService.getEventVendorsByProducerId(producerId);

        // Filter events that the producer is signed up for
        const producerEvents = allEvents.filter(event => 
          userEventVendors.some(vendor => vendor.event_id === event.event_id)
        );

        // Sort events by date (assuming date format is sortable)
        const sortedEvents = producerEvents.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Limit events if maxEvents is specified
        const eventsToShow = maxEvents ? sortedEvents.slice(0, maxEvents) : sortedEvents;
        
        setUserEvents(eventsToShow);
      } catch (err: any) {
        console.error('Error fetching producer events:', err);
        setError(err.message || "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchProducerEvents();
  }, [producerId, maxEvents]);

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner size="lg" color="teal.500" />
        <Text mt={2} color="gray.600">Loading events...</Text>
      </Box>
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

  if (userEvents.length === 0) {
    return (
      <Box>
        {showHeading && (
          <Heading size={compact ? "md" : "lg"} color="teal.600" mb={4}>
            Upcoming Events
          </Heading>
        )}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No upcoming events found. Sign up for events to see them here!
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {showHeading && (
        <Heading size={compact ? "md" : "lg"} color="teal.600" mb={4}>
          Upcoming Events ({userEvents.length})
        </Heading>
      )}
      
      <Grid templateColumns={compact ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))"} gap={4}>
        {userEvents.map((event) => (
          <GridItem key={event.event_id}>
            <Card 
              shadow="md" 
              borderRadius="lg"
              bg="white"
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
              transition="all 0.2s"
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" width="100%">
                    <Heading size={compact ? "sm" : "md"} color="teal.700" noOfLines={1}>
                      {event.name}
                    </Heading>
                    {showWithdraw ? (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        isLoading={withdrawLoading === event.event_id}
                        loadingText="Withdrawing..."
                        onClick={() => onWithdraw?.(event.event_id)}
                      >
                        Withdraw
                      </Button>
                    ) : (
                      <Badge colorScheme="green" size="sm">
                        Signed Up
                      </Badge>
                    )}
                  </HStack>
                  
                  <VStack align="start" spacing={2} width="100%">
                    <HStack>
                      <Icon as={CalendarIcon} color="gray.500" boxSize={4} />
                      <Text fontSize={compact ? "xs" : "sm"} color="gray.600">
                        {event.date}
                      </Text>
                    </HStack>
                    
                    <HStack>
                      <Icon as={TimeIcon} color="gray.500" boxSize={4} />
                      <Text fontSize={compact ? "xs" : "sm"} color="gray.600">
                        {event.time}
                      </Text>
                    </HStack>
                    
                    <HStack align="start">
                      <Icon as={InfoIcon} color="gray.500" boxSize={4} mt={0.5} />
                      <Text 
                        fontSize={compact ? "xs" : "sm"} 
                        color="gray.600"
                        noOfLines={compact ? 2 : 3}
                      >
                        {event.location}
                      </Text>
                    </HStack>
                  </VStack>
                  
                  {!compact && (
                    <Text fontSize="sm" color="gray.700" noOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
};

export default ProducerEventsList;
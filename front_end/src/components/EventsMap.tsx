import React, { useState, useEffect } from 'react';
import { Box, Grid, GridItem } from '@chakra-ui/react';
import EventsMapDisplay from './EventsMapDisplay';
import AddRemoveEvent from './AddRemoveEvent';
import { eventService, type Event, type EventVendor } from '../services/eventService';
import { useUser } from '../context/UserContex';

interface EventsMapProps {
  height?: string;
  width?: string;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  height = "400px", 
  width = "100%" 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEventVendors, setUserEventVendors] = useState<EventVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  const { user } = useUser();

  const fetchEventsAndUserData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all events
      const eventsData = await eventService.getAllEvents();
      setEvents(eventsData);

      // If user is logged in, fetch their event vendor relationships
      if (user?.id) {
        const userEventVendorsData = await eventService.getEventVendorsByProducerId(user.id);
        setUserEventVendors(userEventVendorsData);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndUserData();
  }, [user?.id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height} width={width}>
        Loading events...
      </Box>
    );
  }

  if (error) {
    return (
      <Box color="red.500" textAlign="center" height={height} width={width}>
        {error}
      </Box>
    );
  }

  return (
    <Box height={height} width={width}>
      <Grid templateColumns="1fr 1fr" gap={4} height="100%">
        {/* Left side - Map */}
        <GridItem>
          <EventsMapDisplay 
            events={events} 
            userEventVendors={userEventVendors} 
            userLocation={user?.location}
            height="100%" 
          />
        </GridItem>

        {/* Right side - Event signup/management */}
        <GridItem>
          <AddRemoveEvent 
            events={events}
            userEventVendors={userEventVendors}
            loading={loading}
            error={error}
            onDataRefresh={fetchEventsAndUserData}
          />
        </GridItem>
      </Grid>
    </Box>
  );
};

export default EventsMap;
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Event {
  id?: string;
  event_id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coordinates: string;
}

export interface EventVendor {
  id?: string;
  event_id: string;
  consumer_id: string;
}

class EventService {
  // Event methods
  async getAllEvents(): Promise<Event[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEventById(eventId: string): Promise<Event[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/`, {
        params: { event_id: eventId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw error;
    }
  }

  async createEvent(event: Event): Promise<Event> {
    try {
      const response = await axios.post(`${API_BASE_URL}/events/`, event);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<any> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Event Vendor methods
  async getAllEventVendors(): Promise<EventVendor[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/event_vendor/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event vendors:', error);
      throw error;
    }
  }

  async getEventVendorsByEventId(eventId: string): Promise<EventVendor[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/event_vendor/`, {
        params: { event_id: eventId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event vendors by event ID:', error);
      throw error;
    }
  }

  async getEventVendorsByConsumerId(consumerId: string): Promise<EventVendor[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/event_vendor/`, {
        params: { consumer_id: consumerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching event vendors by consumer ID:', error);
      throw error;
    }
  }

  async createEventVendor(eventId: string, consumerId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/event_vendor/`, null, {
        params: { event_id: eventId, consumer_id: consumerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating event vendor:', error);
      throw error;
    }
  }

  async deleteEventVendor(eventId: string, consumerId: string): Promise<any> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/event_vendor/`, {
        params: { event_id: eventId, consumer_id: consumerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting event vendor:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
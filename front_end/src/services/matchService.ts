import api from './apli-client';

export interface ProducerConsumerMatch {
  id: string;
  producer_id: string;
  consumer_id: string;
  created_at?: string;
}

export const matchService = {
  // Get all matches for a specific producer
  getMatchesForProducer: async (producerId: string): Promise<ProducerConsumerMatch[]> => {
    try {
      const response = await api.get(`/v1/producer_consumer_matches/?producer_id=${producerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching producer matches:', error);
      throw error;
    }
  },

  // Get all matches for a specific consumer
  getMatchesForConsumer: async (consumerId: string): Promise<ProducerConsumerMatch[]> => {
    try {
      const response = await api.get(`/v1/producer_consumer_matches/?consumer_id=${consumerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consumer matches:', error);
      throw error;
    }
  },

  // Get all matches
  getAllMatches: async (): Promise<ProducerConsumerMatch[]> => {
    try {
      const response = await api.get('/v1/producer_consumer_matches/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all matches:', error);
      throw error;
    }
  },

  // Create a new producer-consumer match
  createMatch: async (producerId: string, consumerId: string): Promise<{ message: string; match_id: string }> => {
    try {
      const response = await api.post(`/v1/producer_consumer_matches/?producer_id=${producerId}&consumer_id=${consumerId}`);
      return response.data;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Delete a producer-consumer match
  deleteMatch: async (producerId: string, consumerId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/v1/producer_consumer_matches/?producer_id=${producerId}&consumer_id=${consumerId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }
};

export default matchService;
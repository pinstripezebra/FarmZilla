import React, { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { type Event, type EventVendor } from '../services/eventService';

interface EventsMapDisplayProps {
  events: Event[];
  userEventVendors: EventVendor[];
  height?: string;
}

const EventsMapDisplay: React.FC<EventsMapDisplayProps> = ({ 
  events, 
  userEventVendors,
  height = "100%" 
}) => {
  const [mapUrl, setMapUrl] = useState<string>("");

  // Generate dynamic map URL with event markers using Leaflet
  const generateMapUrl = () => {
    if (events.length === 0) {
      // Default Seattle area if no events
      return "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik";
    }

    // Parse coordinates and create markers data
    const coordinates = events.map(event => {
      const [lat, lng] = event.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng, event };
    }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

    if (coordinates.length === 0) {
      // Fallback if no valid coordinates
      return "https://www.openstreetmap.org/export/embed.html?bbox=-122.4194%2C47.5444%2C-122.2419%2C47.6742&layer=mapnik";
    }

    // Calculate bounding box
    const lats = coordinates.map(coord => coord.lat);
    const lngs = coordinates.map(coord => coord.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding to bounds (minimum padding for single point)
    const latPadding = Math.max((maxLat - minLat) * 0.2, 0.01);
    const lngPadding = Math.max((maxLng - minLng) * 0.2, 0.01);

    // Create markers data
    const markersData = coordinates.map(coord => {
      const isUserEvent = userEventVendors.some(vendor => vendor.event_id === coord.event.event_id);
      return {
        lat: coord.lat,
        lng: coord.lng,
        name: coord.event.name,
        date: coord.event.date,
        time: coord.event.time,
        location: coord.event.location,
        isUserEvent
      };
    });

    // Generate Leaflet map HTML
    const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-popup { font-family: Arial, sans-serif; }
        .user-event { color: #38a169; font-weight: bold; }
        .available-event { color: #3182ce; font-weight: bold; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').fitBounds([
            [${minLat - latPadding}, ${minLng - lngPadding}],
            [${maxLat + latPadding}, ${maxLng + lngPadding}]
        ]);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        var markers = ${JSON.stringify(markersData)};
        
        markers.forEach(function(marker) {
            var icon = L.divIcon({
                html: '<div style="background-color: ' + (marker.isUserEvent ? '#38a169' : '#3182ce') + '; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-size: 16px;">📍</div>',
                className: 'custom-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            var popupContent = '<div class="custom-popup">' +
                '<div class="' + (marker.isUserEvent ? 'user-event' : 'available-event') + '">' + marker.name + '</div>' +
                '<div>📅 ' + marker.date + '</div>' +
                '<div>🕐 ' + marker.time + '</div>' +
                '<div>📍 ' + marker.location + '</div>' +
                '<div style="margin-top: 5px; font-size: 12px; color: #666;">' + 
                (marker.isUserEvent ? 'You are attending this event' : 'Available to join') + '</div>' +
                '</div>';
            
            var mapMarker = L.marker([marker.lat, marker.lng], {icon: icon})
                .addTo(map)
                .bindPopup(popupContent);
            
            // Show popup on hover instead of click
            mapMarker.on('mouseover', function() {
                this.openPopup();
            });
            
            mapMarker.on('mouseout', function() {
                this.closePopup();
            });
        });
    </script>
</body>
</html>`;

    // Convert to data URI
    const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(mapHtml);
    return dataUri;
  };

  // Update map URL when events change
  useEffect(() => {
    const newMapUrl = generateMapUrl();
    setMapUrl(newMapUrl);
  }, [events, userEventVendors]);

  return (
    <Box height={height} position="relative">
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
        📍 Event Locations ({events.length})
      </Box>
    </Box>
  );
};

export default EventsMapDisplay;
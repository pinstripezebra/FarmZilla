import React, { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { type Event, type EventVendor } from '../services/eventService';

interface EventsMapDisplayProps {
  events: Event[];
  userEventVendors: EventVendor[];
  height?: string;
  userLocation?: string; // User's location in "lat,lng" format
  defaultZoom?: number; // Default zoom level when no events
  selectedEventId?: string | null; // ID of currently selected event
  onEventSelect?: (eventId: string | null) => void; // Callback for event selection
}

const EventsMapDisplay: React.FC<EventsMapDisplayProps> = ({ 
  events, 
  userEventVendors,
  height = "100%",
  userLocation,
  defaultZoom = 0.05,
  selectedEventId,
  onEventSelect
}) => {
  const [mapUrl, setMapUrl] = useState<string>("");

  // Generate dynamic map URL with event markers using Leaflet
  const generateMapUrl = () => {
    // Helper function to get default location
    const getDefaultLocation = () => {
      if (userLocation) {
        try {
          const [lat, lng] = userLocation.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        } catch (e) {
          console.warn('Invalid user location format:', userLocation);
        }
      }
      // Default to Portland, OR area (based on the user data coordinates)
      return { lat: 45.5152, lng: -122.6784 };
    };

    if (events.length === 0) {
      // Use user's location or default area if no events
      const defaultLoc = getDefaultLocation();
      const padding = defaultZoom; // Use configurable zoom level around user location
      const minLat = defaultLoc.lat - padding;
      const maxLat = defaultLoc.lat + padding;
      const minLng = defaultLoc.lng - padding;
      const maxLng = defaultLoc.lng + padding;
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`;
    }

    // Parse coordinates and create markers data
    const coordinates = events.map(event => {
      const [lat, lng] = event.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng, event };
    }).filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

    if (coordinates.length === 0) {
      // Fallback to user location if no valid event coordinates
      const defaultLoc = getDefaultLocation();
      const padding = defaultZoom; // Use configurable zoom level
      const minLat = defaultLoc.lat - padding;
      const maxLat = defaultLoc.lat + padding;
      const minLng = defaultLoc.lng - padding;
      const maxLng = defaultLoc.lng + padding;
      
      return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`;
    }

    // Calculate bounding box centered on user location first
    const defaultLoc = getDefaultLocation();
    
    // Start with user-centered bounds using the default zoom level
    let minLat = defaultLoc.lat - defaultZoom;
    let maxLat = defaultLoc.lat + defaultZoom;
    let minLng = defaultLoc.lng - defaultZoom;
    let maxLng = defaultLoc.lng + defaultZoom;

    // Only expand the view if there are nearby events (within reasonable distance)
    if (coordinates.length > 0) {
      const eventLats = coordinates.map(coord => coord.lat);
      const eventLngs = coordinates.map(coord => coord.lng);
      
      const eventMinLat = Math.min(...eventLats);
      const eventMaxLat = Math.max(...eventLats);
      const eventMinLng = Math.min(...eventLngs);
      const eventMaxLng = Math.max(...eventLngs);
      
      // Check if events are within a reasonable distance from user (0.1 degrees ≈ 11km)
      const maxDistance = 0.1;
      const eventsNearby = coordinates.some(coord => 
        Math.abs(coord.lat - defaultLoc.lat) <= maxDistance &&
        Math.abs(coord.lng - defaultLoc.lng) <= maxDistance
      );
      
      // Only expand bounds to include events if they're nearby
      if (eventsNearby) {
        minLat = Math.min(minLat, eventMinLat);
        maxLat = Math.max(maxLat, eventMaxLat);
        minLng = Math.min(minLng, eventMinLng);
        maxLng = Math.max(maxLng, eventMaxLng);
        
        // Add small padding around the expanded bounds
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;
        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;
      }
    }

    // Create markers data (without selection state - handled dynamically)
    const markersData = coordinates.map(coord => {
      const isUserEvent = userEventVendors.some(vendor => vendor.event_id === coord.event.event_id);
      return {
        lat: coord.lat,
        lng: coord.lng,
        name: coord.event.name,
        date: coord.event.date,
        time: coord.event.time,
        location: coord.event.location,
        isUserEvent,
        isSelected: false, // Always start unselected - selection handled dynamically
        eventId: coord.event.event_id,
        type: 'event'
      };
    });

    // Add user location marker if available
    if (userLocation) {
      const defaultLoc = getDefaultLocation();
      markersData.push({
        lat: defaultLoc.lat,
        lng: defaultLoc.lng,
        name: 'Your Location',
        date: '',
        time: '',
        location: 'Your current location',
        isUserEvent: false,
        isSelected: false,
        eventId: '',
        type: 'user'
      });
    }

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
            [${minLat}, ${minLng}],
            [${maxLat}, ${maxLng}]
        ]);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        var markers = ${JSON.stringify(markersData)};
        
        markers.forEach(function(marker) {
            var icon, popupContent;
            
            if (marker.type === 'user') {
                // User location marker
                icon = L.divIcon({
                    html: '<div style="background-color: #38a169; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-size: 18px;">📍</div>',
                    className: 'user-marker',
                    iconSize: [35, 35],
                    iconAnchor: [17.5, 17.5]
                });
                
                popupContent = '<div class="custom-popup">' +
                    '<div style="color: #38a169; font-weight: bold;">' + marker.name + '</div>' +
                    '<div>📍 ' + marker.location + '</div>' +
                    '</div>';
            } else {
                // Event marker - start with unselected styling (selection handled dynamically)
                var markerColor = marker.isUserEvent ? '#38a169' : '#3182ce';
                var markerSize = 30;
                var borderWidth = 3;
                
                icon = L.divIcon({
                    html: '<div style="background-color: ' + markerColor + '; color: white; border-radius: 50%; width: ' + markerSize + 'px; height: ' + markerSize + 'px; display: flex; align-items: center; justify-content: center; border: ' + borderWidth + 'px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-size: 16px; cursor: pointer;">🎪</div>',
                    className: 'event-marker',
                    iconSize: [markerSize, markerSize],
                    iconAnchor: [markerSize/2, markerSize/2]
                });
                
                popupContent = '<div class="custom-popup">' +
                    '<div class="' + (marker.isUserEvent ? 'user-event' : 'available-event') + '">' + marker.name + '</div>' +
                    '<div>📅 ' + marker.date + '</div>' +
                    '<div>🕐 ' + marker.time + '</div>' +
                    '<div>📍 ' + marker.location + '</div>' +
                    '<div style="margin-top: 5px; font-size: 12px; color: #666;">' + 
                    (marker.isUserEvent ? 'You are attending this event' : 'Available to join') + '</div>' +
                    '</div>';
            }
            
            var mapMarker = L.marker([marker.lat, marker.lng], {icon: icon})
                .addTo(map)
                .bindPopup(popupContent);
            
            // Add click handler for event selection
            if (marker.type === 'event') {
                mapMarker.on('click', function() {
                    // Check current selection state from the marker's current data
                    var currentlySelected = mapMarker.originalData ? mapMarker.originalData.isSelected : false;
                    window.parent.postMessage({
                        type: 'EVENT_SELECT',
                        eventId: marker.eventId,
                        isSelected: currentlySelected
                    }, '*');
                });
            }
            
            // Show popup on hover
            mapMarker.on('mouseover', function() {
                this.openPopup();
            });
            
            mapMarker.on('mouseout', function() {
                this.closePopup();
            });
            
            // Store marker reference for dynamic updates
            if (marker.type === 'event') {
                mapMarker.eventId = marker.eventId;
                mapMarker.originalData = marker;
            }
        });
        
        // Store all event markers for dynamic updates
        window.eventMarkers = markers.filter(m => m.type === 'event').map((marker, index) => {
            return map._layers[Object.keys(map._layers)[index + 1]]; // Get the actual Leaflet marker
        }).filter(Boolean);
        
        // Listen for selection updates from parent
        window.addEventListener('message', function(event) {
            if (event.data?.type === 'UPDATE_SELECTION') {
                var selectedEventId = event.data.selectedEventId;
                
                // Update all event markers
                Object.values(map._layers).forEach(function(layer) {
                    if (layer.eventId && layer.originalData) {
                        var marker = layer.originalData;
                        var isSelected = selectedEventId === marker.eventId;
                        
                        // Update marker styling
                        var markerColor = isSelected ? '#e53e3e' : (marker.isUserEvent ? '#38a169' : '#3182ce');
                        var markerSize = isSelected ? 35 : 30;
                        var borderWidth = isSelected ? 4 : 3;
                        
                        var newIcon = L.divIcon({
                            html: '<div style="background-color: ' + markerColor + '; color: white; border-radius: 50%; width: ' + markerSize + 'px; height: ' + markerSize + 'px; display: flex; align-items: center; justify-content: center; border: ' + borderWidth + 'px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-size: 16px; cursor: pointer;">🎪</div>',
                            className: 'event-marker',
                            iconSize: [markerSize, markerSize],
                            iconAnchor: [markerSize/2, markerSize/2]
                        });
                        
                        layer.setIcon(newIcon);
                        layer.originalData.isSelected = isSelected;
                    }
                });
            }
        });
    </script>
</body>
</html>`;

    // Convert to data URI
    const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(mapHtml);
    return dataUri;
  };

  // Update map URL when events or user location changes (but not when selection changes)
  useEffect(() => {
    const newMapUrl = generateMapUrl();
    setMapUrl(newMapUrl);
    
    // After map regenerates, reapply current selection if any
    if (selectedEventId) {
      setTimeout(() => {
        const iframe = document.querySelector('iframe[title="Events Map"]') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'UPDATE_SELECTION',
            selectedEventId: selectedEventId
          }, '*');
        }
      }, 200); // Longer delay for map regeneration
    }
  }, [events, userEventVendors, userLocation]);

  // Add message listener for event selection from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EVENT_SELECT' && onEventSelect) {
        const { eventId, isSelected } = event.data;
        // Toggle selection: if already selected, deselect; otherwise select
        onEventSelect(isSelected ? null : eventId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEventSelect]);

  // Send selection updates to iframe without regenerating the entire map
  useEffect(() => {
    const sendSelectionUpdate = () => {
      const iframe = document.querySelector('iframe[title="Events Map"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'UPDATE_SELECTION',
          selectedEventId: selectedEventId
        }, '*');
      }
    };

    // Add a small delay to ensure iframe is loaded
    const timer = setTimeout(sendSelectionUpdate, 100);
    return () => clearTimeout(timer);
  }, [selectedEventId]);

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
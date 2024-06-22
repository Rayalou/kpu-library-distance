import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './App.css';

import personIconUrl from './person.jpg'; // Replace with your custom icon URL
import kpuLibraryIconUrl from './person.jpg'; // Replace with KPU Library icon URL

const kpuLibraryLocation = [49.1320999124371, -122.87115046224693];
const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving/';

const App = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Define custom icons
  const personIcon = L.icon({
    iconUrl: personIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const kpuLibraryIcon = L.icon({
    iconUrl: kpuLibraryIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Function to calculate the route between two points using OSRM API
  const calculateRoute = useCallback((startCoords, endCoords) => {
    axios
      .get(`${OSRM_API_URL}${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`)
      .then((response) => {
        const routeGeometry = response.data.routes[0].geometry.coordinates;
        const decodedPolyline = routeGeometry.map((coord) => [coord[1], coord[0]]);
        setRouteCoordinates(decodedPolyline);
      })
      .catch((error) => {
        console.error('Error calculating route:', error);
      });
  }, []);

  // Effect to watch the user's location in real-time
  useEffect(() => {
    const watchUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            setUserLocation([userLat, userLon]);

            const distanceToKPU = calculateDistance(userLat, userLon, kpuLibraryLocation[0], kpuLibraryLocation[1]);
            setDistance(distanceToKPU);

            if (distanceToKPU !== null && distanceToKPU > 0) {
              calculateRoute([userLat, userLon], kpuLibraryLocation);
            }
          },
          (error) => {
            console.error('Error fetching user location:', error);
          },
          {
            enableHighAccuracy: true, // High accuracy mode
            timeout: 60000, // Maximum time to wait for location
            maximumAge: 0, // Do not use a cached position
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    };

    watchUserLocation();
  }, [calculateRoute]);

  // Function to calculate the distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  return (
    <div className="App">
      <h1>My Location and Distance to KPU Surrey Library</h1>
      {userLocation && distance !== null && <p>{`Distance to KPU Surrey Library: ${distance.toFixed(2)} km`}</p>}
      <MapContainer center={userLocation || kpuLibraryLocation} zoom={13} style={{ height: '500px' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {userLocation && (
          <Marker position={userLocation} icon={personIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        <Marker position={kpuLibraryLocation} icon={kpuLibraryIcon}>
          <Popup>KPU Surrey Library</Popup>
        </Marker>
        {routeCoordinates.length > 0 && <Polyline positions={routeCoordinates} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default App;

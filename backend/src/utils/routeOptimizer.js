// Simple distance calculation using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// Nearest Neighbor Algorithm for route optimization
const optimizeRoute = (startLocation, deliveryLocations) => {
  if (!deliveryLocations || deliveryLocations.length === 0) {
    return [];
  }

  const optimizedRoute = [];
  let currentLocation = startLocation;
  let remainingLocations = [...deliveryLocations];

  // Find nearest location from current position
  while (remainingLocations.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    remainingLocations.forEach((location, index) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        location.lat,
        location.lng
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = index;
      }
    });

    // Add nearest location to optimized route
    const nearestLocation = remainingLocations[nearestIndex];
    optimizedRoute.push({
      ...nearestLocation,
      distanceFromPrevious: shortestDistance,
    });

    // Update current location and remove from remaining
    currentLocation = nearestLocation;
    remainingLocations.splice(nearestIndex, 1);
  }

  return optimizedRoute;
};

// Calculate total route distance
const calculateTotalDistance = (route) => {
  if (!route || route.length === 0) return 0;
  
  return route.reduce((total, location) => {
    return total + (location.distanceFromPrevious || 0);
  }, 0);
};

// Calculate estimated time based on distance (assuming 30 km/h average speed)
const calculateEstimatedTime = (distanceKm) => {
  const averageSpeed = 30; // km/h
  const timeHours = distanceKm / averageSpeed;
  const timeMinutes = Math.ceil(timeHours * 60);
  return timeMinutes;
};

module.exports = {
  calculateDistance,
  optimizeRoute,
  calculateTotalDistance,
  calculateEstimatedTime,
};
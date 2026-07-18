// FearLess Travel 360 - Interactive Map Module (Google Maps Styled Fallback Engine)
let safetyMap;
let userMarker;
let nearbyMarkersGroup = null;
let routingControl = null;
let travelFlightPath = null;

// Pre-seeded coordinates for Tamil Nadu locations
const TN_PLACES = {
  "Chennai, Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
  "Ooty, Tamil Nadu": { lat: 11.4102, lng: 76.6950 },
  "Madurai, Tamil Nadu": { lat: 9.9252, lng: 78.1198 },
  "Coimbatore, Tamil Nadu": { lat: 11.0168, lng: 76.9558 },
  "Kanyakumari, Tamil Nadu": { lat: 8.0883, lng: 77.5385 },
  "Rameswaram, Tamil Nadu": { lat: 9.2876, lng: 79.3129 },
  "Trichy, Tamil Nadu": { lat: 10.7905, lng: 78.7047 },
  "Salem, Tamil Nadu": { lat: 11.6643, lng: 78.1460 }
};

let MOCK_AMENITIES = [];

document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('google-map');
  
  if (mapElement) {
    // 1. Read active coordinates or default to Chennai, Tamil Nadu
    let activeLat = parseFloat(localStorage.getItem('sih_active_lat'));
    let activeLng = parseFloat(localStorage.getItem('sih_active_lng'));
    let activeAddress = localStorage.getItem('sih_active_address');

    if (isNaN(activeLat) || isNaN(activeLng)) {
      activeLat = 13.0827;
      activeLng = 80.2707;
      activeAddress = "Chennai, Tamil Nadu, India";
      
      localStorage.setItem('sih_active_lat', activeLat);
      localStorage.setItem('sih_active_lng', activeLng);
      localStorage.setItem('sih_active_address', activeAddress);
    }

    updateGPSFields(activeLat, activeLng, activeAddress);
    MOCK_AMENITIES = generateDynamicMockAmenities(activeLat, activeLng, activeAddress);

    // 2. Initialize Leaflet map styled with Google Maps road tiles
    safetyMap = L.map('google-map').setView([activeLat, activeLng], 13);

    // Fetch official keyless Google Maps layer
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps'
    }).addTo(safetyMap);

    // Custom Icon for Tourist User (Green circle dot symbol)
    const greenDotIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    userMarker = L.marker([activeLat, activeLng], { icon: greenDotIcon }).addTo(safetyMap);
    userMarker.bindPopup(`<b>Your Active Tracker Position</b><br>${activeAddress}`).openPopup();

    nearbyMarkersGroup = L.layerGroup().addTo(safetyMap);
    renderAmenities('all');

    // 3. Bind UI buttons overlay controls (hospitals & police lookups)
    const btnFindHospitals = document.getElementById('btn-find-hospitals');
    const btnFindPolice = document.getElementById('btn-find-police');

    if (btnFindHospitals) {
      btnFindHospitals.addEventListener('click', () => {
        renderAmenities('hospital');
        Swal.fire({
          icon: 'success',
          title: 'Hospitals Located',
          text: 'Red markers indicate safe-certified hospitals. Click any to draw driving path!',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }

    if (btnFindPolice) {
      btnFindPolice.addEventListener('click', () => {
        renderAmenities('police');
        Swal.fire({
          icon: 'success',
          title: 'Police Stations Located',
          text: 'Blue markers indicate active police booths. Click any to draw driving path!',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }

    // 4. Bind standard header filters
    const filterButtons = document.querySelectorAll('.map-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderAmenities(btn.dataset.type);
      });
    });

    // 5. Bind travel geocoding controls
    bindTravelControls();

    // 6. Bind Route Finder selector controls
    bindRouteFinderControls();

    // 7. Geolocation Sync Button
    const btnLocate = document.getElementById('btn-get-location');
    if (btnLocate) {
      btnLocate.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const newLat = pos.coords.latitude;
              const newLng = pos.coords.longitude;
              const addr = "Real-time Synced Coordinates";

              localStorage.setItem('sih_active_lat', newLat);
              localStorage.setItem('sih_active_lng', newLng);
              localStorage.setItem('sih_active_address', addr);

              clearOldRoutes();
              userMarker.setLatLng([newLat, newLng]).bindPopup(`<b>Synced Tracker Position</b>`).openPopup();
              safetyMap.setView([newLat, newLng], 14);

              MOCK_AMENITIES = generateDynamicMockAmenities(newLat, newLng, addr);
              renderAmenities('all');
              updateGPSFields(newLat, newLng, addr);

              Swal.fire('GPS Synced', 'Map focused around your actual location coordinates.', 'success');
            },
            () => {
              Swal.fire('GPS Fallback Active', 'Location permissions blocked. Defaulting to Chennai.', 'info');
            }
          );
        }
      });
    }
  }
});

// --- Dynamic Mock Amenities Generator ---
function generateDynamicMockAmenities(lat, lng, addressName) {
  const city = addressName ? addressName.split(',')[0] : "Local";
  return [
    { name: `${city} Emergency Hospital`, type: "hospital", lat: lat + 0.0042, lng: lng - 0.0035, phone: "+91 108" },
    { name: `${city} Government Clinic`, type: "hospital", lat: lat - 0.0038, lng: lng + 0.0048, phone: "+91 102" },
    { name: `${city} City Police Station`, type: "police", lat: lat + 0.0032, lng: lng + 0.0029, phone: "+91 100" },
    { name: `${city} Highway Patrol Post`, type: "police", lat: lat - 0.0028, lng: lng - 0.0042, phone: "+91 112" },
    { name: `${city} Safety Certified Hotel`, type: "hotel", lat: lat + 0.0012, lng: lng - 0.0018, rating: "5 ★ Safe" },
    { name: `${city} Tourist Landmark`, type: "attraction", lat: lat + 0.0021, lng: lng + 0.0015, safetyIndex: "98%" }
  ];
}

// --- Travel Nominatim Search ---
function bindTravelControls() {
  const btnTravel = document.getElementById('btn-search-location');
  const inputTravel = document.getElementById('input-search-location');

  if (btnTravel && inputTravel) {
    const handleTravel = () => {
      const query = inputTravel.value.trim();
      if (!query) return;

      Swal.fire({
        title: `Locating ${query}...`,
        text: 'Resolving coordinates...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          Swal.close();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            const address = data[0].display_name;

            localStorage.setItem('sih_active_lat', lat);
            localStorage.setItem('sih_active_lng', lng);
            localStorage.setItem('sih_active_address', address);

            clearOldRoutes();
            
            // Move marker & map
            userMarker.setLatLng([lat, lng]);
            userMarker.bindPopup(`<b>You traveled here!</b><br>${address}`).openPopup();
            safetyMap.setView([lat, lng], 13);

            MOCK_AMENITIES = generateDynamicMockAmenities(lat, lng, address);
            renderAmenities('all');
            updateGPSFields(lat, lng, address);

            Swal.fire('Destination Reached', `Centered map in: ${address.split(',')[0]}`, 'success');
            inputTravel.value = "";
          } else {
            Swal.fire('Search Error', `Unable to find coordinates for: ${query}`, 'error');
          }
        })
        .catch(() => {
          Swal.close();
          Swal.fire('Network Error', 'Connection failed. Please try again.', 'error');
        });
    };

    btnTravel.addEventListener('click', handleTravel);
    inputTravel.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleTravel();
    });
  }
}

// --- Dynamic Travel Route Finder (Where to Where) ---
function bindRouteFinderControls() {
  const btnDrawRoute = document.getElementById('btn-draw-custom-route');
  const startSelect = document.getElementById('route-start-select');
  const endSelect = document.getElementById('route-end-select');

  if (btnDrawRoute && startSelect && endSelect) {
    btnDrawRoute.addEventListener('click', () => {
      const fromVal = startSelect.value;
      const toVal = endSelect.value;

      let startCoords = null;
      let startLabel = "";

      if (fromVal === 'current') {
        const markerLatLng = userMarker.getLatLng();
        startCoords = { lat: markerLatLng.lat, lng: markerLatLng.lng };
        startLabel = "Your Location";
      } else {
        startCoords = TN_PLACES[fromVal];
        startLabel = fromVal.split(',')[0];
      }

      const endCoords = TN_PLACES[toVal];
      const endLabel = toVal.split(',')[0];

      if (!startCoords || !endCoords) {
        Swal.fire('Routing Error', 'Invalid start or end selection coordinates.', 'error');
        return;
      }

      // Plot route path
      drawPathBetween(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng, startLabel, endLabel);
    });
  }
}

function drawPathBetween(startLat, startLng, endLat, endLng, startLabel, endLabel) {
  clearOldRoutes();

  Swal.fire({
    title: 'Plotting Driving Route...',
    text: `Routing path from ${startLabel} to ${endLabel}...`,
    timer: 1500,
    showConfirmButton: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startLat, startLng),
        L.latLng(endLat, endLng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: function(i, wp) {
        // Create custom markers with popups at route ends
        const markerIcon = L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${i === 0 ? 'green' : 'red'}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const label = i === 0 ? `Start: ${startLabel}` : `Destination: ${endLabel}`;
        return L.marker(wp.latLng, { icon: markerIcon }).bindPopup(label);
      },
      lineOptions: {
        styles: [{ color: '#00b4d8', weight: 6, opacity: 0.85 }] // Google Maps Style Blue route
      }
    }).addTo(safetyMap);
  } catch (err) {
    console.error("OSRM Routing failed:", err);
    Swal.fire('Routing Failed', 'Road navigation server is offline. Direct line route drawn.', 'warning');
    
    // Draw straight line route fallback
    travelFlightPath = L.polyline([[startLat, startLng], [endLat, endLng]], {
      color: '#00b4d8',
      weight: 6,
      dashArray: '10, 10'
    }).addTo(safetyMap);
    safetyMap.fitBounds(travelFlightPath.getBounds());
  }
}

// --- Markers Renderer ---
function renderAmenities(filterType) {
  if (!nearbyMarkersGroup) return;
  nearbyMarkersGroup.clearLayers();

  MOCK_AMENITIES.forEach(place => {
    if (filterType !== 'all' && place.type !== filterType) return;

    let color = 'blue';
    if (place.type === 'police') color = 'orange';
    if (place.type === 'hospital') color = 'red';
    if (place.type === 'hotel') color = 'gold';

    const customIcon = L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const marker = L.marker([place.lat, place.lng], { icon: customIcon });

    let popupHTML = `<b>${place.name}</b><br>`;
    if (place.type === 'police') popupHTML += `🚨 Police Station<br>Phone: ${place.phone}`;
    if (place.type === 'hospital') popupHTML += `🏥 Hospital Helpline: ${place.phone}`;
    if (place.type === 'hotel') popupHTML += `🏨 Security Level: ${place.rating}`;
    if (place.type === 'attraction') popupHTML += `📍 Safety Index: ${place.safetyIndex}`;

    // Plot route on popup click
    popupHTML += `<br><button class="btn btn-primary btn-sm" style="margin-top:8px; padding:5px 10px; border-radius:4px; font-weight:600; font-size:0.75rem; border:none; outline:none; background:#00b4d8; color:#fff; cursor:pointer;" onclick="drawRouteTo(${place.lat}, ${place.lng})"><i class="fa-solid fa-route"></i> Navigate Route</button>`;

    marker.bindPopup(popupHTML);
    nearbyMarkersGroup.addLayer(marker);
  });
}

window.drawRouteTo = function(destLat, destLng) {
  if (!safetyMap || !userMarker) return;
  const startLatLng = userMarker.getLatLng();
  drawPathBetween(startLatLng.lat, startLatLng.lng, destLat, destLng, "Your Location", "Emergency Center");
};

function clearOldRoutes() {
  if (routingControl) {
    safetyMap.removeControl(routingControl);
    routingControl = null;
  }
  if (travelFlightPath) {
    safetyMap.removeLayer(travelFlightPath);
    travelFlightPath = null;
  }
}

// --- GPS Display Fields updater ---
function updateGPSFields(lat, lng, address) {
  const latEl = document.getElementById('gps-lat');
  const lngEl = document.getElementById('gps-lng');
  const addrEl = document.getElementById('gps-address');
  const dashRegion = document.getElementById('dash-region');

  if (latEl) latEl.textContent = lat.toFixed(5);
  if (lngEl) lngEl.textContent = lng.toFixed(5);
  if (addrEl) addrEl.textContent = address || "Location Coordinates";

  if (dashRegion) {
    const parts = address ? address.split(',') : ["Synced Coordinates"];
    dashRegion.textContent = parts[0] + (parts[1] ? `, ${parts[1].trim()}` : '');
  }
}

window.quickTravel = function(destinationName) {
  const inputTravel = document.getElementById('input-search-location');
  const btnTravel = document.getElementById('btn-search-location');
  if (inputTravel && btnTravel) {
    inputTravel.value = destinationName;
    btnTravel.click();
  }
};

// FearLess Travel 360 - GeoFence Boundary Simulator
let geofenceMap;
let activeFence;
let touristMarker;
let centerLatLng = [13.0827, 80.2707]; // default fallback (Chennai)
let fenceRadius = 500; // default radius in meters

document.addEventListener('DOMContentLoaded', () => {
  const geofenceMapEl = document.getElementById('geofence-map');

  if (geofenceMapEl) {
    // Load from localStorage if present
    const savedLat = parseFloat(localStorage.getItem('sih_active_lat'));
    const savedLng = parseFloat(localStorage.getItem('sih_active_lng'));
    if (!isNaN(savedLat) && !isNaN(savedLng)) {
      centerLatLng = [savedLat, savedLng];
    }

    // Instantiate Leaflet Geofence Map
    geofenceMap = L.map('geofence-map').setView(centerLatLng, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(geofenceMap);

    // Green circle (Safe Zone Perimeter)
    drawGeofenceCircle(centerLatLng, fenceRadius);

    // Red User marker icon
    const touristIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    touristMarker = L.marker(centerLatLng, { icon: touristIcon }).addTo(geofenceMap);
    touristMarker.bindPopup("<b>Tourist Tracker</b><br>Inside Safe Perimeter.").openPopup();

    // Radius Input range slider bindings
    const slider = document.getElementById('radius-slider');
    const radiusValLabel = document.getElementById('radius-val');

    if (slider && radiusValLabel) {
      slider.addEventListener('input', (e) => {
        fenceRadius = parseInt(e.target.value);
        radiusValLabel.textContent = `${fenceRadius}m`;
        
        // Redraw
        drawGeofenceCircle(centerLatLng, fenceRadius);
        checkGeofenceBreach(touristMarker.getLatLng());
      });
    }

    // Trigger Mock Breach Button
    const btnBreachSimulate = document.getElementById('btn-simulate-breach');
    if (btnBreachSimulate) {
      btnBreachSimulate.addEventListener('click', () => {
        // Offset relative to the traveled center coordinates (approx 2km outside)
        const offsetLat = centerLatLng[0] + 0.02; 
        const offsetLng = centerLatLng[1] + 0.02;
        const newDest = new L.LatLng(offsetLat, offsetLng);

        // Move marker
        touristMarker.setLatLng(newDest);
        geofenceMap.panTo(newDest);
        touristMarker.bindPopup("<b>Tourist Tracker</b><br>🚨 Outside Designated Safe Zone!").openPopup();

        checkGeofenceBreach(newDest);
      });
    }

    // Trigger Return to Safety Button
    const btnResetSimulate = document.getElementById('btn-simulate-reset');
    if (btnResetSimulate) {
      btnResetSimulate.addEventListener('click', () => {
        touristMarker.setLatLng(centerLatLng);
        geofenceMap.panTo(centerLatLng);
        touristMarker.bindPopup("<b>Tourist Tracker</b><br>Returned to Safe Perimeter.").openPopup();

        checkGeofenceBreach(new L.LatLng(centerLatLng[0], centerLatLng[1]));
      });
    }
  }
});

function drawGeofenceCircle(latlng, radius) {
  if (activeFence) {
    geofenceMap.removeLayer(activeFence);
  }

  activeFence = L.circle(latlng, {
    color: '#28a745',
    fillColor: '#28a745',
    fillOpacity: 0.15,
    radius: radius
  }).addTo(geofenceMap);
}

function checkGeofenceBreach(markerLatLng) {
  if (!activeFence) return;

  const center = activeFence.getLatLng();
  const distance = center.distanceTo(markerLatLng); // leaflet distance in meters

  const alertBanner = document.getElementById('geofence-alert-banner');
  const alertText = document.getElementById('geofence-status-text');

  if (distance > fenceRadius) {
    // BREACH STATE
    if (alertBanner) {
      alertBanner.className = 'alert-banner breach';
      alertBanner.style.display = 'block';
    }
    if (alertText) {
      alertText.innerHTML = `⚠️ <b>Geofence Boundary Exited!</b> Current distance to safety: <b>${Math.round(distance)}m</b> (Allowed: ${fenceRadius}m)`;
    }

    // Trigger sweetalert once
    Swal.fire({
      icon: 'warning',
      title: 'Geofence Breach Alert',
      text: 'Security system has detected that you have left the designated safe zone. A safety alert has been logged for monitoring.',
      confirmButtonColor: '#FF6B35'
    });
  } else {
    // SAFE STATE
    if (alertBanner) {
      alertBanner.className = 'alert-banner safe';
      alertBanner.style.display = 'block';
    }
    if (alertText) {
      alertText.innerHTML = `✅ <b>Status: Secure</b>. You are inside the designated safe boundary radius.`;
    }
  }
}

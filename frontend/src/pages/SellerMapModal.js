import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { FaSpinner } from 'react-icons/fa';
import L from 'leaflet';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import './SellerMapModal.css';

// Fix for default marker icon in React Leaflet v4
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map re-centering
function MapController({ position, zoom = 15 }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], zoom);
    }
  }, [position, zoom, map]);

  return null;
}

// Component to handle map clicks
function LocationMarker({ position, setPosition, initialLocationSet }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={[position.lat, position.lng]}
      icon={sellerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          setPosition(newPosition);
        },
        add: () => {
          // Zoom in closer when marker is added (for more precise location)
          if (initialLocationSet) {
            map.setView([position.lat, position.lng], 17);
          }
        }
      }}
    >
      <Popup>
        <strong>Store Location</strong><br />
        Click and drag to adjust<br />
        <small style={{ color: '#666' }}>
          Lat: {position.lat.toFixed(6)}<br />
          Lng: {position.lng.toFixed(6)}
        </small>
      </Popup>
    </Marker>
  ) : null;
}

const SellerMapModal = ({ isOpen, onClose, sellerId, currentLocation, onSave }) => {
  const [position, setPosition] = useState(currentLocation);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationObtained, setLocationObtained] = useState(true); // Always true to show map
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const hasRequestedLocation = useRef(false);
  const searchTimeoutRef = useRef(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    if (currentLocation) {
      setPosition(currentLocation);
      setMapZoom(17); // Zoom in if there's already a saved location
    }
  }, [currentLocation]);

  // Only automatically request location if there's NO saved location
  useEffect(() => {
    if (isOpen && !hasRequestedLocation.current && !currentLocation) {
      hasRequestedLocation.current = true;
      // Reduce delay - map should be ready after 300-500ms
      setTimeout(() => {
        requestLocationPermission();
      }, 500);
    }

    if (!isOpen) {
      hasRequestedLocation.current = false;
      setInitialLocationSet(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, currentLocation]);

  // Reverse geocode when position changes
  useEffect(() => {
    if (position && position.lat && position.lng) {
      reverseGeocode(position.lat, position.lng);
    }
  }, [position]);

  const requestLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        console.log('📍 Geolocation permission:', result.state);

        if (result.state === 'denied') {
          Swal.fire({
            icon: 'warning',
            title: 'Location Access Denied',
            html: 'Please enable location access in your browser settings.',
            confirmButtonColor: '#1e40af',
          });
          setIsLoadingLocation(false);
          return;
        }
      } catch (e) {
        console.log('Permission API not supported');
      }
    }

    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      await Swal.fire({
        icon: 'info',
        title: 'Location Not Supported',
        text: 'Your browser does not support geolocation. Please click on the map or use the search to set your location.',
        confirmButtonColor: '#1e40af',
        allowOutsideClick: false
      });
      return;
    }

    // Try high accuracy first, then fall back to low accuracy
    const tryGetLocation = (attempt = 1) => {
      const options = attempt === 1 ? {
        enableHighAccuracy: true,
        timeout: 8000,  // Reduced from 15000
        maximumAge: 0
      } : {
        enableHighAccuracy: false,
        timeout: 5000,   // Reduced from 10000
        maximumAge: 30000  // Accept cached location up to 30 seconds
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };

          console.log(`📍 Location detected (attempt ${attempt}):`, userLocation);
          console.log('Accuracy:', pos.coords.accuracy, 'meters');

          setPosition(userLocation);
          setIsLoadingLocation(false);
          setInitialLocationSet(true);

          // Zoom in more if we have good accuracy
          if (pos.coords.accuracy < 50) {
            setMapZoom(18); // Very close zoom for high accuracy
          } else if (pos.coords.accuracy < 100) {
            setMapZoom(17); // Close zoom for medium accuracy
          }

          Swal.fire({
            icon: 'success',
            title: 'Location Detected!',
            html: `
              <p>Your current location has been set.</p>
              <p style="font-size: 13px; color: #666; margin-top: 8px;">
                Accuracy: ±${Math.round(pos.coords.accuracy)}m<br/>
                Drag the marker or click the map to adjust.
              </p>
            `,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        },
        (error) => {
          console.warn(`Geolocation error (attempt ${attempt}):`, error);

          // If first attempt failed, try with low accuracy
          if (attempt === 1) {
            console.log('Retrying with low accuracy settings...');
            setTimeout(() => tryGetLocation(2), 500);
            return;
          }

          // Both attempts failed - show the map without setting location
          setIsLoadingLocation(false);

          let errorMessage = '';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. You can click on the map or use search to set your location.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. You can click on the map or use search to set your location.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. You can click on the map or use search to set your location.';
              break;
            default:
              errorMessage = 'Unable to retrieve your location. You can click on the map or use search to set your location.';
          }

          Swal.fire({
            icon: 'info',
            title: 'Manual Location Setup',
            html: errorMessage,
            confirmButtonColor: '#1e40af',
            confirmButtonText: 'OK',
            allowOutsideClick: true,
            timer: 5000
          });
        },
        options
      );
    };

    // Add delay to ensure map is ready, then start location detection
    setTimeout(() => tryGetLocation(1), 300);
  };

  const handleSearchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Using Nominatim API for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ph`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Search Failed',
        text: 'Unable to search locations. Please try again.',
        confirmButtonColor: '#1e40af',
        timer: 3000
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearchLocation(query);
    }, 500);
  };

  const handleSelectSearchResult = (result) => {
    const newPosition = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };

    setPosition(newPosition);
    setMapZoom(17);
    setSearchQuery(result.display_name);
    setSearchResults([]);

    Swal.fire({
      icon: 'success',
      title: 'Location Selected',
      text: 'You can drag the marker to fine-tune the position.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleSave = async () => {
    if (!position) {
      Swal.fire({
        icon: 'warning',
        title: 'No Location Selected',
        text: 'Please select a location on the map',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/location/${sellerId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: position.lat,
            longitude: position.lng
          })
        }
      );

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Location Saved',
          text: 'Store location has been updated successfully!',
          confirmButtonColor: '#3085d6'
        });
        onSave(position);
        onClose();
      } else {
        throw new Error('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save location. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleDelete = async () => {
    onClose();

    const result = await Swal.fire({
      title: 'Delete Location?',
      text: 'Are you sure you want to remove your store location?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_SELLER_API_URL}/api/seller/location/${sellerId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Store location has been removed',
            confirmButtonColor: '#3085d6'
          });
          setPosition(null);
          onSave(null);
          onClose();
        } else {
          throw new Error('Failed to delete location');
        }
      } catch (error) {
        console.error('Error deleting location:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete location. Please try again.',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  const handleRefreshLocation = () => {
    hasRequestedLocation.current = false;
    setInitialLocationSet(false);
    requestLocationPermission();
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          setSelectedAddress(data.display_name);
          return data.display_name;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return '';
  };

  const center = useMemo(() => {
    if (position) return [position.lat, position.lng];
    return [14.5995, 120.9842]; // Default to Manila, Philippines
  }, [position]);

  if (!isOpen) return null;

  return (
    <div className="seller-map-modal" onClick={onClose}>
      <div className="seller-map-content" onClick={(e) => e.stopPropagation()}>
        <div className="seller-map-header">
          <h2>Store Location</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="seller-map-body">
          {isLoadingLocation ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px'
              }}></div>
              <h3 style={{ marginBottom: '10px', color: '#1f2937' }}>
                Getting Your Location...
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Please allow location access when prompted
              </p>
            </div>
          ) : (
            <>
              <div className="map-instructions">
                <p>Click on the map, drag the marker, or search for your location</p>
                <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                  Tip: Zoom in for more precise positioning
                </p>
                <button
                  onClick={handleRefreshLocation}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>↻</span> Detect My Current Location
                </button>
              </div>

              {/* Search Box */}
              <div className="location-search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    className="location-search-input"
                    placeholder="Search for a place, address, or landmark..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                  />
                  {isSearching && (
                    <span className="search-loading"><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /></span>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => handleSelectSearchResult(result)}
                      >
                        <div className="result-icon">📍</div>
                        <div className="result-info">
                          <div className="result-name">{result.display_name}</div>
                          <div className="result-type">{result.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {currentLocation && (
                <div className="current-location-display">
                  <h4>Current Saved Location</h4>
                  {selectedAddress && (
                    <div style={{
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: '#495057'
                    }}>
                      {selectedAddress}
                    </div>
                  )}
                  <p><strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}</p>
                </div>
              )}

              <div className="map-picker-container">
                <MapContainer
                  center={center}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <MapController position={position} zoom={mapZoom} />
                  <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    initialLocationSet={initialLocationSet}
                  />
                </MapContainer>
              </div>

              {position && (
                <div className="location-info">
                  <h4>Selected Location</h4>
                  {selectedAddress ? (
                    <div style={{
                      padding: '12px',
                      background: '#f0f9ff',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#0c4a6e',
                      border: '1px solid #bae6fd'
                    }}>
                      📍 <strong>Address:</strong><br />
                      {selectedAddress}
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      color: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                      Getting address...
                    </div>
                  )}
                  <div className="location-detail">
                    <span className="label">Latitude:</span>
                    <span className="value">{position.lat.toFixed(6)}</span>
                  </div>
                  <div className="location-detail">
                    <span className="label">Longitude:</span>
                    <span className="value">{position.lng.toFixed(6)}</span>
                  </div>
                  <div className="location-detail">
                    <span className="label">Map Zoom:</span>
                    <span className="value">{mapZoom}x</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="seller-map-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          {currentLocation && (
            <button className="btn-delete-location" onClick={handleDelete}>
              Delete Location
            </button>
          )}
          <button
            className="btn-confirm"
            onClick={handleSave}
            disabled={!position}
          >
            Save Location
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SellerMapModal;
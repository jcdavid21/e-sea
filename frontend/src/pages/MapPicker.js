import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';
import { 
    FaMapMarkerAlt, 
    FaStore, 
    FaSearch, 
    FaTimes, 
    FaGlobe, 
    FaWifi, 
    FaLock, 
    FaCheckCircle, 
    FaTimesCircle,
    FaSpinner,
    FaExclamationTriangle,
    FaRedo,
    FaCrosshairs,
    FaRoute,
    FaClock
} from 'react-icons/fa';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const buyerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const sellerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Calculate straight-line distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Map center adjuster component
function MapCenterAdjuster({ center, zoom = 15 }) {
    const map = useMap();

    useEffect(() => {
        if (center && map) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);

    return null;
}

// Animated polyline component for route
function AnimatedRoute({ positions }) {
    const pathOptions = {
        color: '#667eea',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10',
        dashOffset: '0'
    };

    return <Polyline positions={positions} pathOptions={pathOptions} />;
}

const MapPicker = ({ sellerLocation, onLocationSelect, initialPosition = null }) => {
    const defaultCenter = [14.5995, 120.9842]; // Manila default
    const [position, setPosition] = useState(initialPosition);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [mapReady, setMapReady] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);
    const hasAutoDetected = useRef(false);

    // ✅ FIXED: Better auto-detection logic
    useEffect(() => {
        // Only auto-detect if:
        // 1. We haven't tried yet
        // 2. There's no initial position
        // 3. Map is ready (wait for it)
        if (!hasAutoDetected.current && !initialPosition) {
            hasAutoDetected.current = true;
            
            // Small delay to ensure map container is fully mounted
            const timer = setTimeout(() => {
                console.log('🎯 Starting automatic location detection...');
                requestLocation();
            }, 300);
            
            return () => clearTimeout(timer);
        } else if (initialPosition) {
            // If we have initial position, just use it
            setPosition(initialPosition);
            setMapReady(true);
            console.log('📍 Using initial position:', initialPosition);
        }
    }, [initialPosition]);

    // Fetch route when both positions are available
    useEffect(() => {
        if (position && sellerLocation && mapReady) {
            fetchRoute(position, sellerLocation);
        }
    }, [position, sellerLocation, mapReady]);

    // ✅ FIXED: Improved location request with IP fallback
    const requestLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setIsLoadingLocation(false);
            await tryIPGeolocation(); // Fallback to IP-based location
            return;
        }

        setIsLoadingLocation(true);
        setLocationError(null);
        console.log('📡 Requesting geolocation...');
        console.log('🔍 Browser:', navigator.userAgent);
        console.log('🌐 Connection:', navigator.onLine ? 'Online' : 'Offline');

        // Check if we're on HTTPS (required for geolocation)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setLocationError('⚠️ Location services require HTTPS. Using IP-based location instead.');
            setIsLoadingLocation(false);
            await tryIPGeolocation();
            return;
        }

        // ✅ Try low accuracy FIRST (works better in many cases)
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000 // Accept cached location
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                setPosition(userLocation);
                setIsLoadingLocation(false);
                setLocationError(null);
                console.log('✅ Location detected (network-based):', userLocation);
                console.log('📏 Accuracy: ±' + Math.round(pos.coords.accuracy) + 'm');
            },
            (error) => {
                console.warn('⚠️ Network-based location failed:', error.message, 'Code:', error.code);

                // Try high accuracy as fallback
                const highAccuracyOptions = {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                };

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userLocation = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        };
                        setPosition(userLocation);
                        setIsLoadingLocation(false);
                        setLocationError(null);
                        console.log('✅ GPS location detected (high accuracy):', userLocation);
                        console.log('📏 Accuracy: ±' + Math.round(pos.coords.accuracy) + 'm');
                    },
                    async (finalError) => {
                        console.error('❌ Both location attempts failed:', finalError);
                        console.error('Error details:', {
                            code: finalError.code,
                            message: finalError.message,
                            PERMISSION_DENIED: finalError.PERMISSION_DENIED,
                            POSITION_UNAVAILABLE: finalError.POSITION_UNAVAILABLE,
                            TIMEOUT: finalError.TIMEOUT
                        });

                        setIsLoadingLocation(false);

                        let errorMessage = '';
                        switch (finalError.code) {
                            case finalError.PERMISSION_DENIED:
                                errorMessage = 'Location permission denied. Trying IP-based location...';
                                break;
                            case finalError.POSITION_UNAVAILABLE:
                                errorMessage = 'GPS unavailable. Trying IP-based location...';
                                break;
                            case finalError.TIMEOUT:
                                errorMessage = 'Location timeout. Trying IP-based location...';
                                break;
                            default:
                                errorMessage = 'Location failed. Trying IP-based location...';
                        }
                        setLocationError(errorMessage);

                        // Try IP-based geolocation as last resort
                        await tryIPGeolocation();
                    },
                    highAccuracyOptions
                );
            },
            lowAccuracyOptions
        );
    };

    // ✅ NEW: IP-based geolocation fallback
    const tryIPGeolocation = async () => {
        console.log('🌐 Attempting IP-based geolocation...');
        try {
            // Try ipapi.co (free, no API key needed)
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    const ipLocation = {
                        lat: parseFloat(data.latitude),
                        lng: parseFloat(data.longitude)
                    };
                    setPosition(ipLocation);
                    setLocationError(null);
                    console.log('✅ IP-based location detected:', ipLocation);
                    console.log('📍 City:', data.city, '|', data.region, '|', data.country_name);
                    
                    // Show info toast
                    alert(`📍 Using approximate location based on your IP address\nCity: ${data.city}, ${data.country_name}\n\n💡 For precise location, please enable GPS or click on the map.`);
                    return;
                }
            }
        } catch (error) {
            console.error('❌ IP geolocation failed:', error);
        }

        // If IP geolocation also fails, show final error
        setLocationError('Could not detect location automatically. Please click on the map or search for your location.');
    };

    const fetchRoute = async (start, end) => {
        setIsLoadingRoute(true);
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.routes && data.routes[0]) {
                    const route = data.routes[0];
                    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                    setRouteCoordinates(coordinates);
                    setRouteInfo({
                        distance: (route.distance / 1000).toFixed(2),
                        duration: Math.round(route.duration / 60)
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setIsLoadingRoute(false);
        }
    };

    const handleSearchLocation = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ph`
            );

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

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
        setSearchQuery(result.display_name);
        setSearchResults([]);
    };

    const handleMapClick = (e) => {
        setPosition(e.latlng);
        setRouteInfo(null);
        setRouteCoordinates([]);
        setLocationError(null);
        console.log('📍 Location selected manually:', e.latlng);
    };

    const handleUseLocation = () => {
        if (position && onLocationSelect) {
            const locationData = {
                ...position,
                distance: routeInfo?.distance || (sellerLocation ?
                    calculateDistance(position.lat, position.lng, sellerLocation.lat, sellerLocation.lng) :
                    null),
                duration: routeInfo?.duration
            };
            onLocationSelect(locationData);
        }
    };

    const mapCenter = position || sellerLocation || defaultCenter;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {/* Instructions */}
            <div style={{
                background: '#f0f4ff',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '14px',
                border: '2px solid #667eea'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaMapMarkerAlt style={{ fontSize: '18px', color: '#667eea' }} />
                    <strong>Search or click on the map to set delivery location</strong>
                </div>
                {sellerLocation && (
                    <div style={{ fontSize: '13px', color: '#666', marginLeft: '26px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaMapMarkerAlt style={{ color: '#3b82f6' }} /> Blue marker = Your location | 
                        <FaStore style={{ color: '#ef4444' }} /> Red marker = Store location
                    </div>
                )}
                
                {/* ✅ Debug Info Panel */}
                <details style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#667eea', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaExclamationTriangle /> Troubleshooting Info (click to expand)
                    </summary>
                    <div style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FaGlobe /> Protocol: {window.location.protocol}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FaWifi /> Online: {navigator.onLine ? <><FaCheckCircle style={{ color: '#10b981' }} /> Yes</> : <><FaTimesCircle style={{ color: '#ef4444' }} /> No</>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FaCrosshairs /> Geolocation API: {navigator.geolocation ? <><FaCheckCircle style={{ color: '#10b981' }} /> Available</> : <><FaTimesCircle style={{ color: '#ef4444' }} /> Not Available</>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FaLock /> HTTPS: {window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? <><FaCheckCircle style={{ color: '#10b981' }} /> Yes</> : <><FaTimesCircle style={{ color: '#ef4444' }} /> No (Required!)</>}
                        </div>
                        <div style={{ marginTop: '8px', padding: '8px', background: '#fff3cd', borderRadius: '4px' }}>
                            <strong>💡 Tips:</strong>
                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                <li>Make sure location is enabled in browser settings</li>
                                <li>Check if you're connected to the internet</li>
                                <li>Try enabling high-accuracy location in device settings</li>
                                <li>If GPS fails, IP-based location will be used (less accurate)</li>
                            </ul>
                        </div>
                    </div>
                </details>
            </div>

            {/* Search Box */}
            <div className="location-search-container">
                <div className="search-input-wrapper">
                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                    <input
                        type="text"
                        className="location-search-input"
                        placeholder="Search for a place, address, or landmark..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        style={{ paddingLeft: '36px' }}
                    />
                    {isSearching && (
                        <FaSpinner className="fa-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea' }} />
                    )}
                    {!isSearching && searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                padding: '4px',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <FaTimes />
                        </button>
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
                                <div className="result-icon"><FaMapMarkerAlt style={{ color: '#667eea' }} /></div>
                                <div className="result-info">
                                    <div className="result-name">{result.display_name}</div>
                                    <div className="result-type">{result.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading Indicator */}
            {isLoadingLocation && (
                <div style={{
                    background: '#f0f4ff',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    color: '#667eea',
                    fontWeight: '600'
                }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FaSpinner className="fa-spin" /> Getting your location...
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Please allow location access when prompted
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {!isLoadingLocation && locationError && (
                <div style={{
                    background: '#fef2f2',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '2px solid #fca5a5',
                    textAlign: 'center'
                }}>
                    <div style={{
                        color: '#dc2626',
                        fontWeight: '600',
                        marginBottom: '8px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <FaExclamationTriangle /> {locationError}
                    </div>
                    <button
                        onClick={() => {
                            hasAutoDetected.current = false;
                            requestLocation();
                        }}
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #3349a9ff 0%, #4b72a2ff 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            transition: 'transform 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <FaRedo /> Try Again
                    </button>
                </div>
            )}

            {/* Map */}
            <div style={{
                height: '400px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #ddd',
                marginBottom: '16px',
                position: 'relative'
            }}>
                <MapContainer
                    center={mapCenter}
                    zoom={position ? 15 : 13}
                    style={{ height: '100%', width: '100%' }}
                    whenReady={(mapInstance) => {
                        console.log('🗺️ Map ready');
                        setMapReady(true);
                        mapInstance.target.on('click', handleMapClick);
                    }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapCenterAdjuster center={position} zoom={position ? 15 : 13} />

                    {/* Animated Route Line */}
                    {routeCoordinates.length > 0 && (
                        <AnimatedRoute positions={routeCoordinates} />
                    )}

                    {position && (
                        <Marker position={position} icon={buyerIcon} draggable={true}
                            eventHandlers={{
                                dragend: (e) => {
                                    const marker = e.target;
                                    const newPosition = marker.getLatLng();
                                    setPosition(newPosition);
                                }
                            }}
                        >
                            <Popup>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaMapMarkerAlt style={{ color: '#3b82f6' }} />
                                    <strong>Your Delivery Location</strong>
                                </div>
                                Drag to adjust or click map
                            </Popup>
                        </Marker>
                    )}

                    {sellerLocation && (
                        <Marker position={sellerLocation} icon={sellerIcon}>
                            <Popup>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaStore style={{ color: '#ef4444' }} />
                                    <strong>Store Location</strong>
                                </div>
                                Seller's store is here
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>

                {/* Retry Location Button Overlay */}
                {!isLoadingLocation && !position && (
                    <button
                        onClick={() => {
                            hasAutoDetected.current = false;
                            requestLocation();
                        }}
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '20px',
                            zIndex: 1000,
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #3349a9ff 0%, #4b72a2ff 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FaCrosshairs /> Detect My Location
                    </button>
                )}
            </div>

            {/* Route calculation loading */}
            {isLoadingRoute && (
                <div style={{
                    background: '#f0f4ff',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    color: '#667eea',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <FaRoute /> Calculating route...
                </div>
            )}

            {/* Route Information Display */}
            {position && sellerLocation && routeInfo && (
                <div style={{
                    background: 'linear-gradient(135deg, #3349a9ff 0%, #4b72a2ff 100%)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <FaRoute style={{ fontSize: '20px' }} /> {routeInfo.distance} km
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>Distance</div>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', height: '100%' }}></div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <FaClock style={{ fontSize: '20px' }} /> {routeInfo.duration} min
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>Est. Duration</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Details */}
            {position && (
                <div style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaMapMarkerAlt style={{ color: '#667eea' }} /> Selected Location
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <span style={{ color: '#666' }}>Latitude:</span>
                            <div style={{ fontWeight: '600' }}>{position.lat.toFixed(6)}</div>
                        </div>
                        <div>
                            <span style={{ color: '#666' }}>Longitude:</span>
                            <div style={{ fontWeight: '600' }}>{position.lng.toFixed(6)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Use Location Button */}
            {position && onLocationSelect && (
                <button
                    onClick={handleUseLocation}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #3349a9ff 0%, #4b72a2ff 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <FaCheckCircle /> Use This Location
                </button>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .fa-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default MapPicker;
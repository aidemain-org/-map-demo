import React, { useState, useEffect, useRef } from 'react';
import './NavigationApp.css';

const NavigationApp = () => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [transportMode, setTransportMode] = useState('DRIVING');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteSelection, setShowRouteSelection] = useState(false);
  const [directions, setDirections] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  const [tempGoogleMapsKey, setTempGoogleMapsKey] = useState(process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '');
  const [tempGeminiKey, setTempGeminiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Cookie management functions
  const setCookie = (name, value, days = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const clearCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  // Load API keys from cookies on startup
  useEffect(() => {
    const savedMapsKey = getCookie('googleMapsApiKey');
    const savedGeminiKey = getCookie('geminiApiKey');
    
    if (savedMapsKey && savedMapsKey !== 'your_google_maps_api_key_here') {
      setTempGoogleMapsKey(savedMapsKey);
      console.log('Loaded Google Maps API key from cookie');
    }
    
    if (savedGeminiKey && savedGeminiKey !== 'your_gemini_api_key_here') {
      setTempGeminiKey(savedGeminiKey);
      setGeminiApiKey(savedGeminiKey);
      console.log('Loaded Gemini API key from cookie');
    }
  }, []);

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Use temp key if available, otherwise fall back to env key
      const apiKey = tempGoogleMapsKey && tempGoogleMapsKey !== 'your_google_maps_api_key_here' 
        ? tempGoogleMapsKey 
        : process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        console.warn('Google Maps API key not configured. Please set REACT_APP_GOOGLE_MAPS_API_KEY in .env file or enter a key in Settings');
        return;
      }

      console.log('Loading Google Maps with API key:', apiKey);

      // Check if Google Maps is already loaded with the same key
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing map...');
        initializeMap();
        return;
      }

      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeMap();
        }, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        alert('Failed to load Google Maps API. Please check your API key.');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      console.log('initializeMap called');
      console.log('Google Maps available:', !!window.google);
      console.log('Map ref available:', !!mapRef.current);
      console.log('Map instance exists:', !!mapInstanceRef.current);
      
      if (window.google && mapRef.current && !mapInstanceRef.current) {
        console.log('Initializing map...');
        console.log('Map ref element:', mapRef.current);
        console.log('Map ref dimensions:', {
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        });
        
        // Check if map container has proper dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          console.warn('Map container has zero dimensions, waiting for layout...');
          setTimeout(() => {
            console.log('Retrying map initialization after layout...');
            initializeMap();
          }, 500);
          return;
        }
        
        try {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.0060 }, // Default to New York
            zoom: 13,
          });

          directionsServiceRef.current = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
          directionsRendererRef.current.setMap(mapInstanceRef.current);
          
          console.log('Map initialized successfully');
          console.log('Map instance:', mapInstanceRef.current);
        } catch (error) {
          console.error('Error initializing map:', error);
          alert('Error initializing map: ' + error.message);
        }
      } else {
        console.log('Map initialization skipped:');
        console.log('- Google Maps available:', !!window.google);
        console.log('- Map ref available:', !!mapRef.current);
        console.log('- Map instance exists:', !!mapInstanceRef.current);
      }
    };

    loadGoogleMapsAPI();
  }, [tempGoogleMapsKey]); // Re-run when temp key changes

  const addLog = (type, data) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: type,
      data: data
    };
    setApiLogs(prev => [...prev, logEntry]);
  };

  const handleNavigate = async () => {
    if (!startLocation || !destination) {
      alert('Please enter both starting location and destination');
      return;
    }

    if (!window.google || !window.google.maps) {
      alert('❌ Google Maps API is not loaded. Please check your API key configuration and restart the server.');
      return;
    }

    // Create a fresh directions service instance to ensure it works
    const directionsService = new window.google.maps.DirectionsService();
    
    console.log('Starting navigation with:', { startLocation, destination, transportMode });
    console.log('Directions service created:', !!directionsService);

    setIsLoading(true);
    setShowRouteSelection(false);
    setSelectedRoute(null);
    setDirections(null);

    const request = {
      origin: startLocation,
      destination: destination,
      travelMode: window.google.maps.TravelMode[transportMode],
      provideRouteAlternatives: true,
    };

    console.log('Directions request:', request);

    // Log API Request
    addLog('REQUEST', {
      endpoint: 'DirectionsService.route()',
      params: {
        origin: startLocation,
        destination: destination,
        travelMode: transportMode,
        provideRouteAlternatives: true
      }
    });

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      alert('⚠️ Route request timed out. This could indicate:\n1. Network connectivity issues\n2. API quota exceeded\n3. Invalid addresses\n\nPlease try again with different locations.');
    }, 30000); // 30 second timeout

    directionsService.route(request, (result, status) => {
      clearTimeout(timeoutId);
      console.log('Directions response:', { result, status });
      setIsLoading(false);

      // Log API Response
      addLog('RESPONSE', {
        endpoint: 'DirectionsService.route()',
        status: status,
        routesCount: result?.routes?.length || 0,
        data: result ? {
          routes: result.routes.map((route, idx) => ({
            routeIndex: idx,
            summary: route.summary,
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            warnings: route.warnings,
            copyrights: route.copyrights
          }))
        } : null
      });

      if (status === 'OK') {
        try {
          console.log('Processing routes...', result.routes.length, 'routes found');
          
          const availableRoutes = result.routes.map((route, index) => {
            const leg = route.legs[0];

            // Extract major roads/highways from the route
            const majorRoads = [];
            route.legs[0].steps.forEach(step => {
              if (step.instructions && step.distance.value > 500) { // Only major segments > 500m
                const roadMatch = step.instructions.match(/(?:on|onto|via)\s+([A-Z0-9\-\s]+(?:Hwy|Highway|Rd|Road|Ave|Avenue|St|Street|Blvd|Boulevard|Pkwy|Parkway|Fwy|Freeway|Interstate|I-\d+))/i);
                if (roadMatch && !majorRoads.includes(roadMatch[1])) {
                  majorRoads.push(roadMatch[1].trim());
                }
              }
            });

            // Get via waypoints
            const viaPoints = route.summary ? route.summary.split(' and ').filter(s => s) : [];

            // Traffic and route info
            const warnings = route.warnings || [];
            const hasTolls = route.legs[0].steps.some(step =>
              step.instructions && step.instructions.toLowerCase().includes('toll')
            );
            const hasHighway = route.legs[0].steps.some(step =>
              step.instructions && /highway|freeway|interstate/i.test(step.instructions)
            );

            return {
              index,
              summary: route.summary || `Route ${index + 1}`,
              distance: leg.distance.text,
              duration: leg.duration.text,
              durationValue: leg.duration.value,
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              route: route,
              majorRoads: majorRoads.slice(0, 3), // Top 3 major roads
              viaPoints: viaPoints.slice(0, 2), // Max 2 via points
              warnings: warnings,
              hasTolls: hasTolls,
              hasHighway: hasHighway,
              stepCount: leg.steps.length
            };
          });

          console.log('Routes processed successfully:', availableRoutes.length);
          setRoutes(availableRoutes);
          setShowRouteSelection(true);
        } catch (error) {
          console.error('Error processing routes:', error);
          alert('❌ Error processing route data: ' + error.message + '\n\nPlease try again or check the browser console for details.');
        }
      } else {
        console.error('Directions API error:', status);
        let errorMessage = 'Could not find route: ' + status;
        
        if (status === 'REQUEST_DENIED') {
          errorMessage = '❌ Directions API request denied. Please check:\n1. Directions API is enabled\n2. API key has proper permissions\n3. API key restrictions allow this domain';
        } else if (status === 'OVER_QUERY_LIMIT') {
          errorMessage = '❌ API quota exceeded. Please check your Google Cloud Console billing and quotas.';
        } else if (status === 'ZERO_RESULTS') {
          errorMessage = '❌ No routes found between these locations. Please try different addresses.';
        } else if (status === 'UNKNOWN_ERROR') {
          errorMessage = '❌ Unknown error occurred. Please try again.';
        }
        
        alert(errorMessage);
      }
    });
  };

  const handleRouteSelection = (selectedRouteData) => {
    setSelectedRoute(selectedRouteData);
    setShowRouteSelection(false);

    // Display the selected route on map
    directionsRendererRef.current.setDirections({
      routes: [selectedRouteData.route],
      request: {
        origin: startLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode[transportMode],
      },
    });

    // Set directions for text display
    setDirections(selectedRouteData.route.legs[0]);
  };

  const stripHtmlTags = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const clearApiKeys = () => {
    if (confirm('Are you sure you want to clear all saved API keys?')) {
      clearCookie('googleMapsApiKey');
      clearCookie('geminiApiKey');
      setTempGoogleMapsKey('');
      setTempGeminiKey('');
      setGeminiApiKey('');
      alert('All API keys cleared from cookies and form.');
    }
  };

  const handleSaveSettings = () => {
    setGeminiApiKey(tempGeminiKey);
    
    // Save API keys to cookies if they're not placeholder values
    if (tempGoogleMapsKey && tempGoogleMapsKey !== 'your_google_maps_api_key_here') {
      setCookie('googleMapsApiKey', tempGoogleMapsKey);
      console.log('Google Maps API key saved to cookie');
    }
    
    if (tempGeminiKey && tempGeminiKey !== 'your_gemini_api_key_here') {
      setCookie('geminiApiKey', tempGeminiKey);
      console.log('Gemini API key saved to cookie');
    }
    
    // If Google Maps key changed, reload the map
    if (tempGoogleMapsKey !== process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      reloadMapWithNewKey();
    }
    
    setShowSettings(false);
    alert('Settings saved! API keys are stored in cookies and will be remembered.');
  };

  const reloadMapWithNewKey = () => {
    console.log('Reloading map with new API key...');
    
    // Clear existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    if (directionsServiceRef.current) {
      directionsServiceRef.current = null;
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current = null;
    }
    
    // Remove existing Google Maps script
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Clear Google Maps from window
    if (window.google) {
      delete window.google;
    }
    
    // Force reload by triggering useEffect
    console.log('Map cleared, will reload automatically...');
  };

  const testGoogleMapsKey = async () => {
    if (!tempGoogleMapsKey || tempGoogleMapsKey === 'your_google_maps_api_key_here') {
      alert('Please enter a valid Google Maps API key first');
      return;
    }

    // Debug: Check current API key status
    const currentApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    console.log('Current API key from env:', currentApiKey);
    console.log('Temp API key:', tempGoogleMapsKey);
    console.log('Google Maps loaded:', !!window.google);
    console.log('Google Maps object:', window.google);

    // If Google Maps is not loaded or we want to test with a different key, load it
    if (!window.google || !window.google.maps || currentApiKey !== tempGoogleMapsKey) {
      alert('🔄 Loading Google Maps API with your test key...\n\nThis may take a few seconds.');
      
      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Load Google Maps API with the temp key
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${tempGoogleMapsKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        console.log('Google Maps object after load:', window.google);
        // Now test the geocoder
        testGeocoder();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        alert('❌ Failed to load Google Maps API.\n\nPlease check:\n1. API key is correct\n2. Maps JavaScript API is enabled\n3. API key restrictions allow this domain');
      };
      
      document.head.appendChild(script);
      return;
    }

    // If Google Maps is already loaded, test it directly
    testGeocoder();
  };

  const testGeocoder = () => {
    try {
      console.log('Testing geocoder...');
      console.log('Google Maps available:', !!window.google);
      console.log('Google Maps object:', window.google);
      
      if (!window.google || !window.google.maps) {
        alert('❌ Google Maps is not available after loading. Please check your API key.');
        return;
      }

      // Test using the Geocoder service (already loaded with the Maps API)
      const geocoder = new window.google.maps.Geocoder();
      console.log('Geocoder created:', !!geocoder);

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.log('Geocoder test timed out');
        // Try alternative test method
        testAlternativeMethod();
      }, 10000); // 10 second timeout

      console.log('Starting geocoder request...');
      geocoder.geocode({ address: 'New York, USA' }, (results, status) => {
        console.log('Geocoder callback received:', { results, status });
        clearTimeout(timeoutId);
        
        console.log('Geocoder response:', { results, status }); // Debug logging
        
        if (status === 'OK' && results && results.length > 0) {
          alert('✅ Google Maps API Key is valid and working!\n\nSuccessfully geocoded: ' + results[0].formatted_address);
          // Save successful API key to cookie
          setCookie('googleMapsApiKey', tempGoogleMapsKey);
          console.log('Google Maps API key saved to cookie');
        } else if (status === 'REQUEST_DENIED') {
          alert('❌ API Key is invalid or denied. Please check:\n1. API key is correct in .env file\n2. Maps JavaScript API is enabled\n3. Geocoding API is enabled\n4. Server has been restarted');
        } else if (status === 'ZERO_RESULTS') {
          alert('✅ API Key is working but returned no results for the test query.');
        } else if (status === 'OVER_QUERY_LIMIT') {
          alert('❌ API quota exceeded. Please check your Google Cloud Console billing and quotas.');
        } else if (status === 'UNKNOWN_ERROR') {
          alert('❌ Unknown error occurred. Please try again or check your API key configuration.');
        } else {
          alert(`⚠️ API Status: ${status}\nThe API key may be working but encountered an issue.\n\nDebug info: ${JSON.stringify({ results, status })}`);
        }
      });
    } catch (error) {
      console.error('Google Maps test error:', error);
      alert('❌ Error testing API key: ' + error.message + '\n\nPlease check:\n1. API key is valid\n2. Required APIs are enabled\n3. Network connectivity');
    }
  };

  const testMapDisplay = () => {
    console.log('Testing map display...');
    console.log('Map ref:', mapRef.current);
    console.log('Map instance:', mapInstanceRef.current);
    console.log('Google Maps:', window.google);
    
    if (!window.google || !window.google.maps) {
      alert('❌ Google Maps API is not loaded. Please check your API key.');
      return;
    }
    
    if (!mapRef.current) {
      alert('❌ Map container element not found.');
      return;
    }
    
    if (mapInstanceRef.current) {
      alert('✅ Map instance already exists. Map should be visible.');
      return;
    }
    
    // Try to initialize the map manually
    try {
      console.log('Manually initializing map...');
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
      });
      
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
      directionsRendererRef.current.setMap(mapInstanceRef.current);
      
      alert('✅ Map initialized manually! Check if it\'s now visible.');
    } catch (error) {
      console.error('Manual map initialization error:', error);
      alert('❌ Error initializing map manually: ' + error.message);
    }
  };

  const testDirectionsAPI = async () => {
    if (!tempGoogleMapsKey || tempGoogleMapsKey === 'your_google_maps_api_key_here') {
      alert('Please enter a valid Google Maps API key first');
      return;
    }

    if (!window.google || !window.google.maps) {
      alert('❌ Google Maps API is not loaded. Please test the Maps API first.');
      return;
    }

    try {
      console.log('Testing Directions API...');
      
      const directionsService = new window.google.maps.DirectionsService();
      
      const request = {
        origin: 'New York, NY',
        destination: 'Boston, MA',
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      console.log('Directions API request:', request);

      directionsService.route(request, (result, status) => {
        console.log('Directions API response:', { result, status });
        
        if (status === 'OK') {
          alert('✅ Directions API is working!\n\nSuccessfully found route from New York to Boston.\nDistance: ' + result.routes[0].legs[0].distance.text + '\nDuration: ' + result.routes[0].legs[0].duration.text);
        } else if (status === 'REQUEST_DENIED') {
          alert('❌ Directions API request denied. Please check:\n1. Directions API is enabled in Google Cloud Console\n2. API key has proper permissions\n3. API key restrictions allow this domain');
        } else if (status === 'OVER_QUERY_LIMIT') {
          alert('❌ API quota exceeded. Please check your Google Cloud Console billing and quotas.');
        } else if (status === 'ZERO_RESULTS') {
          alert('✅ Directions API is working but returned no results for the test query.');
        } else if (status === 'UNKNOWN_ERROR') {
          alert('❌ Unknown error occurred. Please try again.');
        } else {
          alert(`⚠️ Directions API Status: ${status}\nThe API may be working but encountered an issue.`);
        }
      });
    } catch (error) {
      console.error('Directions API test error:', error);
      alert('❌ Error testing Directions API: ' + error.message);
    }
  };

  const testGeminiKey = async () => {
    if (!tempGeminiKey || tempGeminiKey === 'your_gemini_api_key_here') {
      alert('Please enter a valid Gemini API key first');
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${tempGeminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Say "API working" if you can read this'
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            }
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        alert('✅ Gemini API Key is valid and working!\n\nResponse: ' + data.candidates[0].content.parts[0].text);
        // Save successful API key to cookie
        setCookie('geminiApiKey', tempGeminiKey);
        console.log('Gemini API key saved to cookie');
      } else if (data.error) {
        alert(`❌ Gemini API Error:\n\n${data.error.message || 'Invalid API key'}\n\nStatus: ${data.error.status || 'Unknown'}`);
      } else {
        alert(`⚠️ Unexpected response from API.\n\nStatus: ${response.status}\n\nPlease verify:\n1. API key is correct\n2. Gemini API is enabled at https://makersuite.google.com/`);
      }
    } catch (error) {
      alert(`❌ Error testing Gemini API key:\n\n${error.message}\n\nThis could be:\n- Network issue\n- CORS restriction\n- Invalid API key format`);
    }
  };

  const handleNaturalLanguageInput = async () => {
    if (!naturalLanguageQuery.trim()) {
      alert('Please enter a query');
      return;
    }

    if (!geminiApiKey.trim() || geminiApiKey === 'your_gemini_api_key_here') {
      alert('Please enter your Gemini API key first');
      return;
    }

    setIsProcessingAI(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Extract the starting location and destination from this query. Return ONLY a JSON object with "start" and "destination" fields. If transport mode is mentioned, include a "transportMode" field with one of: DRIVING, WALKING, BICYCLING, or TRANSIT.

Query: "${naturalLanguageQuery}"

Example response format:
{"start": "New York, NY", "destination": "Boston, MA", "transportMode": "DRIVING"}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200,
            }
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;

        // Extract JSON from response (handle code blocks)
        const jsonMatch = aiResponse.match(/\{[^}]+\}/);
        if (jsonMatch) {
          const locationData = JSON.parse(jsonMatch[0]);

          if (locationData.start) {
            setStartLocation(locationData.start);
          }
          if (locationData.destination) {
            setDestination(locationData.destination);
          }
          if (locationData.transportMode) {
            setTransportMode(locationData.transportMode);
          }

          setNaturalLanguageQuery('');
          alert('Locations extracted successfully!');
        } else {
          alert('Could not parse AI response. Please try rephrasing your query.');
        }
      } else {
        alert('No response from AI. Please check your API key.');
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      alert('Error processing query: ' + error.message);
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="navigation-container">
      <div className="input-section">
        <div className="header-with-settings">
          <h1>Navigation App</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="settings-button"
            title="API Settings"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Natural Language Input Section */}
        <div className="ai-input-section">
          <h3>🤖 AI-Powered Input</h3>
          <p className="ai-description">
            Ask in natural language or try an example below!
          </p>

          <div className="example-queries">
            <p className="example-label">Quick Examples:</p>
            <div className="example-buttons">
              <button
                className="example-btn"
                onClick={() => setNaturalLanguageQuery("Take me from Times Square to Central Park by walking")}
              >
                🚶 Walk in NYC
              </button>
              <button
                className="example-btn"
                onClick={() => setNaturalLanguageQuery("Drive me from Los Angeles to San Francisco")}
              >
                🚗 LA to SF
              </button>
              <button
                className="example-btn"
                onClick={() => setNaturalLanguageQuery("I want to bike from Golden Gate Bridge to Fisherman's Wharf")}
              >
                🚴 Bike in SF
              </button>
              <button
                className="example-btn"
                onClick={() => setNaturalLanguageQuery("How do I get from JFK Airport to Manhattan by transit")}
              >
                🚌 Transit to NYC
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="nl-query">Your Request:</label>
            <textarea
              id="nl-query"
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              placeholder="e.g., 'I want to go from Times Square to Central Park by walking' or 'Drive me from LAX to Santa Monica'"
              className="nl-textarea"
              rows="3"
            />
            <small className="api-key-hint">
              💡 Configure Gemini API key in Settings (⚙️) to use this feature
            </small>
          </div>

          <button
            onClick={handleNaturalLanguageInput}
            className="ai-process-button"
            disabled={isProcessingAI}
          >
            {isProcessingAI ? '🔄 Processing...' : '✨ Extract Locations'}
          </button>
        </div>

        <div className="divider">
          <span>OR ENTER MANUALLY</span>
        </div>

        <div className="input-group">
          <label htmlFor="start">Starting Location:</label>
          <input
            id="start"
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="Enter starting location"
            className="location-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="destination">Destination:</label>
          <input
            id="destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination"
            className="location-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="transport">Transport Mode:</label>
          <div className="transport-mode-selector">
            <button
              className={`transport-btn ${transportMode === 'DRIVING' ? 'active' : ''}`}
              onClick={() => setTransportMode('DRIVING')}
              type="button"
            >
              🚗 Driving
            </button>
            <button
              className={`transport-btn ${transportMode === 'WALKING' ? 'active' : ''}`}
              onClick={() => setTransportMode('WALKING')}
              type="button"
            >
              🚶 Walking
            </button>
            <button
              className={`transport-btn ${transportMode === 'BICYCLING' ? 'active' : ''}`}
              onClick={() => setTransportMode('BICYCLING')}
              type="button"
            >
              🚴 Bicycling
            </button>
            <button
              className={`transport-btn ${transportMode === 'TRANSIT' ? 'active' : ''}`}
              onClick={() => setTransportMode('TRANSIT')}
              type="button"
            >
              🚌 Transit
            </button>
          </div>
        </div>

        <button
          onClick={handleNavigate}
          className="navigate-button"
          disabled={isLoading}
        >
          {isLoading ? 'Finding Routes...' : 'Navigate'}
        </button>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className="log-toggle-button"
          type="button"
        >
          {showLogs ? '📋 Hide Logs' : '📋 Show Logs'} {apiLogs.length > 0 && `(${apiLogs.length})`}
        </button>
      </div>

      {/* Route Selection Modal */}
      {showRouteSelection && routes.length > 0 && (
        <div className="modal-overlay">
          <div className="route-selection-modal">
            <h2>Select a Route</h2>
            <div className="routes-list">
              {routes.map((route) => (
                <div
                  key={route.index}
                  className="route-option"
                  onClick={() => handleRouteSelection(route)}
                >
                  <div className="route-header">
                    <h3>Route {route.index + 1}</h3>
                    <span className="route-duration">{route.duration}</span>
                  </div>

                  <div className="route-info">
                    <p className="route-distance">📍 {route.distance}</p>

                    {route.majorRoads.length > 0 && (
                      <p className="route-via">
                        🛣️ Via: {route.majorRoads.join(' → ')}
                      </p>
                    )}

                    {route.viaPoints.length > 0 && (
                      <p className="route-waypoints">
                        📌 Through: {route.viaPoints.join(' and ')}
                      </p>
                    )}

                    <div className="route-features">
                      {route.hasHighway && (
                        <span className="feature-badge highway">🛣️ Highway</span>
                      )}
                      {route.hasTolls && (
                        <span className="feature-badge toll">💰 Tolls</span>
                      )}
                      <span className="feature-badge steps">🔢 {route.stepCount} turns</span>
                    </div>

                    {route.warnings.length > 0 && (
                      <div className="route-warnings">
                        {route.warnings.map((warning, idx) => (
                          <p key={idx} className="warning-text">⚠️ {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRouteSelection(false)}
              className="close-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map Display */}
      <div className="map-container">
        <div ref={mapRef} className="map"></div>
      </div>

      {/* Text Directions */}
      {directions && (
        <div className="directions-panel">
          <h2>Step-by-Step Directions</h2>
          <div className="route-summary">
            <p><strong>Total Distance:</strong> {directions.distance.text}</p>
            <p><strong>Total Duration:</strong> {directions.duration.text}</p>
          </div>

          <div className="steps-list">
            {directions.steps.map((step, index) => (
              <div key={index} className="direction-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <p className="step-instruction">
                    {stripHtmlTags(step.instructions)}
                  </p>
                  <p className="step-distance">
                    {step.distance.text} ({step.duration.text})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="settings-modal">
            <h2>⚙️ API Settings</h2>
            <p className="settings-description">
              Configure your API keys. Keys from .env file are auto-populated.
            </p>

            <div className="settings-form">
              <div className="input-group">
                <label htmlFor="settings-maps-key">Google Maps API Key:</label>
                <div className="key-input-with-test">
                  <input
                    id="settings-maps-key"
                    type="text"
                    value={tempGoogleMapsKey}
                    onChange={(e) => setTempGoogleMapsKey(e.target.value)}
                    placeholder="Enter Google Maps API key"
                    className="location-input key-input"
                  />
                  <button
                    onClick={testGoogleMapsKey}
                    className="test-key-button"
                    title="Test Google Maps API key"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="settings-gemini-key">Gemini API Key:</label>
                <div className="key-input-with-test">
                  <input
                    id="settings-gemini-key"
                    type="text"
                    value={tempGeminiKey}
                    onChange={(e) => setTempGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API key"
                    className="location-input key-input"
                  />
                  <button
                    onClick={testGeminiKey}
                    className="test-key-button"
                    title="Test Gemini API key"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>

              <div className="env-file-info">
                <h4>📄 Permanent Storage (.env file)</h4>
                <p>Current values loaded from: <code>.env</code></p>
                <ul>
                  <li><strong>Google Maps:</strong> {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? '✓ Configured' : '✗ Not set'}</li>
                  <li><strong>Gemini:</strong> {process.env.REACT_APP_GEMINI_API_KEY ? '✓ Configured' : '✗ Not set'}</li>
                </ul>
                <p className="env-note">
                  To permanently save API keys, edit <code>.env</code> file and restart the server.
                </p>
              </div>

              <div className="settings-actions">
                <button
                  onClick={handleSaveSettings}
                  className="save-settings-button"
                >
                  💾 Save Settings
                </button>
                <button
                  onClick={clearApiKeys}
                  className="clear-settings-button"
                >
                  🗑️ Clear All Keys
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setTempGeminiKey(geminiApiKey);
                    setTempGoogleMapsKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '');
                  }}
                  className="cancel-settings-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Logs Section */}
      {showLogs && (
        <div className="logs-panel">
          <div className="logs-header">
            <h2>API Request & Response Logs</h2>
            <button
              onClick={() => setApiLogs([])}
              className="clear-logs-button"
              disabled={apiLogs.length === 0}
            >
              Clear Logs
            </button>
          </div>

          {apiLogs.length === 0 ? (
            <p className="no-logs">No API logs yet. Make a navigation request to see logs.</p>
          ) : (
            <div className="logs-list">
              {apiLogs.map((log) => (
                <div key={log.id} className={`log-entry log-${log.type.toLowerCase()}`}>
                  <div className="log-header-row">
                    <span className={`log-type-badge ${log.type.toLowerCase()}`}>
                      {log.type}
                    </span>
                    <span className="log-timestamp">{log.timestamp}</span>
                  </div>

                  <div className="log-content">
                    <p className="log-endpoint"><strong>Endpoint:</strong> {log.data.endpoint}</p>

                    {log.type === 'REQUEST' && (
                      <div className="log-details">
                        <strong>Parameters:</strong>
                        <pre className="log-json">{JSON.stringify(log.data.params, null, 2)}</pre>
                      </div>
                    )}

                    {log.type === 'RESPONSE' && (
                      <div className="log-details">
                        <p><strong>Status:</strong> <span className={`status-${log.data.status}`}>{log.data.status}</span></p>
                        <p><strong>Routes Found:</strong> {log.data.routesCount}</p>
                        {log.data.data && (
                          <>
                            <strong>Response Data:</strong>
                            <pre className="log-json">{JSON.stringify(log.data.data, null, 2)}</pre>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationApp;

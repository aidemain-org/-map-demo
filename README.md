# Navigation App

A React-based navigation application that uses Google Maps API for routing and Google Gemini AI for natural language processing.

## Features

- Interactive Google Maps integration
- Multiple route options with different transport modes (Driving, Walking, Bicycling, Transit)
- Natural language query processing using Gemini AI
- Real-time API logging and testing
- Responsive design with step-by-step directions
- API key management and testing tools

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the root directory with your API keys:

```env
# Google Maps API Key
# Get your key from: https://console.cloud.google.com/google/maps-apis
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gemini API Key  
# Get your key from: https://makersuite.google.com/app/apikey
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Your API Keys

#### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

### 4. Run the Application

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Enter Locations**: Type your starting location and destination
2. **Select Transport Mode**: Choose from Driving, Walking, Bicycling, or Transit
3. **Get Directions**: Click "Get Directions" to see route options
4. **Natural Language**: Use the AI-powered natural language input to extract locations from queries
5. **Test APIs**: Use the Settings panel (⚙️ icon) to test your API keys
6. **View Routes**: Select from multiple route options with detailed information
7. **Step-by-Step Directions**: Follow the detailed turn-by-turn instructions

## Troubleshooting

### Google Maps Not Loading
- Verify your Google Maps API key is correct
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Check that your domain is allowed in API key restrictions
- Restart the development server after updating `.env` file
- Use the "Test Map Display" button in Settings to debug

### Gemini AI Not Working
- Verify your Gemini API key is correct
- Ensure you have access to Gemini API
- Check the browser console for CORS errors
- Try testing the API key in the Settings panel

### Route Finding Fails
- Ensure Directions API is enabled in Google Cloud Console
- Check that your API key has proper permissions
- Verify the addresses are valid and accessible
- Use the "Test Directions" button in Settings to verify API functionality

### API Key Testing
Use the Settings panel (⚙️ icon) to test your API keys:
- **Test Google Maps**: Uses Geocoding API to verify the key
- **Test Directions**: Tests route finding with sample locations
- **Test Map Display**: Checks if the map renders properly
- **Test Gemini**: Sends a simple request to verify the key

## Project Structure

```
src/
├── NavigationApp.jsx    # Main application component
├── NavigationApp.css     # Application styles
└── index.js             # Application entry point

public/
└── index.html           # HTML template

.env                     # Environment variables (create this)
```

## Technologies Used

- React 18
- Google Maps JavaScript API
- Google Directions API
- Google Geocoding API
- Google Gemini AI API
- CSS3 for styling
- Create React App for build tooling

## Advanced Features

- **Dynamic API Loading**: Google Maps API loads dynamically based on configured keys
- **Route Analysis**: Extracts major roads, tolls, and highway information
- **API Logging**: Real-time logging of all API requests and responses
- **Error Handling**: Comprehensive error messages with troubleshooting guidance
- **Responsive Design**: Works on desktop and mobile devices

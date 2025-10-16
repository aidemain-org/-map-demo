# Navigation App with Google Maps

A React application that provides navigation with route selection and step-by-step directions using Google Maps API.

## Features

- Input fields for starting location and destination
- Navigate button to find routes
- Route selection dialog showing multiple route options
- Visual map display with route visualization
- Step-by-step text directions with distance and duration

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
4. Create credentials (API Key)
5. Copy your API key

### 2. Configure API Key

Open `index.html` and replace `YOUR_API_KEY` with your actual Google Maps API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

## Usage

1. Enter your starting location in the first input field
2. Enter your destination in the second input field
3. Click the "Navigate" button
4. Select one of the available routes from the modal dialog
5. View the route on the map and read step-by-step directions below

## Project Structure

```
navigation-app/
├── NavigationApp.jsx    # Main React component
├── NavigationApp.css    # Styles
├── index.js             # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies
└── README.md            # This file
```

## Technologies Used

- React 18
- Google Maps JavaScript API
- Google Directions API
- CSS3

## Notes

- The app requests multiple route alternatives when available
- Distance and duration are displayed for each route option
- HTML tags in directions are stripped for clean text display
- The map automatically centers and zooms to fit the selected route

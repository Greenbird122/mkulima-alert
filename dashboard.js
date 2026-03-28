const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

// Updated Error Handling
if (!API_KEY) {
    console.error("Weather API key is missing. Please ensure you have set the REACT_APP_WEATHER_API_KEY in your .env file.");
}
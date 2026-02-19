# Google Maps API Setup Instructions

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (optional, for search functionality)

4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "API key"
   - Copy the API key
   - Restrict the API key for security:
     - Application restrictions: Select "Android apps" and "iOS apps"
     - API restrictions: Select only the required APIs

## Step 2: Configure API Key in App

### For Android:
Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json` with your actual API key:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
}
```

### For iOS:
Add this to your `ios/YourAppName/AppDelegate.mm`:

```objectivec
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [GMSServices provideAPIKey:@"YOUR_ACTUAL_API_KEY_HERE"];
  // ... rest of the method
}
```

### For Web:
Add this to your `index.html` in the `<head>` section:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE"></script>
```

## Step 3: Build and Test

After adding the API key:

1. Clear the cache:
   ```bash
   npx expo start -c
   ```

2. Test on a real device (Google Maps may not work in simulator without proper setup)

## Features Now Available:

✅ **Real Google Maps** - Interactive map with zoom, pan, and real map data
✅ **User Location Tracking** - Blue dot showing current location
✅ **Territory Circles** - Visual representation of conquered territories
✅ **Run Path Visualization** - Polyline showing your running route
✅ **Smooth Animations** - Map follows user during runs

## Security Notes:

- Never commit your API key to public repositories
- Use environment variables for production apps
- Restrict your API key to specific platforms and APIs
- Monitor your API usage in Google Cloud Console

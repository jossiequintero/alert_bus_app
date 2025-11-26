import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AlertBus Milagro',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Geolocation: {
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    }
  },
  
};

export default config;

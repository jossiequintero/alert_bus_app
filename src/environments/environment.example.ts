export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  apiUrl: 'http://localhost:3000/api',
  // Configuración específica para Guayaquil, Ecuador
  defaultLocation: {
    latitude: -2.1894,
    longitude: -79.8890,
    city: 'Guayaquil',
    country: 'Ecuador'
  },
  firebaseConfig: {
    // Configuración de Firebase para notificaciones push
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'YOUR_APP_ID'
  }
};

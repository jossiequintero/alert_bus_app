// Configuración para Google Maps - Guayaquil, Ecuador
// Reemplaza 'YOUR_API_KEY' con tu clave de API de Google Maps
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyAkIam9QrImFYkgRxs4C0dF_q4IzMKJla0', // Obtén tu clave de API desde Google Cloud Console
  libraries: ['places', 'geometry'] as const,
  // Configuración específica para Guayaquil
  defaultCenter: {
    lat: -2.1894, // Centro de Guayaquil
    lng: -79.8890
  },
  defaultZoom: 13,
  // Restricciones geográficas para Guayaquil
  bounds: {
    north: -2.1000,
    south: -2.2500,
    east: -79.8000,
    west: -79.9500
  }
};

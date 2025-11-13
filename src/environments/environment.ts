// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseFunctionsUrl: 'https://us-central1-alert-bus-fc1e6.cloudfunctions.net',
  apiUrl: 'https://api-unsbbqln3q-uc.a.run.app/',
  //googleMapsApiKey: 'AIzaSyAkIam9QrImFYkgRxs4C0dF_q4IzMKJla0',
  googleMapsApiKey: 'AIzaSyAJ9mvCFtH9zfEjQueueDiYc1YZSb0cr5I',
  firebase: {
    apiKey: "AIzaSyAkIam9QrImFYkgRxs4C0dF_q4IzMKJla0",
    authDomain: "alert-bus-fc1e6.firebaseapp.com",
    projectId: "alert-bus-fc1e6",
    storageBucket: "alert-bus-fc1e6.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  },
  // Configuración específica para Guayaquil, Ecuador
  defaultLocation: {
    latitude: -2.1894,
    longitude: -79.8890,
    city: 'Guayaquil',
    country: 'Ecuador'
  }
} as const;

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'black',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    }
  }
};

export default config;

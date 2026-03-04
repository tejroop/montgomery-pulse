import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibecoding.montgomerypulse',
  appName: 'MontgomeryPulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#34d399',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#064e3b',
    },
  },
};

export default config;

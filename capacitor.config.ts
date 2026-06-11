import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.augmenta.piercersprostudy',
  appName: "Piercer's Pro-Study",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

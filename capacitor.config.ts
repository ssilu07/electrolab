import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royals.electolab',
  appName: 'ElectroLab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050811',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#3b82f6',
    },
  },
};

export default config;

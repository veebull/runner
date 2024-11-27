/// <reference types="vite/client" />

interface Window {
  Telegram: {
    WebApp: {
      expand: () => void
      enableClosingConfirmation: () => void
      // Add other Telegram WebApp methods as needed
    }
  }
}

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

interface Window {
  DeviceOrientationEvent: {
    requestPermission?: () => Promise<'granted' | 'denied'>
  } & DeviceOrientationEventConstructor
}

/// <reference types="vite/client" />

interface Window {
  Telegram: {
    WebApp: {
      expand: () => void
      enableClosingConfirmation: () => void
      requestFullscreen: () => void
      exitFullscreen: () => void
      lockOrientation: () => void
      unlockOrientation: () => void
      disableVerticalSwipes: () => void
      DeviceOrientation?: {
        start: (params: {
          refresh_rate?: number
          need_absolute?: boolean
        }) => void
        stop: () => void
        gamma: number | null
        beta: number | null
        alpha: number | null
      }
      onEvent: (eventName: string, callback: () => void) => void
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

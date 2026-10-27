import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';

export class NativeBridge {
  private static isInitialized = false;
  private static backButtonHandlers: (() => boolean)[] = [];

  /**
   * Check if running on Android or iOS native container
   */
  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initialize native status bar, keyboard, and back button handlers
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (this.isNative()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#050811' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('StatusBar initialization skipped:', err);
      }

      try {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          // Iterate back button handlers from top of stack
          for (let i = this.backButtonHandlers.length - 1; i >= 0; i--) {
            const handled = this.backButtonHandlers[i]();
            if (handled) return;
          }

          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
      } catch (err) {
        console.warn('Capacitor App backButton listener error:', err);
      }
    }
  }

  /**
   * Register a custom back button handler. Returns unregister function.
   * If handler returns true, back press is considered handled.
   */
  public static registerBackButton(handler: () => boolean): () => void {
    this.backButtonHandlers.push(handler);
    return () => {
      this.backButtonHandlers = this.backButtonHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Tactile Haptic Vibration for interactions, clicks, and circuit blowups
   */
  public static async haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'explode'): Promise<void> {
    try {
      if (this.isNative()) {
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'success':
            await Haptics.notification({ type: NotificationType.Success });
            break;
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning });
            break;
          case 'error':
          case 'explode':
            await Haptics.vibrate({ duration: 350 });
            break;
        }
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        switch (type) {
          case 'light':
            navigator.vibrate(15);
            break;
          case 'medium':
            navigator.vibrate(30);
            break;
          case 'heavy':
            navigator.vibrate(60);
            break;
          case 'success':
            navigator.vibrate([20, 40, 20]);
            break;
          case 'warning':
          case 'error':
            navigator.vibrate([40, 60, 40]);
            break;
          case 'explode':
            navigator.vibrate([100, 50, 150, 50, 200]);
            break;
        }
      }
    } catch {
      // Haptics not supported or blocked by user preference
    }
  }
}

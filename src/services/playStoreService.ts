import { registerPlugin, Capacitor } from '@capacitor/core';

export interface AppVersionInfo {
  packageName: string;
  versionName: string;
  versionCode: number;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInProgress?: boolean;
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  availableVersionCode?: number;
  installStatus?: number;
  updatePriority?: number;
  clientStalenessDays?: number;
  error?: string;
  isMock?: boolean;
}

export interface FlexibleInstallState {
  installStatus: number;
  bytesDownloaded: number;
  totalBytesToDownload: number;
  installErrorCode: number;
}

interface PlayStorePluginInterface {
  getAppVersionInfo(): Promise<AppVersionInfo>;
  checkForUpdate(): Promise<UpdateCheckResult>;
  startImmediateUpdate(): Promise<{ started: boolean }>;
  startFlexibleUpdate(): Promise<{ started: boolean }>;
  completeFlexibleUpdate(): Promise<{ success: boolean }>;
  requestReview(): Promise<{ flowCompleted: boolean; openedStoreListing?: boolean }>;
  openPlayStoreListing(): Promise<{ success: boolean }>;
  addListener(
    eventName: 'onFlexibleInstallStateUpdate',
    listenerFunc: (state: FlexibleInstallState) => void
  ): Promise<any>;
  addListener(
    eventName: 'onUpdateDownloaded',
    listenerFunc: (event: { downloaded: boolean }) => void
  ): Promise<any>;
}

const NativePlayStore = registerPlugin<PlayStorePluginInterface>('PlayStore');

class PlayStoreService {
  private isChecking = false;
  private isUpdateDownloaded = false;
  private cachedUpdateInfo: UpdateCheckResult | null = null;
  private cachedVersionInfo: AppVersionInfo = {
    packageName: 'com.royals.electolab',
    versionName: '1.0.3',
    versionCode: 4,
  };

  private updateListeners: ((info: UpdateCheckResult) => void)[] = [];
  private downloadCompleteListeners: (() => void)[] = [];

  constructor() {
    this.initListeners();
  }

  private async initListeners() {
    if (Capacitor.isNativePlatform()) {
      try {
        await NativePlayStore.addListener('onUpdateDownloaded', () => {
          console.log('[PlayStoreService] Flexible update downloaded and ready to install.');
          this.isUpdateDownloaded = true;
          this.downloadCompleteListeners.forEach(listener => listener());
        });
      } catch (err) {
        console.warn('[PlayStoreService] Could not register update listeners:', err);
      }
    }
  }

  /**
   * Get Current App Version details
   */
  public async getVersionInfo(): Promise<AppVersionInfo> {
    if (Capacitor.isNativePlatform()) {
      try {
        const info = await NativePlayStore.getAppVersionInfo();
        this.cachedVersionInfo = info;
        return info;
      } catch (err) {
        console.warn('[PlayStoreService] Error fetching version info:', err);
      }
    }
    return this.cachedVersionInfo;
  }

  /**
   * Check if a new version is published on Google Play Store
   */
  public async checkForUpdate(): Promise<UpdateCheckResult> {
    if (this.isChecking) {
      return this.cachedUpdateInfo || { updateAvailable: false };
    }

    this.isChecking = true;

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await NativePlayStore.checkForUpdate();
        this.cachedUpdateInfo = result;
        if (result.updateAvailable) {
          console.log('[PlayStoreService] Google Play update available! VersionCode:', result.availableVersionCode);
          this.updateListeners.forEach(l => l(result));
        }
        return result;
      } else {
        // Dev web mock: simulate no update or mock state
        const mock: UpdateCheckResult = {
          updateAvailable: false,
          isMock: true,
          availableVersionCode: 2,
        };
        this.cachedUpdateInfo = mock;
        return mock;
      }
    } catch (err: any) {
      console.warn('[PlayStoreService] checkForUpdate error:', err);
      const fallback: UpdateCheckResult = {
        updateAvailable: false,
        error: err?.message || 'Failed to connect to Google Play',
      };
      return fallback;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Start immediate update (full screen Google Play UI)
   */
  public async startImmediateUpdate(): Promise<{ started: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativePlayStore.startImmediateUpdate();
      } catch (err) {
        console.error('[PlayStoreService] Immediate update failed:', err);
        return { started: false };
      }
    }
    console.log('[PlayStoreService] Simulated immediate update on web.');
    return { started: true };
  }

  /**
   * Start flexible background update
   */
  public async startFlexibleUpdate(): Promise<{ started: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativePlayStore.startFlexibleUpdate();
      } catch (err) {
        console.error('[PlayStoreService] Flexible update failed:', err);
        return { started: false };
      }
    }
    console.log('[PlayStoreService] Simulated flexible update on web.');
    return { started: true };
  }

  /**
   * Complete flexible update: restarts app and applies update
   */
  public async completeFlexibleUpdate(): Promise<{ success: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativePlayStore.completeFlexibleUpdate();
      } catch (err) {
        console.error('[PlayStoreService] Complete update failed:', err);
        return { success: false };
      }
    }
    return { success: true };
  }

  /**
   * Request Google Play In-App Review dialog
   */
  public async requestReview(): Promise<{ flowCompleted: boolean; openedStoreListing?: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativePlayStore.requestReview();
      } catch (err) {
        console.warn('[PlayStoreService] In-App Review request failed, opening store listing:', err);
        const res = await this.openPlayStore();
        return { flowCompleted: false, openedStoreListing: res.success };
      }
    } else {
      console.log('[PlayStoreService] Dev web simulated review prompt.');
      return { flowCompleted: true };
    }
  }

  /**
   * Open the app listing directly in Google Play Store
   */
  public async openPlayStore(): Promise<{ success: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        return await NativePlayStore.openPlayStoreListing();
      } catch (err) {
        console.warn('[PlayStoreService] Open Play Store listing failed:', err);
      }
    }
    // Web fallback
    window.open('https://play.google.com/store/apps/details?id=com.royals.electolab', '_blank');
    return { success: true };
  }

  /**
   * Subscribe to update available notifications
   */
  public onUpdateAvailable(listener: (info: UpdateCheckResult) => void): () => void {
    this.updateListeners.push(listener);
    if (this.cachedUpdateInfo?.updateAvailable) {
      listener(this.cachedUpdateInfo);
    }
    return () => {
      this.updateListeners = this.updateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to update download completion
   */
  public onDownloadComplete(listener: () => void): () => void {
    this.downloadCompleteListeners.push(listener);
    if (this.isUpdateDownloaded) {
      listener();
    }
    return () => {
      this.downloadCompleteListeners = this.downloadCompleteListeners.filter(l => l !== listener);
    };
  }
}

export const playStoreService = new PlayStoreService();

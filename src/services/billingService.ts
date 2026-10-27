import { registerPlugin, Capacitor } from '@capacitor/core';

export interface ProStatusResult {
  isPro: boolean;
  orderId?: string;
  purchaseToken?: string;
  productId?: string;
  error?: string;
  isMock?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  canceled?: boolean;
  orderId?: string;
  purchaseToken?: string;
  message?: string;
}

interface GoogleBillingPlugin {
  checkProStatus(): Promise<ProStatusResult>;
  purchasePro(): Promise<PurchaseResult>;
  restorePurchases(): Promise<ProStatusResult>;
}

// Register Native Capacitor Plugin
const NativeGoogleBilling = registerPlugin<GoogleBillingPlugin>('GoogleBilling');

class BillingService {
  private isProCached: boolean = false;
  private isInitialized: boolean = false;
  private listeners: ((isPro: boolean) => void)[] = [];

  public readonly PRODUCT_ID = 'electrolab_pro_lifetime';
  public readonly PRICE_DISPLAY = '₹600 (One-Time)';

  /**
   * Initialize and perform real-time verification with Google Play.
   * If a user took a refund, Google automatically excludes it from queryPurchasesAsync,
   * revoking Pro status on app startup.
   */
  public async init(): Promise<boolean> {
    const status = await this.checkProStatus();
    this.isInitialized = true;
    return status.isPro;
  }

  public get isPro(): boolean {
    return this.isProCached;
  }

  /**
   * Check real-time Pro status with Google Play Billing
   */
  public async checkProStatus(): Promise<ProStatusResult> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await NativeGoogleBilling.checkProStatus();
        this.updateProState(Boolean(result.isPro));
        return result;
      } catch (err: any) {
        console.warn('[BillingService] Native checkProStatus error:', err);
        this.updateProState(false);
        return { isPro: false, error: err?.message || 'Failed to contact Google Play' };
      }
    } else {
      // Browser / Web fallback for local testing & development
      const stored = localStorage.getItem('electrolab_pro_dev') === 'true';
      this.updateProState(stored);
      return { isPro: stored, isMock: true };
    }
  }

  /**
   * Launch official Google Play Purchase flow
   */
  public async purchasePro(): Promise<PurchaseResult> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeGoogleBilling.purchasePro();
        if (res.success && res.isPro) {
          this.updateProState(true);
        }
        return res;
      } catch (err: any) {
        console.error('[BillingService] Native purchasePro error:', err);
        return {
          success: false,
          isPro: this.isProCached,
          message: err?.message || 'Google Play purchase could not be completed',
        };
      }
    } else {
      // Dev mode simulated purchase for browser preview
      this.updateProState(true);
      localStorage.setItem('electrolab_pro_dev', 'true');
      return {
        success: true,
        isPro: true,
        message: 'Dev Mode: Simulated Google Play Purchase Activated',
      };
    }
  }

  /**
   * Restore Purchases from Google Play
   */
  public async restorePurchases(): Promise<ProStatusResult> {
    return this.checkProStatus();
  }

  /**
   * Helper to toggle Pro in dev mode / testing
   */
  public devTogglePro(enabled?: boolean): boolean {
    const next = enabled !== undefined ? enabled : !this.isProCached;
    this.updateProState(next);
    localStorage.setItem('electrolab_pro_dev', next ? 'true' : 'false');
    return next;
  }

  private updateProState(newVal: boolean) {
    if (this.isProCached !== newVal || !this.isInitialized) {
      this.isProCached = newVal;
      this.listeners.forEach((listener) => {
        try {
          listener(newVal);
        } catch (e) {
          console.error('[BillingService] Listener error:', e);
        }
      });
    }
  }

  /**
   * Subscribe to Pro status changes (e.g. upon refund, purchase, or restore)
   */
  public onProStatusChange(callback: (isPro: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.isProCached);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const billingService = new BillingService();

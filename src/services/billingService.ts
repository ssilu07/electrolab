import { registerPlugin, Capacitor } from '@capacitor/core';

export interface ProStatusResult {
  isPro: boolean;
  isSubscription?: boolean;
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

export interface ProductDetailsResult {
  success: boolean;
  productId?: string;
  title?: string;
  description?: string;
  formattedPrice?: string;
  priceCurrencyCode?: string;
  error?: string;
}

interface GoogleBillingPlugin {
  checkProStatus(): Promise<ProStatusResult>;
  purchasePro(options?: { productId?: string; productType?: 'subs' | 'inapp' }): Promise<PurchaseResult>;
  getProductDetails(options?: { productId?: string; productType?: 'subs' | 'inapp' }): Promise<ProductDetailsResult>;
  restorePurchases(): Promise<ProStatusResult>;
}

// Register Native Capacitor Plugin
const NativeGoogleBilling = registerPlugin<GoogleBillingPlugin>('GoogleBilling');

export const BILLING_CONFIG = {
  MONTHLY_SUB_ID: 'electrolab_sub_monthly',
  LIFETIME_ID: 'electrolab_pro_lifetime',
  DEFAULT_SUB_PRICE: '₹49/month',
  DEFAULT_LIFETIME_PRICE: '₹299',
};

class BillingService {
  private isProCached: boolean = false;
  private isInitialized: boolean = false;
  private cachedPrice: string = BILLING_CONFIG.DEFAULT_SUB_PRICE;
  private listeners: ((isPro: boolean) => void)[] = [];

  public readonly PRODUCT_ID = BILLING_CONFIG.MONTHLY_SUB_ID;

  public get priceDisplay(): string {
    return this.cachedPrice;
  }

  /**
   * Initialize and perform real-time verification with Google Play.
   * Checks for both active subscriptions and lifetime purchases.
   */
  public async init(): Promise<boolean> {
    const status = await this.checkProStatus();
    this.isInitialized = true;
    
    // Attempt to load localized price from Google Play in background
    this.refreshProductDetails().catch(() => {});
    
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
   * Launch official Google Play Subscription flow (Monthly)
   */
  public async subscribeMonthly(): Promise<PurchaseResult> {
    return this.purchase(BILLING_CONFIG.MONTHLY_SUB_ID, 'subs');
  }

  /**
   * Launch official Google Play Lifetime Pass flow (Optional One-Time)
   */
  public async purchaseLifetime(): Promise<PurchaseResult> {
    return this.purchase(BILLING_CONFIG.LIFETIME_ID, 'inapp');
  }

  /**
   * Backward-compatible default purchase call
   */
  public async purchasePro(): Promise<PurchaseResult> {
    return this.subscribeMonthly();
  }

  private async purchase(productId: string, productType: 'subs' | 'inapp'): Promise<PurchaseResult> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeGoogleBilling.purchasePro({ productId, productType });
        if (res.success && res.isPro) {
          this.updateProState(true);
        }
        return res;
      } catch (err: any) {
        console.error('[BillingService] Native purchase error:', err);
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
   * Fetch localized price from Google Play
   */
  public async refreshProductDetails(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const details = await NativeGoogleBilling.getProductDetails({
          productId: BILLING_CONFIG.MONTHLY_SUB_ID,
          productType: 'subs',
        });
        if (details.success && details.formattedPrice) {
          this.cachedPrice = `${details.formattedPrice}/month`;
          return this.cachedPrice;
        }
      } catch (e) {
        console.warn('[BillingService] Could not fetch live price:', e);
      }
    }
    return this.cachedPrice;
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
   * Subscribe to Pro status changes (e.g. upon refund, cancel, or purchase)
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

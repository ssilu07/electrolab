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
  DEFAULT_SUB_PRICE: '$1.99/month',
  DEFAULT_LIFETIME_PRICE: '$9.99',
};

class BillingService {
  private isProCached: boolean = false;
  private isInitialized: boolean = false;
  private cachedPrice: string = BILLING_CONFIG.DEFAULT_SUB_PRICE;
  private cachedLifetimePrice: string = BILLING_CONFIG.DEFAULT_LIFETIME_PRICE;
  private listeners: ((isPro: boolean) => void)[] = [];
  private tempProExpiry: number = 0;
  private tempProTimer: any = null;

  public readonly PRODUCT_ID = BILLING_CONFIG.MONTHLY_SUB_ID;

  constructor() {
    this.restoreTempProState();
  }

  private restoreTempProState() {
    try {
      const saved = localStorage.getItem('electrolab_temp_pro_expiry');
      if (saved) {
        const expiry = parseInt(saved, 10);
        if (!isNaN(expiry) && expiry > Date.now()) {
          this.tempProExpiry = expiry;
          this.scheduleTempProExpiry(expiry - Date.now());
        } else {
          localStorage.removeItem('electrolab_temp_pro_expiry');
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  private scheduleTempProExpiry(delayMs: number) {
    if (this.tempProTimer) clearTimeout(this.tempProTimer);
    this.tempProTimer = setTimeout(() => {
      this.tempProExpiry = 0;
      try {
        localStorage.removeItem('electrolab_temp_pro_expiry');
      } catch {}
      this.updateProState(this.isRealPro);
    }, Math.max(100, delayMs));
  }

  public get priceDisplay(): string {
    return this.cachedPrice;
  }

  public get lifetimePriceDisplay(): string {
    return this.cachedLifetimePrice;
  }

  /**
   * Initialize and perform real-time verification with Google Play.
   * Checks for both active subscriptions and lifetime purchases.
   */
  public async init(): Promise<boolean> {
    await this.checkProStatus();
    this.isInitialized = true;
    
    // Attempt to load localized price from Google Play in background
    this.refreshProductDetails().catch(() => {});
    
    return this.isPro;
  }

  /**
   * Pro is active if Google Play subscription/lifetime is valid OR temporary pass is active
   */
  public get isPro(): boolean {
    return this.isProCached || (this.tempProExpiry > Date.now());
  }

  /**
   * Whether Pro is active permanently/subscription via Google Play
   */
  public get isRealPro(): boolean {
    return this.isProCached;
  }

  /**
   * Whether user is on a temporary Rewarded Ad pass
   */
  public get isTemporaryPro(): boolean {
    return !this.isProCached && (this.tempProExpiry > Date.now());
  }

  /**
   * Remaining minutes on temporary Pro pass
   */
  public get tempProRemainingMinutes(): number {
    if (!this.isTemporaryPro) return 0;
    return Math.max(1, Math.ceil((this.tempProExpiry - Date.now()) / (60 * 1000)));
  }

  /**
   * Grant temporary Pro pass (earned via Rewarded Video Ad)
   */
  public grantTemporaryPro(durationMinutes: number = 10): void {
    const expiry = Date.now() + durationMinutes * 60 * 1000;
    this.tempProExpiry = expiry;
    try {
      localStorage.setItem('electrolab_temp_pro_expiry', expiry.toString());
    } catch {}
    this.scheduleTempProExpiry(durationMinutes * 60 * 1000);
    this.updateProState(true);
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
        }

        const lifetimeDetails = await NativeGoogleBilling.getProductDetails({
          productId: BILLING_CONFIG.LIFETIME_ID,
          productType: 'inapp',
        });
        if (lifetimeDetails.success && lifetimeDetails.formattedPrice) {
          this.cachedLifetimePrice = lifetimeDetails.formattedPrice;
        }

        return this.cachedPrice;
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
    this.isProCached = newVal;
    const effectivePro = this.isPro;
    this.listeners.forEach((listener) => {
      try {
        listener(effectivePro);
      } catch (e) {
        console.error('[BillingService] Listener error:', e);
      }
    });
  }

  /**
   * Subscribe to Pro status changes (e.g. upon refund, cancel, or purchase)
   */
  public onProStatusChange(callback: (isPro: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.isPro);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const billingService = new BillingService();

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

// Smart regional currency detection (India vs US / UK / Tier-1 Global)
export const isIndianRegion = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return true;
    const lang = (typeof navigator !== 'undefined' && navigator.language) || '';
    if (lang.includes('hi') || lang.endsWith('-IN') || lang.includes('_IN')) return true;
  } catch {}
  return false; // Default to Tier-1 / Global pricing ($1.99/mo, $9.99 lifetime)
};

export const BILLING_CONFIG = {
  MONTHLY_SUB_ID: 'electrolab_sub_monthly',
  LIFETIME_ID: 'electrolab_pro_lifetime',
  // Tier-1 (US/UK) stays identical to original ($1.99/mo and $9.99 lifetime), India gets affordable pricing (₹49/mo and ₹99 lifetime)
  DEFAULT_SUB_PRICE: isIndianRegion() ? '₹49/month' : '$1.99/month',
  DEFAULT_LIFETIME_PRICE: isIndianRegion() ? '₹99' : '$9.99',
  ORIGINAL_LIFETIME_PRICE: isIndianRegion() ? '₹499' : '$19.99',
  CURRENCY_SYMBOL: isIndianRegion() ? '₹' : '$',
};

class BillingService {
  private isProCached: boolean = false;
  private isInitialized: boolean = false;
  private cachedPrice: string = BILLING_CONFIG.DEFAULT_SUB_PRICE;
  private cachedLifetimePrice: string = BILLING_CONFIG.DEFAULT_LIFETIME_PRICE;
  private listeners: ((isPro: boolean) => void)[] = [];

  public readonly PRODUCT_ID = BILLING_CONFIG.MONTHLY_SUB_ID;

  constructor() {
    this.restoreTempProState();
  }

  private restoreTempProState() {
    try {
      // Clear legacy temporary pass to prevent ad-loop bypassing purchases
      localStorage.removeItem('electrolab_temp_pro_expiry');
    } catch {
      // ignore storage errors
    }
  }

  public get priceDisplay(): string {
    return this.cachedPrice;
  }

  public get lifetimePriceDisplay(): string {
    return this.cachedLifetimePrice;
  }

  public get originalPriceDisplay(): string {
    return BILLING_CONFIG.ORIGINAL_LIFETIME_PRICE;
  }

  public get isIndia(): boolean {
    return isIndianRegion();
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
   * Pro is active strictly via verified Google Play subscription or lifetime purchase
   */
  public get isPro(): boolean {
    return this.isProCached;
  }

  /**
   * Whether Pro is active permanently/subscription via Google Play
   */
  public get isRealPro(): boolean {
    return this.isProCached;
  }

  /**
   * Temporary Pro is discontinued to prevent ad loop cannibalizing sales
   */
  public get isTemporaryPro(): boolean {
    return false;
  }

  /**
   * Remaining minutes on temporary Pro pass
   */
  public get tempProRemainingMinutes(): number {
    return 0;
  }

  /**
   * Legacy method kept for interface compatibility
   */
  public grantTemporaryPro(_durationMinutes: number = 10): void {
    // Deprecated to prevent bypassing sales
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

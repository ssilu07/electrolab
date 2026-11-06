import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { billingService } from './billingService';

/**
 * AdMob Configuration
 *
 * Current IDs: Official Google AdMob Test Unit IDs
 * When real IDs are available, replace the values in REAL_ADS and set IS_TEST_MODE to false.
 */
export const ADMOB_CONFIG = {
  // Production Real AdMob IDs enabled
  IS_TEST_MODE: false,

  TEST_ADS: {
    APP_ID: 'ca-app-pub-3940256099942544~3347511713',
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  },

  REAL_ADS: {
    APP_ID: 'ca-app-pub-1811294933992844~6117661601',
    BANNER: 'ca-app-pub-1811294933992844/4495644082',
    INTERSTITIAL: 'ca-app-pub-1811294933992844/4595716431',
    REWARDED: 'ca-app-pub-1811294933992844/3403868351',
  },
};

class AdService {
  private isInitialized = false;
  private isBannerVisible = false;
  private isInterstitialPrepared = false;
  private isRewardedPrepared = false;
  private lastInterstitialTime = 0;
  private readonly INTERSTITIAL_COOLDOWN_MS = 60 * 1000; // 60s minimum interval

  public get bannerAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.BANNER : ADMOB_CONFIG.REAL_ADS.BANNER;
  }

  public get interstitialAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.INTERSTITIAL : ADMOB_CONFIG.REAL_ADS.INTERSTITIAL;
  }

  public get rewardedAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.REWARDED : ADMOB_CONFIG.REAL_ADS.REWARDED;
  }

  /**
   * Update Real IDs whenever the user provides them
   */
  public setRealIds(ids: { appId?: string; banner?: string; interstitial?: string; rewarded?: string }, enableProduction = true) {
    if (ids.appId) ADMOB_CONFIG.REAL_ADS.APP_ID = ids.appId;
    if (ids.banner) ADMOB_CONFIG.REAL_ADS.BANNER = ids.banner;
    if (ids.interstitial) ADMOB_CONFIG.REAL_ADS.INTERSTITIAL = ids.interstitial;
    if (ids.rewarded) ADMOB_CONFIG.REAL_ADS.REWARDED = ids.rewarded;
    ADMOB_CONFIG.IS_TEST_MODE = !enableProduction;
    console.log('[AdService] Real AdMob IDs configured, Test Mode:', ADMOB_CONFIG.IS_TEST_MODE);
  }

  /**
   * Initialize AdMob SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // Check Pro status: If Pro, no ads should ever be loaded
    if (billingService.isPro) {
      console.log('[AdService] User has Lifetime Pro. Ads disabled.');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService] Web environment: AdMob simulated mode active.');
      this.isInitialized = true;
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });

      // Listen for AdMob events
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('[AdService] Banner ad loaded successfully.');
        this.isBannerVisible = true;
      });

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
        console.warn('[AdService] Banner failed to load:', err);
        this.isBannerVisible = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        console.log('[AdService] Interstitial ad loaded.');
        this.isInterstitialPrepared = true;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('[AdService] Interstitial dismissed.');
        this.isInterstitialPrepared = false;
        // Preload next interstitial in background
        this.prepareInterstitial().catch(() => {});
      });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('[AdService] Rewarded video loaded.');
        this.isRewardedPrepared = true;
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('[AdService] Rewarded video dismissed.');
        this.isRewardedPrepared = false;
        // Preload next rewarded ad in background
        this.prepareRewarded().catch(() => {});
      });

      // Watch for Pro status changes — hide banners immediately upon upgrade
      billingService.onProStatusChange((isPro) => {
        if (isPro) {
          this.removeBanner().catch(() => {});
        }
      });

      this.isInitialized = true;
      console.log('[AdService] AdMob initialized successfully.');

      // Preload interstitial and rewarded ads in advance
      this.prepareInterstitial().catch(() => {});
      this.prepareRewarded().catch(() => {});
    } catch (error) {
      console.error('[AdService] Error during AdMob initialization:', error);
    }
  }

  /**
   * Display Banner Ad
   * @param position BannerAdPosition (default: BOTTOM_CENTER)
   */
  public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (billingService.isPro) return;

    if (!Capacitor.isNativePlatform()) {
      console.log(`[AdService Mock] Banner displayed at ${position}`);
      this.isBannerVisible = true;
      return;
    }

    try {
      if (!this.isInitialized) {
        await this.init();
      }

      await AdMob.showBanner({
        adId: this.bannerAdId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
        margin: position === BannerAdPosition.BOTTOM_CENTER ? 56 : 0,
      });
      this.isBannerVisible = true;
    } catch (err) {
      console.warn('[AdService] Failed to show banner ad:', err);
    }
  }

  /**
   * Hide Banner Ad without destroying it
   */
  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.isBannerVisible = false;
      return;
    }

    try {
      if (this.isBannerVisible) {
        await AdMob.hideBanner();
        this.isBannerVisible = false;
      }
    } catch (err) {
      console.warn('[AdService] Failed to hide banner ad:', err);
    }
  }

  /**
   * Resume/Show Banner Ad after hiding
   */
  public async resumeBanner(): Promise<void> {
    if (billingService.isPro) return;

    if (!Capacitor.isNativePlatform()) {
      this.isBannerVisible = true;
      return;
    }

    try {
      await AdMob.resumeBanner();
      this.isBannerVisible = true;
    } catch (_err) {
      // If resume fails, attempt showBanner
      await this.showBanner();
    }
  }

  /**
   * Remove and destroy the banner ad completely
   */
  public async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.isBannerVisible = false;
      return;
    }

    try {
      await AdMob.removeBanner();
      this.isBannerVisible = false;
    } catch (err) {
      console.warn('[AdService] Failed to remove banner ad:', err);
    }
  }

  /**
   * Preload an Interstitial Ad
   */
  public async prepareInterstitial(): Promise<void> {
    if (billingService.isPro || !Capacitor.isNativePlatform()) return;

    try {
      await AdMob.prepareInterstitial({
        adId: this.interstitialAdId,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      this.isInterstitialPrepared = true;
    } catch (err) {
      console.warn('[AdService] Failed to prepare interstitial:', err);
      this.isInterstitialPrepared = false;
    }
  }

  /**
   * Show Interstitial Ad (with cooldown protection to prevent user annoyance)
   * @param force Bypass cooldown check (e.g. for level completion or preset change)
   */
  public async showInterstitial(force = false): Promise<boolean> {
    if (billingService.isPro) return false;

    const now = Date.now();
    if (!force && now - this.lastInterstitialTime < this.INTERSTITIAL_COOLDOWN_MS) {
      console.log('[AdService] Interstitial skipped due to cooldown.');
      return false;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService Mock] Interstitial ad shown (dev simulation).');
      this.lastInterstitialTime = now;
      return true;
    }

    try {
      if (!this.isInterstitialPrepared) {
        await this.prepareInterstitial();
      }
      await AdMob.showInterstitial();
      this.lastInterstitialTime = now;
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to show interstitial:', err);
      // Try preloading for next opportunity
      this.prepareInterstitial().catch(() => {});
      return false;
    }
  }

  /**
   * Preload a Rewarded Video Ad
   */
  public async prepareRewarded(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.prepareRewardVideoAd({
        adId: this.rewardedAdId,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      this.isRewardedPrepared = true;
    } catch (err) {
      console.warn('[AdService] Failed to prepare rewarded ad:', err);
      this.isRewardedPrepared = false;
    }
  }

  /**
   * Show Rewarded Video Ad and execute reward callback
   * @returns true if user earned the reward, false otherwise
   */
  public async showRewardVideo(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService Mock] Rewarded video completed (dev simulation). User rewarded!');
      return true;
    }

    try {
      if (!this.isRewardedPrepared) {
        await this.prepareRewarded();
      }
      const rewardItem = await AdMob.showRewardVideoAd();
      console.log('[AdService] User earned reward:', rewardItem);
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to display rewarded video:', err);
      this.prepareRewarded().catch(() => {});
      return false;
    }
  }
}

export const adService = new AdService();

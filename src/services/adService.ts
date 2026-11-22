import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  type AdMobBannerSize,
} from '@capacitor-community/admob';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { billingService } from './billingService';

/**
 * AdMob Configuration
 *
 * Production Real AdMob IDs enabled.
 * Set IS_TEST_MODE to true during local device testing so real ads are never clicked.
 */
export const ADMOB_CONFIG = {
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

type AdFormatKey = 'banner' | 'interstitial' | 'rewarded';
export type RewardFailureReason = 'offline' | 'unavailable' | 'dismissed' | null;

interface BackoffState {
  consecutiveFailures: number;
  nextAllowedAt: number;
}

export interface BannerMetrics {
  rawHeight: number;
  safeOffset: number;
}

type BannerHeightListener = (metrics: BannerMetrics) => void;

const BACKOFF_SCHEDULE_MS = [30_000, 120_000, 300_000, 900_000]; // 30s -> 2m -> 5m -> 15m
const BANNER_SAFE_BUFFER_PX = 14; // Dedicated visual + touch dead-zone above native banner
const DEFAULT_BANNER_FALLBACK_HEIGHT_PX = 50;

class AdService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private isAppActive = true;
  private readonly sessionStartTime = Date.now();

  // Banner state
  private isBannerCreated = false;
  private isBannerVisible = false;
  private isBannerLoading = false;
  private bannerRawHeight = 0;
  private activeOverlays = new Set<string>();
  private bannerHeightListeners = new Set<BannerHeightListener>();

  // Interstitial state
  private isInterstitialPrepared = false;
  private isPreparingInterstitial = false;
  private isShowingInterstitial = false;
  private lastInterstitialTime = 0;
  private readonly MIN_SESSION_BEFORE_INTERSTITIAL_MS = 20_000; // Skip short-bounce sessions
  private readonly INTERSTITIAL_COOLDOWN_MS = 60_000; // 60s healthy interval for utility apps

  // Rewarded state
  private isRewardedPrepared = false;
  private isPreparingRewarded = false;
  private isShowingRewarded = false;
  private userEarnedReward = false;
  private lastRewardFailureReason: RewardFailureReason = null;
  private rewardSettlementResolver: ((earned: boolean) => void) | null = null;

  // Per-format exponential backoff to prevent failed-request loops (e.g. Russia / offline / no-fill)
  private backoff: Record<AdFormatKey, BackoffState> = {
    banner: { consecutiveFailures: 0, nextAllowedAt: 0 },
    interstitial: { consecutiveFailures: 0, nextAllowedAt: 0 },
    rewarded: { consecutiveFailures: 0, nextAllowedAt: 0 },
  };

  public get bannerAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.BANNER : ADMOB_CONFIG.REAL_ADS.BANNER;
  }

  public get interstitialAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.INTERSTITIAL : ADMOB_CONFIG.REAL_ADS.INTERSTITIAL;
  }

  public get rewardedAdId(): string {
    return ADMOB_CONFIG.IS_TEST_MODE ? ADMOB_CONFIG.TEST_ADS.REWARDED : ADMOB_CONFIG.REAL_ADS.REWARDED;
  }

  public get isRewardedReady(): boolean {
    return this.isRewardedPrepared;
  }

  public get isInterstitialReady(): boolean {
    return this.isInterstitialPrepared;
  }

  public getLastRewardFailureReason(): RewardFailureReason {
    return this.lastRewardFailureReason;
  }

  public getBannerMetrics(): BannerMetrics {
    const rawHeight = this.isBannerVisible ? this.bannerRawHeight : 0;
    const safeOffset = rawHeight > 0 ? rawHeight + BANNER_SAFE_BUFFER_PX : 0;
    return { rawHeight, safeOffset };
  }

  public onBannerHeightChange(listener: BannerHeightListener): () => void {
    this.bannerHeightListeners.add(listener);
    listener(this.getBannerMetrics());
    return () => {
      this.bannerHeightListeners.delete(listener);
    };
  }

  private isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine !== false;
  }

  private canAttemptLoad(format: AdFormatKey): boolean {
    if (!this.isAppActive) return false;
    if (!this.isOnline()) return false;
    return Date.now() >= this.backoff[format].nextAllowedAt;
  }

  private recordLoadSuccess(format: AdFormatKey): void {
    this.backoff[format].consecutiveFailures = 0;
    this.backoff[format].nextAllowedAt = 0;
  }

  private recordLoadFailure(format: AdFormatKey): void {
    const state = this.backoff[format];
    const idx = Math.min(state.consecutiveFailures, BACKOFF_SCHEDULE_MS.length - 1);
    const delayMs = BACKOFF_SCHEDULE_MS[idx];
    state.consecutiveFailures += 1;
    state.nextAllowedAt = Date.now() + delayMs;
    console.warn(
      `[AdService] ${format} load failure #${state.consecutiveFailures}. Backing off for ${Math.round(delayMs / 1000)}s.`
    );
  }

  private syncBannerCssVariables(rawHeight: number): void {
    const normalized = Math.max(0, Math.round(rawHeight));
    const safeOffset = normalized > 0 ? normalized + BANNER_SAFE_BUFFER_PX : 0;

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--ad-banner-raw-height', `${normalized}px`);
      root.style.setProperty('--ad-banner-height', `${safeOffset}px`);
    }

    const metrics: BannerMetrics = { rawHeight: normalized, safeOffset };
    this.bannerHeightListeners.forEach((cb) => {
      try {
        cb(metrics);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  /**
   * Check whether an interstitial ad is eligible to be shown right now
   */
  public canShowInterstitial(ignoreSessionWarmup = false): boolean {
    if (billingService.isPro) return false;
    if (this.isShowingInterstitial || this.isShowingRewarded) return false;

    const now = Date.now();
    if (!ignoreSessionWarmup && now - this.sessionStartTime < this.MIN_SESSION_BEFORE_INTERSTITIAL_MS) {
      return false;
    }
    if (this.lastInterstitialTime > 0 && now - this.lastInterstitialTime < this.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }
    return true;
  }

  /**
   * Update Real IDs whenever the user provides them
   */
  public setRealIds(
    ids: { appId?: string; banner?: string; interstitial?: string; rewarded?: string },
    enableProduction = true
  ): void {
    if (ids.appId) ADMOB_CONFIG.REAL_ADS.APP_ID = ids.appId;
    if (ids.banner) ADMOB_CONFIG.REAL_ADS.BANNER = ids.banner;
    if (ids.interstitial) ADMOB_CONFIG.REAL_ADS.INTERSTITIAL = ids.interstitial;
    if (ids.rewarded) ADMOB_CONFIG.REAL_ADS.REWARDED = ids.rewarded;
    ADMOB_CONFIG.IS_TEST_MODE = !enableProduction;
    console.log('[AdService] Real AdMob IDs configured, Test Mode:', ADMOB_CONFIG.IS_TEST_MODE);
  }

  /**
   * Initialize AdMob SDK (guarded against duplicate init calls)
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInit();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async performInit(): Promise<void> {
    if (billingService.isPro) {
      console.log('[AdService] User has Pro. Ads disabled.');
      this.syncBannerCssVariables(0);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService] Web environment: AdMob simulated mode active.');
      this.isInitialized = true;
      this.syncBannerCssVariables(0);
      return;
    }

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });

      // Track app foreground/background state so we never load ads in background
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        this.isAppActive = isActive;
      }).catch(() => {});

      // Banner listeners — dynamically drive layout safe-zone so UI NEVER overlaps banner
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: AdMobBannerSize) => {
        const h = Math.max(0, Math.round(info?.height ?? 0));
        this.bannerRawHeight = h;
        if (h > 0 && this.activeOverlays.size === 0 && !billingService.isPro) {
          this.isBannerVisible = true;
          this.syncBannerCssVariables(h);
        } else if (h === 0) {
          this.isBannerVisible = false;
          this.syncBannerCssVariables(0);
        }
      });

      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('[AdService] Banner ad loaded successfully.');
        this.isBannerLoading = false;
        this.recordLoadSuccess('banner');

        if (this.activeOverlays.size > 0 || billingService.isPro) {
          // Overlay opened while banner was still loading — hide immediately to prevent overlap
          this.hideBanner().catch(() => {});
          return;
        }

        this.isBannerVisible = true;
        const effectiveHeight = this.bannerRawHeight > 0 ? this.bannerRawHeight : DEFAULT_BANNER_FALLBACK_HEIGHT_PX;
        this.syncBannerCssVariables(effectiveHeight);
      });

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
        console.warn('[AdService] Banner failed to load:', err);
        this.isBannerLoading = false;
        this.isBannerVisible = false;
        this.bannerRawHeight = 0;
        this.recordLoadFailure('banner');
        this.syncBannerCssVariables(0);
      });

      // Interstitial listeners
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        console.log('[AdService] Interstitial ad loaded.');
        this.isInterstitialPrepared = true;
        this.isPreparingInterstitial = false;
        this.recordLoadSuccess('interstitial');
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err) => {
        console.warn('[AdService] Interstitial failed to load:', err);
        this.isInterstitialPrepared = false;
        this.isPreparingInterstitial = false;
        this.recordLoadFailure('interstitial');
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err) => {
        console.warn('[AdService] Interstitial failed to show:', err);
        this.isInterstitialPrepared = false;
        this.isShowingInterstitial = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('[AdService] Interstitial dismissed.');
        this.isInterstitialPrepared = false;
        this.isPreparingInterstitial = false;
        this.isShowingInterstitial = false;
        // Intentionally do NOT auto-preload here: prevents wasted loads when user exits after an ad.
      });

      // Rewarded Video listeners
      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('[AdService] Rewarded video loaded.');
        this.isRewardedPrepared = true;
        this.isPreparingRewarded = false;
        this.recordLoadSuccess('rewarded');
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
        console.warn('[AdService] Rewarded video failed to load:', err);
        this.isRewardedPrepared = false;
        this.isPreparingRewarded = false;
        this.recordLoadFailure('rewarded');
      });

      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        console.log('[AdService] RewardAdPluginEvents.Rewarded received:', reward);
        this.userEarnedReward = true;
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
        console.warn('[AdService] Rewarded video failed to show:', err);
        this.isRewardedPrepared = false;
        this.isShowingRewarded = false;
        this.lastRewardFailureReason = 'unavailable';
        if (this.rewardSettlementResolver) {
          const resolve = this.rewardSettlementResolver;
          this.rewardSettlementResolver = null;
          resolve(false);
        }
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        console.log('[AdService] Rewarded video dismissed.');
        this.isRewardedPrepared = false;
        this.isPreparingRewarded = false;
        this.isShowingRewarded = false;
        // Brief grace tick so Rewarded event arriving just before/with Dismissed is captured
        if (this.rewardSettlementResolver) {
          setTimeout(() => {
            if (this.rewardSettlementResolver) {
              const resolve = this.rewardSettlementResolver;
              this.rewardSettlementResolver = null;
              if (!this.userEarnedReward) {
                this.lastRewardFailureReason = 'dismissed';
              }
              resolve(this.userEarnedReward);
            }
          }, 150);
        }
      });

      // Watch for Pro status changes — immediately destroy banner on Pro upgrade
      billingService.onProStatusChange((isPro) => {
        if (isPro) {
          this.removeBanner().catch(() => {});
        }
      });

      this.isInitialized = true;
      console.log('[AdService] AdMob initialized successfully (high show-rate & zero-overlap mode).');
    } catch (error) {
      console.error('[AdService] Error during AdMob initialization:', error);
    }
  }

  /**
   * Pause/hide banner while full-screen modals are open so the native AdView
   * can NEVER overlap modal buttons or cause accidental clicks.
   */
  public async setOverlayOpen(overlayId: string, isOpen: boolean): Promise<void> {
    const hadOverlays = this.activeOverlays.size > 0;
    if (isOpen) {
      this.activeOverlays.add(overlayId);
    } else {
      this.activeOverlays.delete(overlayId);
    }
    const hasOverlays = this.activeOverlays.size > 0;

    if (!hadOverlays && hasOverlays) {
      await this.hideBanner();
    } else if (hadOverlays && !hasOverlays && !billingService.isPro) {
      await this.resumeBanner();
    }
  }

  /**
   * Display Anchored Adaptive Banner strictly at the absolute bottom edge (margin: 0).
   * All interactive UI lifts above `--ad-banner-height` with a 14px touch dead-zone.
   */
  public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (billingService.isPro) return;
    if (this.activeOverlays.size > 0) return;

    if (!Capacitor.isNativePlatform()) {
      this.isBannerVisible = false;
      this.syncBannerCssVariables(0);
      return;
    }

    if (this.isBannerCreated) {
      if (!this.isBannerVisible) {
        await this.resumeBanner();
      }
      return;
    }

    if (this.isBannerLoading || !this.canAttemptLoad('banner')) {
      return;
    }

    this.isBannerLoading = true;
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (billingService.isPro || this.activeOverlays.size > 0 || !this.isInitialized) {
        this.isBannerLoading = false;
        return;
      }

      await AdMob.showBanner({
        adId: this.bannerAdId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
        margin: 0,
      });
      this.isBannerCreated = true;
      this.isBannerVisible = true;
    } catch (err) {
      console.warn('[AdService] Failed to show banner ad:', err);
      this.isBannerLoading = false;
      this.isBannerVisible = false;
      this.recordLoadFailure('banner');
      this.syncBannerCssVariables(0);
    }
  }

  /**
   * Hide Banner Ad without destroying it (also pauses background ad refresh)
   */
  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.isBannerVisible = false;
      this.syncBannerCssVariables(0);
      return;
    }

    if (!this.isBannerCreated) {
      this.isBannerVisible = false;
      this.syncBannerCssVariables(0);
      return;
    }

    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
      this.syncBannerCssVariables(0);
    } catch (err) {
      console.warn('[AdService] Failed to hide banner ad:', err);
      this.isBannerVisible = false;
      this.syncBannerCssVariables(0);
    }
  }

  /**
   * Resume Banner Ad after modals close
   */
  public async resumeBanner(): Promise<void> {
    if (billingService.isPro) return;
    if (this.activeOverlays.size > 0) return;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (!this.isBannerCreated) {
      await this.showBanner();
      return;
    }

    try {
      await AdMob.resumeBanner();
      this.isBannerVisible = true;
      const effectiveHeight = this.bannerRawHeight > 0 ? this.bannerRawHeight : DEFAULT_BANNER_FALLBACK_HEIGHT_PX;
      this.syncBannerCssVariables(effectiveHeight);
    } catch {
      this.isBannerCreated = false;
      await this.showBanner();
    }
  }

  /**
   * Remove and destroy the banner ad completely
   */
  public async removeBanner(): Promise<void> {
    this.isBannerCreated = false;
    this.isBannerVisible = false;
    this.isBannerLoading = false;
    this.bannerRawHeight = 0;
    this.syncBannerCssVariables(0);

    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.removeBanner();
    } catch (err) {
      console.warn('[AdService] Failed to remove banner ad:', err);
    }
  }

  /**
   * Preload an Interstitial Ad (guarded by backoff, online check, and duplicate-request lock)
   */
  public async prepareInterstitial(): Promise<boolean> {
    if (billingService.isPro || !Capacitor.isNativePlatform()) return false;
    if (this.isInterstitialPrepared) return true;
    if (this.isPreparingInterstitial) return false;
    if (!this.canAttemptLoad('interstitial')) return false;

    if (!this.isInitialized) {
      await this.init();
      if (!this.isInitialized) return false;
    }

    this.isPreparingInterstitial = true;
    try {
      await AdMob.prepareInterstitial({
        adId: this.interstitialAdId,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      this.isInterstitialPrepared = true;
      this.isPreparingInterstitial = false;
      this.recordLoadSuccess('interstitial');
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to prepare interstitial:', err);
      this.isInterstitialPrepared = false;
      this.isPreparingInterstitial = false;
      this.recordLoadFailure('interstitial');
      return false;
    }
  }

  /**
   * Engagement-gated Just-In-Time Interstitial Warmup.
   * Call ONLY when the user enters a high-intent flow (opening Presets/RealLab/Share modal,
   * reaching screen switch #2, or winning a challenge) so nearly every loaded ad is shown.
   */
  public async warmInterstitial(reason = 'high_intent'): Promise<boolean> {
    if (billingService.isPro || !Capacitor.isNativePlatform()) return false;
    if (this.isInterstitialPrepared || this.isPreparingInterstitial) return this.isInterstitialPrepared;
    if (!this.canShowInterstitial(reason === 'modal_open' || reason === 'challenge_victory')) {
      return false;
    }
    if (!this.canAttemptLoad('interstitial')) return false;

    console.log(`[AdService] Warming interstitial just-in-time (${reason})`);
    return this.prepareInterstitial();
  }

  /**
   * Show Interstitial Ad.
   * High Show-Rate & Zero-Surprise Strategy:
   * - If an ad is already prepared, show it instantaneously (0ms wait).
   * - If not prepared yet, warm it quietly in the background for the NEXT natural break
   *   so slow networks (10-30s latency) never pop a surprise ad while the user is wiring.
   */
  public async showInterstitial(force = false): Promise<boolean> {
    if (billingService.isPro) return false;
    if (this.isShowingInterstitial || this.isShowingRewarded) return false;

    const now = Date.now();
    if (!force && !this.canShowInterstitial()) {
      return false;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService Mock] Interstitial ad shown (dev simulation).');
      this.lastInterstitialTime = now;
      return true;
    }

    if (!this.isInterstitialPrepared) {
      // Warm quietly for the next natural break rather than stalling UI on slow networks
      this.prepareInterstitial().catch(() => {});
      return false;
    }

    this.isShowingInterstitial = true;
    try {
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      this.isInterstitialPrepared = false;
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to show interstitial:', err);
      this.isInterstitialPrepared = false;
      return false;
    } finally {
      this.isShowingInterstitial = false;
    }
  }

  /**
   * Safe Interstitial Trigger for natural break points (Run/Stop simulation, Save/Export, Preset load).
   */
  public async triggerNaturalBreakInterstitial(reason = 'general'): Promise<boolean> {
    if (billingService.isPro) return false;
    console.log(`[AdService] Evaluating interstitial for natural break: ${reason}`);
    return this.showInterstitial(false);
  }

  /**
   * Preload a Rewarded Video Ad strictly on-demand (called inside showRewardVideo).
   */
  public async prepareRewarded(): Promise<boolean> {
    if (billingService.isPro) return false;
    if (!Capacitor.isNativePlatform()) return true;
    if (this.isRewardedPrepared) return true;
    if (this.isPreparingRewarded) return false;
    if (!this.canAttemptLoad('rewarded')) return false;

    if (!this.isInitialized) {
      await this.init();
      if (!this.isInitialized) return false;
    }

    this.isPreparingRewarded = true;
    try {
      await AdMob.prepareRewardVideoAd({
        adId: this.rewardedAdId,
        isTesting: ADMOB_CONFIG.IS_TEST_MODE,
      });
      this.isRewardedPrepared = true;
      this.isPreparingRewarded = false;
      this.recordLoadSuccess('rewarded');
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to prepare rewarded ad:', err);
      this.isRewardedPrepared = false;
      this.isPreparingRewarded = false;
      this.recordLoadFailure('rewarded');
      return false;
    }
  }

  /**
   * Strictly On-Demand Rewarded Video flow (eliminates 0% show rate from speculative preloads).
   * Resolves `true` ONLY when the user earns the reward; resolves `false` cleanly if dismissed early or unavailable.
   */
  public async showRewardVideo(): Promise<boolean> {
    this.userEarnedReward = false;
    this.lastRewardFailureReason = null;

    if (!Capacitor.isNativePlatform()) {
      console.log('[AdService Mock] Rewarded video completed (dev simulation). User rewarded!');
      this.userEarnedReward = true;
      return true;
    }

    if (!this.isOnline()) {
      this.lastRewardFailureReason = 'offline';
      return false;
    }

    if (this.isShowingRewarded) return false;

    try {
      if (!this.isRewardedPrepared) {
        const prepared = await this.prepareRewarded();
        if (!prepared) {
          this.lastRewardFailureReason = 'unavailable';
          return false;
        }
      }

      this.isShowingRewarded = true;

      // Race native reward promise against Dismissed/FailedToShow so closing early never hangs the UI
      const earned = await new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (result: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          this.rewardSettlementResolver = null;
          resolve(result);
        };

        const safetyTimer = setTimeout(() => {
          if (!this.userEarnedReward) {
            this.lastRewardFailureReason = 'unavailable';
          }
          finish(this.userEarnedReward);
        }, 90_000);

        this.rewardSettlementResolver = finish;

        AdMob.showRewardVideoAd()
          .then((rewardItem) => {
            const gotReward = Boolean(rewardItem && (rewardItem.amount > 0 || rewardItem.type)) || this.userEarnedReward;
            this.userEarnedReward = gotReward;
            finish(gotReward);
          })
          .catch((err) => {
            console.warn('[AdService] showRewardVideoAd rejected:', err);
            this.lastRewardFailureReason = 'unavailable';
            finish(false);
          });
      });

      this.isRewardedPrepared = false;
      this.isShowingRewarded = false;
      return earned;
    } catch (err) {
      console.warn('[AdService] Failed to display rewarded video:', err);
      this.isRewardedPrepared = false;
      this.isShowingRewarded = false;
      this.lastRewardFailureReason = 'unavailable';
      return false;
    }
  }
}

export const adService = new AdService();

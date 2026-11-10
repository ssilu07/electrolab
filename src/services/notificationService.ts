import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  target?: 'challenge' | 'preset' | 'instruments' | 'view_mode' | 'circuit';
  level?: number;
  presetId?: string;
  tool?: 'multimeter' | 'scope';
  mode?: '3d' | 'workbench' | 'stress_test';
  action?: string;
}

export interface DailyReminderContent {
  title: string;
  body: string;
  extra: NotificationPayload;
}

/**
 * Curated pool of high-engagement, educational & curiosity-driven
 * daily notifications designed to maximize retention & DAU.
 */
export const DAILY_NOTIFICATION_POOL: DailyReminderContent[] = [
  {
    title: '⚡ Daily Circuit Challenge!',
    body: 'Can you solve today\'s voltage divider puzzle without burning any resistors? Tap to test!',
    extra: { target: 'challenge', level: 0 },
  },
  {
    title: '💡 Secret of the 555 Timer IC',
    body: 'Did you know 555 timers power millions of timing circuits? Inspect the internal flip-flop live.',
    extra: { target: 'preset', presetId: '555_astable' },
  },
  {
    title: '💣 Will It Blow? Lab Stress Test',
    body: 'What happens when 24V hits a 6V capacitor? Test extreme overvoltage safely in ElectroLab!',
    extra: { target: 'circuit', mode: 'stress_test', action: 'stress_test' },
  },
  {
    title: '🔬 Oscilloscope Signal Mastery',
    body: 'Capture AC ripples and observe real-time sine waveforms with your virtual dual-channel scope.',
    extra: { target: 'instruments', tool: 'scope' },
  },
  {
    title: '🔥 Keep Your Lab Streak Alive!',
    body: 'Don\'t break your daily engineering streak! Complete today\'s 1-minute breadboard setup.',
    extra: { target: 'challenge', level: 1 },
  },
  {
    title: '🔌 Logic Gate Brain Teaser',
    body: 'Build an XOR gate using only NAND gates. Can you complete the schematic in under 2 minutes?',
    extra: { target: 'challenge', level: 2 },
  },
  {
    title: '✨ 3D Workbench Inspection',
    body: 'Rotate your breadboard in realistic 3D space and trace live electron particle currents.',
    extra: { target: 'view_mode', mode: '3d' },
  },
  {
    title: '🔋 Why Do LEDs Burn Out?',
    body: 'Learn how forward voltage and thermal dissipation work with live visual burnout effects.',
    extra: { target: 'preset', presetId: 'led_resistor' },
  },
  {
    title: '🎧 Audio Oscillator Experiment',
    body: 'Hear the audio pitch change as you dial the capacitor value in real-time sound synthesis.',
    extra: { target: 'preset', presetId: 'audio_oscillator' },
  },
  {
    title: '🧠 Wheatstone Bridge Mystery',
    body: 'Balance the resistor bridge until the center galvanometer reads exactly 0.000V!',
    extra: { target: 'challenge', level: 3 },
  },
  {
    title: '⚡ NPN Transistor Switch',
    body: 'A tiny microamp base current controls a heavy DC load! Inspect switching states on the breadboard.',
    extra: { target: 'preset', presetId: 'transistor_switch' },
  },
  {
    title: '🛠️ Virtual Multimeter Check',
    body: 'Test DC voltage, current, and continuity across circuit traces with virtual probes.',
    extra: { target: 'instruments', tool: 'multimeter' },
  },
  {
    title: '🏆 Emergency Fuse Challenge',
    body: 'Find and isolate the short-circuit before the power supply trips! Tap to launch.',
    extra: { target: 'challenge', level: 0 },
  },
  {
    title: '🌟 Level-Up Your Circuit Lab',
    body: 'Your workbench is ready. Explore advanced ICs and save your custom schematics today.',
    extra: { target: 'preset', presetId: 'voltage_divider' },
  },
];

const CHANNEL_ID = 'electrolab_daily_reminders';
const NOTIFICATION_ID_BASE = 2000;
const SETTINGS_KEY = 'electrolab_notifications_enabled';
const LAST_SCHEDULE_KEY = 'electrolab_last_notification_schedule_time';

class NotificationService {
  private isInitialized = false;
  private actionListeners: ((payload: NotificationPayload) => void)[] = [];

  /**
   * Check if notifications are enabled in local app preferences (defaults to true)
   */
  public isEnabled(): boolean {
    const val = localStorage.getItem(SETTINGS_KEY);
    return val === null ? true : val === 'true';
  }

  /**
   * Set user preference for daily notifications
   */
  public async setEnabled(enabled: boolean): Promise<void> {
    localStorage.setItem(SETTINGS_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      await this.cancelAllScheduled();
    } else {
      await this.scheduleDailyReminders(true);
    }
  }

  /**
   * Register a callback listener when a notification is tapped
   */
  public onAction(callback: (payload: NotificationPayload) => void): () => void {
    this.actionListeners.push(callback);
    return () => {
      this.actionListeners = this.actionListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Initialize notification system and ensure daily reminders are scheduled
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!Capacitor.isNativePlatform()) {
      console.log('[NotificationService] Running in Web environment (simulated mode).');
      return;
    }

    try {
      // 1. Create Android Notification Channel
      await this.createNotificationChannel();

      // 2. Setup Action listener for taps
      await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        try {
          console.log('[NotificationService] Notification tapped:', notificationAction);
          const extra = notificationAction.notification.extra as NotificationPayload | undefined;
          if (extra) {
            this.actionListeners.forEach((cb) => {
              try {
                cb(extra);
              } catch (err) {
                console.error('[NotificationService] Listener error:', err);
              }
            });
          }
        } catch (e) {
          console.error('[NotificationService] Error handling notification action:', e);
        }
      });

      // 3. Request permissions & schedule if enabled
      if (this.isEnabled()) {
        const hasPerm = await this.ensurePermissions();
        if (hasPerm) {
          await this.scheduleDailyReminders();
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Initialization error:', err);
    }
  }

  /**
   * Ensure notification channel exists on Android 8.0+
   */
  private async createNotificationChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Daily Lab Reminders & Challenges',
        description: 'Daily circuit puzzles, electronic tips, and laboratory experiments',
        importance: 4, // High importance (plays sound & displays banner)
        visibility: 1, // Public
        vibration: true,
      });
      console.log('[NotificationService] Channel created/verified:', CHANNEL_ID);
    } catch (e) {
      console.warn('[NotificationService] Channel creation note:', e);
    }
  }

  /**
   * Check & request runtime notification permission
   */
  public async ensurePermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return true;
      }
      if (check.display === 'prompt' || check.display === 'prompt-with-rationale') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return false;
    } catch (e) {
      console.warn('[NotificationService] Permission check error:', e);
      return false;
    }
  }

  /**
   * Schedule 14 days of unique, rotating daily reminders.
   * Trigger time is set to 19:30 (7:30 PM) local device time.
   * 7:30 PM local device time guarantees optimal user relaxation/study hours
   * across all timezones (US Eastern, US Pacific, India, Europe).
   */
  public async scheduleDailyReminders(force = false): Promise<void> {
    if (!this.isEnabled()) return;

    if (!Capacitor.isNativePlatform()) {
      console.log('[NotificationService] Simulated scheduling 14 days of daily reminders.');
      return;
    }

    try {
      const lastScheduleStr = localStorage.getItem(LAST_SCHEDULE_KEY);
      const now = new Date();

      // Avoid rescheduling if already scheduled within the last 3 days, unless forced
      if (!force && lastScheduleStr) {
        const lastSchedule = parseInt(lastScheduleStr, 10);
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (!isNaN(lastSchedule) && now.getTime() - lastSchedule < threeDaysMs) {
          const pending = await LocalNotifications.getPending();
          if (pending.notifications && pending.notifications.length >= 7) {
            console.log(`[NotificationService] ${pending.notifications.length} reminders already pending. Skipping reschedule.`);
            return;
          }
        }
      }

      // Cancel any old scheduled reminders to avoid duplicates
      await this.cancelAllScheduled();

      const notificationsToSchedule: LocalNotificationSchema[] = [];
      const daysCount = DAILY_NOTIFICATION_POOL.length;

      for (let i = 0; i < daysCount; i++) {
        const item = DAILY_NOTIFICATION_POOL[i];
        const scheduledDate = new Date();
        scheduledDate.setDate(now.getDate() + i);
        // Set target to 19:30 (7:30 PM) device local time
        scheduledDate.setHours(19, 30, 0, 0);

        // If today's 19:30 has already passed, shift day 0 to tomorrow 19:30
        if (scheduledDate.getTime() <= now.getTime()) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        notificationsToSchedule.push({
          id: NOTIFICATION_ID_BASE + i,
          title: item.title,
          body: item.body,
          channelId: CHANNEL_ID,
          schedule: {
            at: scheduledDate,
            allowWhileIdle: true,
          },
          isExactNotification: false, // Inexact alarm (battery-friendly & fully Google Play compliant)
          extra: item.extra,
        });
      }

      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });

      localStorage.setItem(LAST_SCHEDULE_KEY, now.getTime().toString());
      console.log(`[NotificationService] Successfully scheduled ${notificationsToSchedule.length} daily reminders at 7:30 PM local time.`);
    } catch (err) {
      console.error('[NotificationService] Failed to schedule daily reminders:', err);
    }
  }

  /**
   * Cancel all scheduled ElectroLab reminders
   */
  public async cancelAllScheduled(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const idsToCancel = DAILY_NOTIFICATION_POOL.map((_, i) => ({ id: NOTIFICATION_ID_BASE + i }));
      await LocalNotifications.cancel({ notifications: idsToCancel });
      console.log('[NotificationService] Canceled previously scheduled notifications.');
    } catch (e) {
      console.warn('[NotificationService] Cancel error:', e);
    }
  }

  /**
   * Trigger an instant test notification (useful for verifying icon, sound & action tap)
   */
  public async triggerTestNotification(): Promise<void> {
    try {
      await this.ensurePermissions();
      const testItem = DAILY_NOTIFICATION_POOL[0];
      const fireAt = new Date(Date.now() + 4000); // 4 seconds from now

      if (!Capacitor.isNativePlatform()) {
        console.log('[NotificationService] Web test notification dispatched:', testItem);
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: `[Test] ${testItem.title}`,
            body: testItem.body,
            channelId: CHANNEL_ID,
            schedule: { at: fireAt, allowWhileIdle: true },
            isExactNotification: false,
            extra: testItem.extra,
          },
        ],
      });
      console.log('[NotificationService] Test notification scheduled in 4 seconds.');
    } catch (e) {
      console.error('[NotificationService] Test notification failed:', e);
    }
  }
}

export const notificationService = new NotificationService();

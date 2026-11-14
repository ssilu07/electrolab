import { playStoreService } from './playStoreService';

class RatingService {
  private readonly STORAGE_KEY_COMPLETED = 'electrolab_rating_completed';
  private readonly STORAGE_KEY_LAST_PROMPT = 'electrolab_rating_last_prompt';
  private readonly STORAGE_KEY_SOLVED_COUNT = 'electrolab_rating_solved_count';
  private readonly STORAGE_KEY_EXPORT_COUNT = 'electrolab_rating_export_count';
  private readonly COOLDOWN_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days cooldown if dismissed

  /**
   * Has the user already submitted a rating flow
   */
  public hasCompletedRating(): boolean {
    return localStorage.getItem(this.STORAGE_KEY_COMPLETED) === 'true';
  }

  /**
   * Check whether it's an opportune moment to request a rating
   */
  public shouldPrompt(source: 'challenge_win' | 'pdf_export' | 'manual'): boolean {
    if (source === 'manual') return true;
    if (this.hasCompletedRating()) return false;

    const lastPromptStr = localStorage.getItem(this.STORAGE_KEY_LAST_PROMPT);
    if (lastPromptStr) {
      const lastPrompt = parseInt(lastPromptStr, 10);
      if (Date.now() - lastPrompt < this.COOLDOWN_DAYS_MS) {
        return false;
      }
    }

    if (source === 'challenge_win') {
      const current = parseInt(localStorage.getItem(this.STORAGE_KEY_SOLVED_COUNT) || '0', 10) + 1;
      localStorage.setItem(this.STORAGE_KEY_SOLVED_COUNT, current.toString());
      // Prompt after completing first 1 or 2 levels (emotional high point)
      return current === 1 || current === 3;
    }

    if (source === 'pdf_export') {
      const current = parseInt(localStorage.getItem(this.STORAGE_KEY_EXPORT_COUNT) || '0', 10) + 1;
      localStorage.setItem(this.STORAGE_KEY_EXPORT_COUNT, current.toString());
      return current === 1; // Prompt after generating their first academic lab report
    }

    return false;
  }

  /**
   * Mark prompt timestamp to enforce cooldown
   */
  public recordPromptShown(): void {
    localStorage.setItem(this.STORAGE_KEY_LAST_PROMPT, Date.now().toString());
  }

  /**
   * Snooze prompt for another 3 days
   */
  public snooze(): void {
    localStorage.setItem(this.STORAGE_KEY_LAST_PROMPT, Date.now().toString());
  }

  /**
   * Mark rating completed so user is never prompted again
   */
  public markCompleted(): void {
    localStorage.setItem(this.STORAGE_KEY_COMPLETED, 'true');
  }

  /**
   * Launch official Google Play In-App Review dialog directly
   */
  public async launchPlayStoreReview(): Promise<boolean> {
    this.markCompleted();
    try {
      const result = await playStoreService.requestReview();
      return result.flowCompleted;
    } catch {
      await playStoreService.openPlayStore();
      return true;
    }
  }
}

export const ratingService = new RatingService();

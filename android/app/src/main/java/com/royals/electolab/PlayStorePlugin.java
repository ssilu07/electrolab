package com.royals.electolab;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallState;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * Google Play Store Native Integration Plugin for ElectroLab
 * Features:
 * - Direct Google Play In-App Updates (Immediate & Flexible)
 * - Google Play In-App Review & Rating prompt
 * - Version info & direct Play Store listing navigation
 */
@CapacitorPlugin(name = "PlayStore")
public class PlayStorePlugin extends Plugin {
    private static final String TAG = "PlayStorePlugin";
    private AppUpdateManager appUpdateManager;
    private ReviewManager reviewManager;
    private InstallStateUpdatedListener installListener;
    private AppUpdateInfo cachedUpdateInfo = null;

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        if (context != null) {
            appUpdateManager = AppUpdateManagerFactory.create(context);
            reviewManager = ReviewManagerFactory.create(context);

            installListener = new InstallStateUpdatedListener() {
                @Override
                public void onStateUpdate(InstallState state) {
                    JSObject ret = new JSObject();
                    ret.put("installStatus", state.installStatus());
                    ret.put("bytesDownloaded", state.bytesDownloaded());
                    ret.put("totalBytesToDownload", state.totalBytesToDownload());
                    ret.put("installErrorCode", state.installErrorCode());

                    notifyListeners("onFlexibleInstallStateUpdate", ret);

                    if (state.installStatus() == InstallStatus.DOWNLOADED) {
                        JSObject downloadedEvent = new JSObject();
                        downloadedEvent.put("downloaded", true);
                        notifyListeners("onUpdateDownloaded", downloadedEvent);
                    }
                }
            };

            try {
                appUpdateManager.registerListener(installListener);
            } catch (Exception e) {
                Log.w(TAG, "Failed to register AppUpdateManager listener: " + e.getMessage());
            }
        }
    }

    /**
     * Get installed app package and version info
     */
    @PluginMethod
    public void getAppVersionInfo(PluginCall call) {
        try {
            Context context = getContext();
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            JSObject ret = new JSObject();
            ret.put("packageName", context.getPackageName());
            ret.put("versionName", pInfo.versionName);
            long versionCode = pInfo.getLongVersionCode();
            ret.put("versionCode", versionCode);
            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            call.reject("Package name not found", e);
        }
    }

    /**
     * Check if a new version is available on Google Play Store
     */
    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        if (appUpdateManager == null) {
            call.reject("AppUpdateManager not initialized");
            return;
        }

        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            cachedUpdateInfo = appUpdateInfo;
            JSObject ret = new JSObject();

            boolean updateAvailable = appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
            boolean developerTriggeredUpdateInProgress = appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;
            boolean immediateAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE);
            boolean flexibleAllowed = appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE);

            ret.put("updateAvailable", updateAvailable);
            ret.put("updateInProgress", developerTriggeredUpdateInProgress);
            ret.put("immediateUpdateAllowed", immediateAllowed);
            ret.put("flexibleUpdateAllowed", flexibleAllowed);
            ret.put("availableVersionCode", appUpdateInfo.availableVersionCode());
            ret.put("installStatus", appUpdateInfo.installStatus());
            
            Integer priority = appUpdateInfo.updatePriority();
            ret.put("updatePriority", priority != null ? priority : 0);

            Integer clientStalenessDays = appUpdateInfo.clientVersionStalenessDays();
            ret.put("clientStalenessDays", clientStalenessDays != null ? clientStalenessDays : 0);

            call.resolve(ret);
        }).addOnFailureListener(e -> {
            Log.w(TAG, "checkForUpdate failed: " + e.getMessage());
            JSObject ret = new JSObject();
            ret.put("updateAvailable", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        });
    }

    /**
     * Launch immediate Google Play In-App Update flow
     */
    @PluginMethod
    public void startImmediateUpdate(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || appUpdateManager == null) {
            call.reject("Activity or AppUpdateManager is null");
            return;
        }

        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                            appUpdateInfo,
                            activity,
                            AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
                            1001
                    );
                    JSObject res = new JSObject();
                    res.put("started", true);
                    call.resolve(res);
                } catch (Exception e) {
                    call.reject("Failed to start immediate update flow: " + e.getMessage(), e);
                }
            } else {
                call.reject("Immediate update not allowed or no update available");
            }
        }).addOnFailureListener(e -> call.reject("Failed to retrieve AppUpdateInfo: " + e.getMessage(), e));
    }

    /**
     * Launch flexible Google Play In-App Update flow (background download)
     */
    @PluginMethod
    public void startFlexibleUpdate(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || appUpdateManager == null) {
            call.reject("Activity or AppUpdateManager is null");
            return;
        }

        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                            appUpdateInfo,
                            activity,
                            AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build(),
                            1002
                    );
                    JSObject res = new JSObject();
                    res.put("started", true);
                    call.resolve(res);
                } catch (Exception e) {
                    call.reject("Failed to start flexible update flow: " + e.getMessage(), e);
                }
            } else {
                call.reject("Flexible update not allowed or no update available");
            }
        }).addOnFailureListener(e -> call.reject("Failed to retrieve AppUpdateInfo: " + e.getMessage(), e));
    }

    /**
     * Complete flexible update: triggers app restart to apply downloaded update
     */
    @PluginMethod
    public void completeFlexibleUpdate(PluginCall call) {
        if (appUpdateManager == null) {
            call.reject("AppUpdateManager is null");
            return;
        }

        appUpdateManager.completeUpdate().addOnSuccessListener(aVoid -> {
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        }).addOnFailureListener(e -> call.reject("Failed to complete update: " + e.getMessage(), e));
    }

    /**
     * Launch official Google Play In-App Review dialog
     */
    @PluginMethod
    public void requestReview(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || reviewManager == null) {
            call.reject("Activity or ReviewManager is null");
            return;
        }

        reviewManager.requestReviewFlow().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                ReviewInfo reviewInfo = task.getResult();
                reviewManager.launchReviewFlow(activity, reviewInfo).addOnCompleteListener(flowTask -> {
                    // Google Play API does not disclose whether user reviewed or dismissed
                    JSObject res = new JSObject();
                    res.put("flowCompleted", true);
                    call.resolve(res);
                });
            } else {
                // If in-app review flow fails, provide fallback to open Play Store listing
                Exception e = task.getException();
                Log.w(TAG, "In-app review request failed, opening store listing directly: " + (e != null ? e.getMessage() : "Unknown error"));
                openPlayStoreDirectly();
                JSObject res = new JSObject();
                res.put("flowCompleted", false);
                res.put("openedStoreListing", true);
                call.resolve(res);
            }
        });
    }

    /**
     * Open Google Play Store listing directly in Play Store app or browser
     */
    @PluginMethod
    public void openPlayStoreListing(PluginCall call) {
        boolean success = openPlayStoreDirectly();
        JSObject res = new JSObject();
        res.put("success", success);
        call.resolve(res);
    }

    private boolean openPlayStoreDirectly() {
        Context context = getContext();
        if (context == null) return false;
        String packageName = context.getPackageName();
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException e) {
            try {
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(webIntent);
                return true;
            } catch (Exception ex) {
                Log.e(TAG, "Failed to open Play Store: " + ex.getMessage());
                return false;
            }
        }
    }
}

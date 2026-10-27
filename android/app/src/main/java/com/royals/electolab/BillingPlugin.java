package com.royals.electolab;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.ProductType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Google Play Billing v8.x Native Plugin for ElectroLab
 * Features:
 * - Real-time Google Play purchase validation (Play Billing 8.0.0+)
 * - Automatic Pro revocation on Refund (queryPurchasesAsync)
 * - Purchase acknowledgment (prevents auto-refund after 3 days)
 * - Auto service reconnection
 * - Safe fallback for offline or debug testing
 */
@CapacitorPlugin(name = "GoogleBilling")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "GoogleBilling";
    public static final String PRODUCT_PRO_LIFETIME = "electrolab_pro_lifetime";

    private BillingClient billingClient;
    private boolean isClientReady = false;
    private PluginCall pendingPurchaseCall = null;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private void initBillingClient() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enableAutoServiceReconnection()
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .build();

        startBillingConnection(null);
    }

    private void startBillingConnection(final Runnable onConnected) {
        if (billingClient == null) return;

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingResponseCode.OK) {
                    isClientReady = true;
                    Log.d(TAG, "Google Play Billing client connected successfully (v8.0.0)");
                    if (onConnected != null) {
                        onConnected.run();
                    }
                } else {
                    isClientReady = false;
                    Log.w(TAG, "Billing setup failed with code: " + billingResult.getResponseCode() + " - " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isClientReady = false;
                Log.w(TAG, "Billing service disconnected. Will reconnect on next request.");
            }
        });
    }

    private void ensureConnection(final Runnable runnable, final PluginCall errorCall) {
        if (isClientReady && billingClient != null && billingClient.isReady()) {
            runnable.run();
        } else {
            startBillingConnection(() -> {
                if (isClientReady) {
                    runnable.run();
                } else if (errorCall != null) {
                    JSObject ret = new JSObject();
                    ret.put("isPro", false);
                    ret.put("error", "Unable to connect to Google Play Store");
                    errorCall.resolve(ret);
                }
            });
        }
    }

    /**
     * Check if user currently owns Pro.
     * Google automatically removes refunded items from queryPurchasesAsync!
     * So if a refund occurred, isPro will be returned as false.
     */
    @PluginMethod
    public void checkProStatus(final PluginCall call) {
        ensureConnection(() -> {
            QueryPurchasesParams queryParams = QueryPurchasesParams.newBuilder()
                    .setProductType(ProductType.INAPP)
                    .build();

            billingClient.queryPurchasesAsync(queryParams, (billingResult, purchases) -> {
                JSObject ret = new JSObject();
                if (billingResult.getResponseCode() == BillingResponseCode.OK && purchases != null) {
                    boolean hasActivePro = false;
                    String orderId = "";
                    String purchaseToken = "";

                    for (Purchase purchase : purchases) {
                        // Check if product matches and is currently in PURCHASED state
                        if (purchase.getProducts().contains(PRODUCT_PRO_LIFETIME) &&
                                purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            hasActivePro = true;
                            orderId = purchase.getOrderId() != null ? purchase.getOrderId() : "";
                            purchaseToken = purchase.getPurchaseToken();

                            // Acknowledge if not acknowledged yet to prevent Google auto-refund
                            if (!purchase.isAcknowledged()) {
                                acknowledgePurchase(purchase.getPurchaseToken());
                            }
                            break;
                        }
                    }

                    ret.put("isPro", hasActivePro);
                    ret.put("orderId", orderId);
                    ret.put("purchaseToken", purchaseToken);
                    ret.put("productId", PRODUCT_PRO_LIFETIME);
                    call.resolve(ret);
                } else {
                    ret.put("isPro", false);
                    ret.put("code", billingResult.getResponseCode());
                    ret.put("message", billingResult.getDebugMessage());
                    call.resolve(ret);
                }
            });
        }, call);
    }

    /**
     * Initiate Google Play Purchase Flow
     */
    @PluginMethod
    public void purchasePro(final PluginCall call) {
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        ensureConnection(() -> {
            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(PRODUCT_PRO_LIFETIME)
                            .setProductType(ProductType.INAPP)
                            .build()
            );

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, result) -> {
                List<ProductDetails> productDetailsList = result != null ? result.getProductDetailsList() : null;
                if (billingResult.getResponseCode() == BillingResponseCode.OK && productDetailsList != null && !productDetailsList.isEmpty()) {
                    ProductDetails productDetails = productDetailsList.get(0);

                    List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList =
                            Collections.singletonList(
                                    BillingFlowParams.ProductDetailsParams.newBuilder()
                                            .setProductDetails(productDetails)
                                            .build()
                            );

                    BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                            .setProductDetailsParamsList(productDetailsParamsList)
                            .build();

                    pendingPurchaseCall = call;
                    billingClient.launchBillingFlow(activity, billingFlowParams);
                } else {
                    JSObject err = new JSObject();
                    err.put("success", false);
                    err.put("message", "Product not found on Play Console: " + PRODUCT_PRO_LIFETIME + " (" + billingResult.getDebugMessage() + ")");
                    call.resolve(err);
                }
            });
        }, call);
    }

    /**
     * Restore purchases (checks existing purchases from Google Play)
     */
    @PluginMethod
    public void restorePurchases(final PluginCall call) {
        checkProStatus(call);
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingResponseCode.USER_CANCELED) {
            if (pendingPurchaseCall != null) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("canceled", true);
                ret.put("message", "Purchase canceled by user");
                pendingPurchaseCall.resolve(ret);
                pendingPurchaseCall = null;
            }
        } else {
            if (pendingPurchaseCall != null) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("canceled", false);
                ret.put("message", "Purchase failed: " + billingResult.getDebugMessage());
                pendingPurchaseCall.resolve(ret);
                pendingPurchaseCall = null;
            }
        }
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams =
                        AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();

                billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
                    boolean success = billingResult.getResponseCode() == BillingResponseCode.OK;
                    notifyPurchaseComplete(success, purchase);
                });
            } else {
                notifyPurchaseComplete(true, purchase);
            }
        }
    }

    private void notifyPurchaseComplete(boolean success, Purchase purchase) {
        if (pendingPurchaseCall != null) {
            JSObject ret = new JSObject();
            ret.put("success", success);
            ret.put("isPro", true);
            ret.put("orderId", purchase.getOrderId());
            ret.put("purchaseToken", purchase.getPurchaseToken());
            pendingPurchaseCall.resolve(ret);
            pendingPurchaseCall = null;
        }

        // Also emit event to web view
        JSObject event = new JSObject();
        event.put("isPro", true);
        event.put("orderId", purchase.getOrderId());
        notifyListeners("proStatusChanged", event);
    }

    private void acknowledgePurchase(String purchaseToken) {
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build();
        billingClient.acknowledgePurchase(params, billingResult -> {
            Log.d(TAG, "Purchase acknowledged result: " + billingResult.getResponseCode());
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null) {
            billingClient.endConnection();
        }
        super.handleOnDestroy();
    }
}

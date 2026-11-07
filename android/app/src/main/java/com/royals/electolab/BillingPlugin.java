package com.royals.electolab;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.ProductType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
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
 * - Subscriptions (electrolab_sub_monthly) + One-Time Lifetime support
 * - Automatic Pro revocation on Subscription cancel / expiration / refund
 * - Purchase acknowledgment (prevents auto-refund after 3 days)
 * - Auto service reconnection
 * - Safe fallback for offline or debug testing
 */
@CapacitorPlugin(name = "GoogleBilling")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String TAG = "GoogleBilling";
    public static final String PRODUCT_PRO_MONTHLY = "electrolab_sub_monthly";
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
        PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build();

        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enableAutoServiceReconnection()
                .enablePendingPurchases(pendingPurchasesParams)
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
     * Check if user currently has an active subscription or lifetime license.
     * Checks both ProductType.SUBS and ProductType.INAPP.
     */
    @PluginMethod
    public void checkProStatus(final PluginCall call) {
        ensureConnection(() -> {
            // 1. First check active subscriptions (ProductType.SUBS)
            QueryPurchasesParams subParams = QueryPurchasesParams.newBuilder()
                    .setProductType(ProductType.SUBS)
                    .build();

            billingClient.queryPurchasesAsync(subParams, (subResult, subPurchases) -> {
                boolean hasActiveSub = false;
                String orderId = "";
                String purchaseToken = "";
                String activeProduct = "";

                if (subResult.getResponseCode() == BillingResponseCode.OK && subPurchases != null) {
                    for (Purchase purchase : subPurchases) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            for (String prodId : purchase.getProducts()) {
                                if (prodId.equals(PRODUCT_PRO_MONTHLY) || prodId.contains("sub") || prodId.contains("pro")) {
                                    hasActiveSub = true;
                                    orderId = purchase.getOrderId() != null ? purchase.getOrderId() : "";
                                    purchaseToken = purchase.getPurchaseToken();
                                    activeProduct = prodId;

                                    if (!purchase.isAcknowledged()) {
                                        acknowledgePurchase(purchase.getPurchaseToken());
                                    }
                                    break;
                                }
                            }
                        }
                        if (hasActiveSub) break;
                    }
                }

                if (hasActiveSub) {
                    JSObject ret = new JSObject();
                    ret.put("isPro", true);
                    ret.put("isSubscription", true);
                    ret.put("orderId", orderId);
                    ret.put("purchaseToken", purchaseToken);
                    ret.put("productId", activeProduct);
                    call.resolve(ret);
                    return;
                }

                // 2. Fallback: check one-time in-app purchases (ProductType.INAPP)
                QueryPurchasesParams inappParams = QueryPurchasesParams.newBuilder()
                        .setProductType(ProductType.INAPP)
                        .build();

                billingClient.queryPurchasesAsync(inappParams, (inappResult, inappPurchases) -> {
                    boolean hasActiveInapp = false;
                    String inappOrderId = "";
                    String inappPurchaseToken = "";
                    String inappProduct = "";

                    if (inappResult.getResponseCode() == BillingResponseCode.OK && inappPurchases != null) {
                        for (Purchase purchase : inappPurchases) {
                            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                for (String prodId : purchase.getProducts()) {
                                    if (prodId.equals(PRODUCT_PRO_LIFETIME) || prodId.contains("lifetime") || prodId.contains("pro")) {
                                        hasActiveInapp = true;
                                        inappOrderId = purchase.getOrderId() != null ? purchase.getOrderId() : "";
                                        inappPurchaseToken = purchase.getPurchaseToken();
                                        inappProduct = prodId;

                                        if (!purchase.isAcknowledged()) {
                                            acknowledgePurchase(purchase.getPurchaseToken());
                                        }
                                        break;
                                    }
                                }
                            }
                            if (hasActiveInapp) break;
                        }
                    }

                    JSObject ret = new JSObject();
                    ret.put("isPro", hasActiveInapp);
                    ret.put("isSubscription", false);
                    ret.put("orderId", inappOrderId);
                    ret.put("purchaseToken", inappPurchaseToken);
                    ret.put("productId", inappProduct);
                    call.resolve(ret);
                });
            });
        }, call);
    }

    /**
     * Initiate Google Play Purchase Flow (supports both Subscription and One-Time products)
     */
    @PluginMethod
    public void purchasePro(final PluginCall call) {
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        final String productId = call.getString("productId", PRODUCT_PRO_MONTHLY);
        final String productTypeStr = call.getString("productType", "subs");
        final boolean isSubscription = "subs".equalsIgnoreCase(productTypeStr) || PRODUCT_PRO_MONTHLY.equals(productId);
        final String playProductType = isSubscription ? ProductType.SUBS : ProductType.INAPP;

        ensureConnection(() -> {
            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(playProductType)
                            .build()
            );

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, result) -> {
                List<ProductDetails> productDetailsList = result != null ? result.getProductDetailsList() : null;
                if (billingResult.getResponseCode() == BillingResponseCode.OK && productDetailsList != null && !productDetailsList.isEmpty()) {
                    ProductDetails productDetails = productDetailsList.get(0);

                    BillingFlowParams.ProductDetailsParams.Builder detailsBuilder =
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                    .setProductDetails(productDetails);

                    if (isSubscription) {
                        List<ProductDetails.SubscriptionOfferDetails> offerDetails = productDetails.getSubscriptionOfferDetails();
                        if (offerDetails != null && !offerDetails.isEmpty()) {
                            detailsBuilder.setOfferToken(offerDetails.get(0).getOfferToken());
                        } else {
                            JSObject err = new JSObject();
                            err.put("success", false);
                            err.put("message", "No active subscription offer available for " + productId);
                            call.resolve(err);
                            return;
                        }
                    }

                    List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList =
                            Collections.singletonList(detailsBuilder.build());

                    BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                            .setProductDetailsParamsList(productDetailsParamsList)
                            .build();

                    pendingPurchaseCall = call;
                    billingClient.launchBillingFlow(activity, billingFlowParams);
                } else {
                    JSObject err = new JSObject();
                    err.put("success", false);
                    err.put("message", "Product not found on Play Console: " + productId + " (" + billingResult.getDebugMessage() + ")");
                    call.resolve(err);
                }
            });
        }, call);
    }

    /**
     * Fetch real-time localized price & title from Google Play
     */
    @PluginMethod
    public void getProductDetails(final PluginCall call) {
        final String productId = call.getString("productId", PRODUCT_PRO_MONTHLY);
        final String productTypeStr = call.getString("productType", "subs");
        final boolean isSubscription = "subs".equalsIgnoreCase(productTypeStr);

        ensureConnection(() -> {
            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(isSubscription ? ProductType.SUBS : ProductType.INAPP)
                            .build()
            );

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, result) -> {
                JSObject ret = new JSObject();
                if (billingResult.getResponseCode() == BillingResponseCode.OK && result != null && !result.getProductDetailsList().isEmpty()) {
                    ProductDetails pd = result.getProductDetailsList().get(0);
                    ret.put("productId", pd.getProductId());
                    ret.put("title", pd.getTitle());
                    ret.put("description", pd.getDescription());

                    if (isSubscription && pd.getSubscriptionOfferDetails() != null && !pd.getSubscriptionOfferDetails().isEmpty()) {
                        ProductDetails.SubscriptionOfferDetails offer = pd.getSubscriptionOfferDetails().get(0);
                        List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                        if (phases != null && !phases.isEmpty()) {
                            ret.put("formattedPrice", phases.get(0).getFormattedPrice());
                            ret.put("priceCurrencyCode", phases.get(0).getPriceCurrencyCode());
                        }
                    } else if (pd.getOneTimePurchaseOfferDetails() != null) {
                        ret.put("formattedPrice", pd.getOneTimePurchaseOfferDetails().getFormattedPrice());
                        ret.put("priceCurrencyCode", pd.getOneTimePurchaseOfferDetails().getPriceCurrencyCode());
                    }
                    ret.put("success", true);
                } else {
                    ret.put("success", false);
                    ret.put("error", billingResult.getDebugMessage());
                }
                call.resolve(ret);
            });
        }, call);
    }

    /**
     * Restore purchases (checks active subscriptions & in-app purchases from Google Play)
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

# 🚀 Google Play Store Automation & Direct SDK Integration Guide
### ElectroLab (`com.royals.electolab`)

इस प्रोजेक्ट में Google Play Store से डायरेक्ट कनेक्शन और ऑटोमेशन (CI/CD) पूरी तरह से सेटअप कर दिया गया है। 

---

## 📦 1. इन्सटॉल और कनेक्ट किए गए SDKs (Installed SDKs)

### A. Google Play Core SDK (In-App Updates & Reviews)
- **`com.google.android.play:app-update:2.1.0`**: ऐप को सीधे Google Play Store सर्वर से कनेक्ट करता है। जैसे ही आप Play Store पर नया वर्शन रिलीज़ करेंगे, यूज़र के ऐप में अपने-आप अपडेट प्रॉम्प्ट (Immediate या Flexible) आ जाएगा।
- **`com.google.android.play:review:2.0.2`**: यूज़र को बिना प्ले स्टोर बाहर खोले ऐप के अंदर से ही डायरेक्ट 5-Star रेटिंग और रिव्यू देने की सुविधा देता है।
- **`com.royals.electolab.PlayStorePlugin`**: नेटिव कैपेसिटर ब्रिज जो ऐप के रिएक्ट फ्रंटएंड को सीधे प्ले स्टोर API से जोड़ता है (`src/services/playStoreService.ts`)।

### B. Google Play Billing SDK v8.0.0
- **`com.android.billingclient:billing:8.0.0`**: `com.royals.electolab.BillingPlugin` के साथ लाइफटाइम प्रो और इन-ऐप पर्चेस का रियल-टाइम वेरिफिकेशन करता है।

---

## ⚡ 2. GitHub से Google Play Store डायरेक्ट ऑटोमेशन (CI/CD Pipeline)

वर्कफ़्लो फ़ाइल: [`.github/workflows/deploy-playstore.yml`](.github/workflows/deploy-playstore.yml)

### यह ऑटोमेशन कैसे काम करता है:
1. जब भी आप GitHub के `main` ब्रांच पर `git push` करेंगे:
   - GitHub Actions अपने-आप कोड चेकआउट करेगा।
   - Node.js और Vite से प्रोडक्शन वेब बिल्ड (`npm run build`) तैयार करेगा।
   - Capacitor Android प्रोजेक्ट सिंक करेगा (`npx cap sync android`)।
   - JDK 21 पर Android App Bundle (`.aab`) तैयार करेगा।
   - AAB को साइन करेगा।
   - **Google Play Developer API के ज़रिए सीधे Google Play Console के `internal` टेस्टिंग ट्रैक पर अपलोड कर देगा!**
2. जब आप GitHub पर **Release Tag** पब्लिश करेंगे या मैन्युअल रूप से GitHub Actions टैब से **"Run workflow"** दबाएंगे, तब आप सीधे **`production`**, **`beta`**, या **`alpha`** ट्रैक पर रोलआउट प्रतिशत चुनकर डिप्लॉय कर सकते हैं।

---

## 🔑 3. एक बार का सेटअप (One-Time Setup in GitHub Secrets)

Google Play Store पर सीधे ऑटोमेटेड अपलोड करने के लिए GitHub रिपॉजिटरी में सीक्रेट्स (Secrets) जोड़ें:

1. अपने GitHub Repo पर जाएं: **Settings > Secrets and variables > Actions > New repository secret**
2. निम्नलिखित सीक्रेट्स जोड़ें:

| Secret Name | विवरण (Description) |
|---|---|
| `PLAY_CONFIG_JSON` | Google Play Console Service Account की JSON Key फाइल का पूरा टेक्स्ट (नीचे स्टेप्स देखें) |
| `ANDROID_KEYSTORE_BASE64` | आपकी `.keystore` या `.jks` फ़ाइल का Base64 स्ट्रिंग (`certutil -encode my-release-key.jks tmp.txt`) |
| `KEYSTORE_PASSWORD` | आपके कीस्टोर का पासवर्ड |
| `KEY_ALIAS` | आपके की का Alias नाम |
| `KEY_PASSWORD` | आपके की का पासवर्ड |

> **नोट**: अगर आपने अभी तक कीस्टोर सीक्रेट्स नहीं डाले हैं, तब भी पाइपलाइन बिल्ड बनाकर GitHub Artifacts में अनसाइंड/डीबग बंडल सेव कर देगी। सीक्रेट्स डालते ही ऑटो-अपलोड चालू हो जाएगा।

---

### 📝 Google Play Service Account JSON Key कैसे निकालें:
1. **Google Play Console** में लॉगिन करें।
2. बायीं तरफ मेनू में **Settings (Setup) > API access** पर जाएं।
3. **Link Google Cloud Project** करें या नया प्रोजेक्ट लिंक करें।
4. **Service Accounts** सेक्शन में **"Create new service account"** पर क्लिक करें और Google Cloud Console लिंक पर जाएं।
5. Google Cloud Console में Service Account बनाएं और उसे **Service Account User** रोल दें।
6. Service Account के **Keys** टैब में जाकर **"Add Key" > "Create new key" > JSON** डाउनलोड करें।
7. वापिस Google Play Console के **API access** पेज पर आएं, सर्विस अकाउंट के आगे **"Grant access"** दबाएं और **"Releases" (Release manager)** की परमिशन दें।
8. डाउनलोड हुई JSON फ़ाइल का पूरा टेक्स्ट कॉपी करके GitHub Secret `PLAY_CONFIG_JSON` में पेस्ट कर दें।

---

## 🛠️ 4. लोकल कमांड्स (Local Commands)

अगर आपको अपनी मशीन से डायरेक्ट AAB या APK बिल्ड करना हो:

```bash
# Android App Bundle (.aab) तैयार करें (Play Store के लिए)
npm run android:bundle

# Debug APK तैयार करें
npm run android:build

# Release APK तैयार करें
npm run android:release
```

package com.edgepay.app.sim

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*

class SimManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SimManagerModule"
        private const val PREFS_NAME = "edgepay_sim_prefs"
        private const val KEY_PREFERRED_SIM_SLOT = "preferred_sim_slot"
        private const val KEY_PREFERRED_SUB_ID = "preferred_sub_id"
    }

    override fun getName(): String = NAME

    private fun getPrefs(): SharedPreferences =
        reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * Get all available SIM cards on the device
     */
    @ReactMethod
    fun getAvailableSims(promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.READ_PHONE_STATE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "READ_PHONE_STATE permission required")
                return
            }

            val subscriptionManager = reactApplicationContext.getSystemService(
                Context.TELEPHONY_SUBSCRIPTION_SERVICE
            ) as? SubscriptionManager

            if (subscriptionManager == null) {
                promise.reject("NO_SUBSCRIPTION_MANAGER", "SubscriptionManager not available")
                return
            }

            val activeSubscriptions: List<SubscriptionInfo> = try {
                subscriptionManager.activeSubscriptionInfoList ?: emptyList()
            } catch (e: SecurityException) {
                promise.reject("SECURITY_ERROR", "Cannot read SIM info: ${e.message}")
                return
            }

            val sims = Arguments.createArray()
            for (sub in activeSubscriptions) {
                val simInfo = Arguments.createMap().apply {
                    putInt("slotIndex", sub.simSlotIndex)
                    putInt("subscriptionId", sub.subscriptionId)
                    putString("carrierName", sub.carrierName?.toString() ?: "Unknown")
                    putString("displayName", sub.displayName?.toString() ?: "SIM ${sub.simSlotIndex + 1}")
                    putString("iccId", sub.iccId ?: "")
                    putString("number", sub.number ?: "")
                    putInt("mcc", sub.mccCompat())
                    putInt("mnc", sub.mncCompat())
                    putString("countryIso", sub.countryIso ?: "")
                    putBoolean("isEmbedded", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) sub.isEmbedded else false)
                }
                sims.pushMap(simInfo)
            }

            promise.resolve(sims)
        } catch (e: Exception) {
            promise.reject("SIM_ERROR", "Failed to get SIM info: ${e.message}")
        }
    }

    /**
     * Set the preferred SIM for USSD operations
     */
    @ReactMethod
    fun setPreferredSim(slotIndex: Int, subscriptionId: Int, promise: Promise) {
        try {
            getPrefs().edit()
                .putInt(KEY_PREFERRED_SIM_SLOT, slotIndex)
                .putInt(KEY_PREFERRED_SUB_ID, subscriptionId)
                .apply()

            promise.resolve(Arguments.createMap().apply {
                putInt("slotIndex", slotIndex)
                putInt("subscriptionId", subscriptionId)
                putBoolean("saved", true)
            })
        } catch (e: Exception) {
            promise.reject("PREF_ERROR", "Failed to save SIM preference: ${e.message}")
        }
    }

    /**
     * Get the preferred SIM slot
     */
    @ReactMethod
    fun getPreferredSim(promise: Promise) {
        try {
            val prefs = getPrefs()
            val slot = prefs.getInt(KEY_PREFERRED_SIM_SLOT, -1)
            val subId = prefs.getInt(KEY_PREFERRED_SUB_ID, -1)

            if (slot == -1) {
                promise.resolve(null)
                return
            }

            promise.resolve(Arguments.createMap().apply {
                putInt("slotIndex", slot)
                putInt("subscriptionId", subId)
            })
        } catch (e: Exception) {
            promise.reject("PREF_ERROR", "Failed to get SIM preference: ${e.message}")
        }
    }

    /**
     * Send USSD command on a specific SIM using subscriptionId
     */
    @ReactMethod
    fun sendUssdOnSim(ussdCode: String, subscriptionId: Int, promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.CALL_PHONE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "CALL_PHONE permission required")
                return
            }

            if (!ussdCode.startsWith("*") || !ussdCode.endsWith("#")) {
                promise.reject("INVALID_USSD", "USSD code must start with * and end with #")
                return
            }

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                promise.reject("API_TOO_LOW", "sendUssdRequest requires Android 8.0+")
                return
            }

            // Get TelephonyManager for the specific subscription
            val telephonyManager = reactApplicationContext.getSystemService(
                Context.TELEPHONY_SERVICE
            ) as? TelephonyManager

            if (telephonyManager == null) {
                promise.reject("NO_TELEPHONY", "TelephonyManager not available")
                return
            }

            val simTelephonyManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                telephonyManager.createForSubscriptionId(subscriptionId)
            } else {
                telephonyManager
            }

            val handler = android.os.Handler(android.os.Looper.getMainLooper())

            simTelephonyManager.sendUssdRequest(
                ussdCode,
                object : TelephonyManager.UssdResponseCallback() {
                    override fun onReceiveUssdResponse(
                        telephonyManager: TelephonyManager,
                        request: String,
                        response: CharSequence
                    ) {
                        promise.resolve(Arguments.createMap().apply {
                            putString("status", "SUCCESS")
                            putString("request", request)
                            putString("response", response.toString())
                            putInt("subscriptionId", subscriptionId)
                            putDouble("timestamp", System.currentTimeMillis().toDouble())
                        })
                    }

                    override fun onReceiveUssdResponseFailed(
                        telephonyManager: TelephonyManager,
                        request: String,
                        failureCode: Int
                    ) {
                        val reason = when (failureCode) {
                            TelephonyManager.USSD_ERROR_SERVICE_UNAVAIL -> "USSD service unavailable"
                            TelephonyManager.USSD_RETURN_FAILURE -> "USSD request failed"
                            else -> "Unknown error (code: $failureCode)"
                        }
                        promise.reject("USSD_FAILED", reason)
                    }
                },
                handler
            )
        } catch (e: SecurityException) {
            promise.reject("SECURITY_ERROR", "Permission denied: ${e.message}")
        } catch (e: Exception) {
            promise.reject("USSD_ERROR", "Failed: ${e.message}")
        }
    }

    /**
     * Dial USSD code using Intent (fallback, opens dialer)
     */
    @ReactMethod
    fun dialUssdOnSim(ussdCode: String, promise: Promise) {
        try {
            val intent = android.content.Intent(
                android.content.Intent.ACTION_CALL,
                android.net.Uri.parse("tel:${android.net.Uri.encode(ussdCode)}")
            )
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK

            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.CALL_PHONE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "CALL_PHONE permission required")
                return
            }

            // Set preferred SIM for the call if possible
            val prefs = getPrefs()
            val subId = prefs.getInt(KEY_PREFERRED_SUB_ID, -1)
            if (subId != -1 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.putExtra("android.telecom.extra.PHONE_ACCOUNT_HANDLE", subId)
            }

            reactApplicationContext.startActivity(intent)
            promise.resolve(Arguments.createMap().apply {
                putString("status", "DIALED")
                putString("ussdCode", ussdCode)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            })
        } catch (e: Exception) {
            promise.reject("DIAL_ERROR", "Failed to dial: ${e.message}")
        }
    }

    /**
     * Get the count of active SIMs
     */
    @ReactMethod
    fun getSimCount(promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.READ_PHONE_STATE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(0)
                return
            }

            val subscriptionManager = reactApplicationContext.getSystemService(
                Context.TELEPHONY_SUBSCRIPTION_SERVICE
            ) as? SubscriptionManager

            val count = subscriptionManager?.activeSubscriptionInfoCount ?: 0
            promise.resolve(count)
        } catch (e: Exception) {
            promise.resolve(0)
        }
    }

    // Compat helper for MCC
    private fun SubscriptionInfo.mccCompat(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            this.mccString?.toIntOrNull() ?: 0
        } else {
            @Suppress("DEPRECATION")
            this.mcc
        }
    }

    // Compat helper for MNC
    private fun SubscriptionInfo.mncCompat(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            this.mncString?.toIntOrNull() ?: 0
        } else {
            @Suppress("DEPRECATION")
            this.mnc
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

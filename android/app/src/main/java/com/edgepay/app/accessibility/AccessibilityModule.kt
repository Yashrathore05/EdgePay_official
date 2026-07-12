package com.edgepay.app.accessibility

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AccessibilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AccessibilityModule"
        const val EVENT_USSD_DIALOG = "onUssdDialogDetected"
        const val EVENT_USSD_DISMISSED = "onUssdDialogDismissed"
        const val EVENT_AUTOFILL_COMPLETE = "onAutoFillComplete"
    }

    override fun getName(): String = NAME

    init {
        // Wire up callbacks from the AccessibilityService to emit JS events
        EdgePayAccessibilityService.onUssdDialogDetected = { text ->
            sendEvent(EVENT_USSD_DIALOG, Arguments.createMap().apply {
                putString("text", text)
                putBoolean("hasInputField", text.contains("Enter", ignoreCase = true) ||
                        text.contains("PIN", ignoreCase = true))
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            })
        }

        EdgePayAccessibilityService.onUssdDialogDismissed = {
            sendEvent(EVENT_USSD_DISMISSED, Arguments.createMap().apply {
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            })
        }

        EdgePayAccessibilityService.onAutoFillComplete = { success ->
            sendEvent(EVENT_AUTOFILL_COMPLETE, Arguments.createMap().apply {
                putBoolean("success", success)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            })
        }
    }

    /**
     * Check if our accessibility service is enabled
     */
    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val enabled = isServiceEnabled()
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("A11Y_ERROR", "Failed to check accessibility status: ${e.message}")
        }
    }

    /**
     * Open Android accessibility settings so user can enable our service
     */
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", "Failed to open accessibility settings: ${e.message}")
        }
    }

    /**
     * Set the UPI PIN to auto-fill when a USSD dialog with an input field appears
     */
    @ReactMethod
    fun setAutoFillPin(pin: String, autoClickSend: Boolean, promise: Promise) {
        if (!isServiceEnabled()) {
            promise.reject("A11Y_DISABLED", "Accessibility service is not enabled")
            return
        }

        if (EdgePayAccessibilityService.instance == null) {
            promise.reject("SERVICE_NOT_RUNNING", "Accessibility service is not running")
            return
        }

        EdgePayAccessibilityService.pendingAutoFillPin = pin
        EdgePayAccessibilityService.autoClickSend = autoClickSend
        promise.resolve(true)
    }

    /**
     * Clear any pending auto-fill data
     */
    @ReactMethod
    fun clearAutoFillData(promise: Promise) {
        EdgePayAccessibilityService.pendingAutoFillPin = null
        EdgePayAccessibilityService.autoClickSend = false
        promise.resolve(true)
    }

    /**
     * Get the current state of the USSD dialog
     */
    @ReactMethod
    fun getUssdDialogState(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putBoolean("isOpen", EdgePayAccessibilityService.isUssdDialogOpen)
            putString("lastText", EdgePayAccessibilityService.lastUssdText)
            putDouble("lastEventTimestamp", EdgePayAccessibilityService.lastEventTimestamp.toDouble())
        })
    }

    /**
     * Check if the service instance is alive
     */
    @ReactMethod
    fun isServiceAlive(promise: Promise) {
        promise.resolve(EdgePayAccessibilityService.instance != null)
    }

    private fun isServiceEnabled(): Boolean {
        val context = reactApplicationContext
        val expectedComponentName = ComponentName(context, EdgePayAccessibilityService::class.java)
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)
        while (colonSplitter.hasNext()) {
            val enabledService = colonSplitter.next()
            val enabledComponent = ComponentName.unflattenFromString(enabledService)
            if (enabledComponent != null && enabledComponent == expectedComponentName) {
                return true
            }
        }
        return false
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

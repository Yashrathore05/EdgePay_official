package com.edgepay.app.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * EdgePay Accessibility Service
 *
 * Detects USSD dialogs (MMI code dialogs), reads their content,
 * and can auto-fill input fields (e.g., UPI PIN) and click buttons.
 *
 * This service ONLY interacts with system USSD/MMI dialogs — it does NOT
 * read content from any other app for privacy reasons.
 */
class EdgePayAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "EdgePayA11y"

        // Shared state — accessed from AccessibilityModule via static reference
        @Volatile var instance: EdgePayAccessibilityService? = null
        @Volatile var lastUssdText: String = ""
        @Volatile var isUssdDialogOpen: Boolean = false
        @Volatile var pendingAutoFillPin: String? = null
        @Volatile var autoClickSend: Boolean = false
        @Volatile var lastEventTimestamp: Long = 0

        // Callback for when USSD dialog is detected
        var onUssdDialogDetected: ((text: String) -> Unit)? = null
        var onUssdDialogDismissed: (() -> Unit)? = null
        var onAutoFillComplete: ((success: Boolean) -> Unit)? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this

        val info = AccessibilityServiceInfo().apply {
            // Listen for window state changes and content changes
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED

            // Only monitor system UI and phone packages (USSD dialogs)
            packageNames = arrayOf(
                "com.android.phone",
                "com.android.server.telecom",
                "com.samsung.android.dialer",
                "com.google.android.dialer",
                "com.android.incallui",
            )

            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        serviceInfo = info

        Log.d(TAG, "Accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        lastEventTimestamp = System.currentTimeMillis()

        val packageName = event.packageName?.toString() ?: return

        // Only process events from phone/dialer packages
        if (!isPhonePackage(packageName)) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                handleWindowStateChange(event)
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                handleContentChange(event)
            }
        }
    }

    private fun handleWindowStateChange(event: AccessibilityEvent) {
        val root = rootInActiveWindow ?: return
        val dialogText = extractUssdDialogText(root)

        if (dialogText != null) {
            Log.d(TAG, "USSD dialog detected: ${dialogText.take(100)}")
            isUssdDialogOpen = true
            lastUssdText = dialogText
            onUssdDialogDetected?.invoke(dialogText)

            // If we have a pending PIN to auto-fill, do it now
            if (pendingAutoFillPin != null) {
                performAutoFill(root)
            }
        }
    }

    private fun handleContentChange(event: AccessibilityEvent) {
        val root = rootInActiveWindow ?: return
        val dialogText = extractUssdDialogText(root)

        if (dialogText != null && dialogText != lastUssdText) {
            lastUssdText = dialogText
            isUssdDialogOpen = true
            onUssdDialogDetected?.invoke(dialogText)

            if (pendingAutoFillPin != null) {
                performAutoFill(root)
            }
        } else if (dialogText == null && isUssdDialogOpen) {
            // Dialog was dismissed
            isUssdDialogOpen = false
            lastUssdText = ""
            onUssdDialogDismissed?.invoke()
        }
    }

    /**
     * Extract text from a USSD/MMI dialog
     */
    private fun extractUssdDialogText(root: AccessibilityNodeInfo): String? {
        val texts = mutableListOf<String>()
        traverseForText(root, texts)

        if (texts.isEmpty()) return null

        val combined = texts.joinToString("\n")
        // USSD dialogs typically contain text like "NPCI", "*99#", "UPI", "Enter", etc.
        // Also check for EditText presence (input field = PIN entry)
        val hasUssdIndicators = combined.contains("*99", ignoreCase = true) ||
                combined.contains("USSD", ignoreCase = true) ||
                combined.contains("MMI", ignoreCase = true) ||
                combined.contains("NPCI", ignoreCase = true) ||
                combined.contains("UPI", ignoreCase = true) ||
                combined.contains("Enter", ignoreCase = true) ||
                combined.contains("PIN", ignoreCase = true) ||
                combined.contains("Send", ignoreCase = true) ||
                hasEditTextField(root)

        return if (hasUssdIndicators) combined else null
    }

    private fun traverseForText(node: AccessibilityNodeInfo, texts: MutableList<String>) {
        val text = node.text?.toString()
        if (!text.isNullOrBlank()) {
            texts.add(text)
        }
        val contentDesc = node.contentDescription?.toString()
        if (!contentDesc.isNullOrBlank() && contentDesc != text) {
            texts.add(contentDesc)
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            traverseForText(child, texts)
        }
    }

    private fun hasEditTextField(node: AccessibilityNodeInfo): Boolean {
        if (node.className?.toString() == "android.widget.EditText") return true
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (hasEditTextField(child)) return true
        }
        return false
    }

    /**
     * Auto-fill the UPI PIN into the USSD dialog's input field
     * and optionally click the "Send" / "OK" button
     */
    private fun performAutoFill(root: AccessibilityNodeInfo) {
        val pin = pendingAutoFillPin ?: return
        Log.d(TAG, "Attempting auto-fill...")

        // Find the EditText field
        val editText = findEditText(root)
        if (editText != null) {
            // Set the text
            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, pin)
            }
            val success = editText.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
            Log.d(TAG, "Auto-fill text set: $success")

            if (success && autoClickSend) {
                // Small delay then click Send/OK
                android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                    clickSendButton(rootInActiveWindow)
                }, 300)
            }

            pendingAutoFillPin = null
            autoClickSend = false
            onAutoFillComplete?.invoke(success)
        } else {
            Log.d(TAG, "No EditText found in USSD dialog")
        }
    }

    private fun findEditText(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.className?.toString() == "android.widget.EditText") return node
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findEditText(child)
            if (result != null) return result
        }
        return null
    }

    /**
     * Find and click the "Send" or "OK" button in the USSD dialog
     */
    private fun clickSendButton(root: AccessibilityNodeInfo?) {
        if (root == null) return
        val button = findButtonByText(root, listOf("Send", "OK", "SEND", "Ok", "Submit"))
        if (button != null) {
            val clicked = button.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            Log.d(TAG, "Send button clicked: $clicked")
        } else {
            Log.d(TAG, "Send button not found")
        }
    }

    private fun findButtonByText(node: AccessibilityNodeInfo, labels: List<String>): AccessibilityNodeInfo? {
        val text = node.text?.toString() ?: ""
        val className = node.className?.toString() ?: ""
        val isClickable = node.isClickable

        if (isClickable && labels.any { text.equals(it, ignoreCase = true) }) {
            return node
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findButtonByText(child, labels)
            if (result != null) return result
        }
        return null
    }

    private fun isPhonePackage(packageName: String): Boolean {
        return packageName.contains("phone", ignoreCase = true) ||
                packageName.contains("dialer", ignoreCase = true) ||
                packageName.contains("telecom", ignoreCase = true) ||
                packageName.contains("incallui", ignoreCase = true)
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }
}

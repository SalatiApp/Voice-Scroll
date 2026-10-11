package com.voicescroll.app.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.os.Build
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.model.CommandType

class VoiceScrollAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "VoiceScrollAccess"
        var instance: VoiceScrollAccessibilityService? = null
            private set

        val isServiceEnabled: Boolean
            get() = instance != null

        fun isServiceEnabled(context: android.content.Context): Boolean {
            if (instance != null) return true
            return try {
                val enabledServices = android.provider.Settings.Secure.getString(
                    context.contentResolver,
                    android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                ) ?: return false
                val expectedFull = "${context.packageName}/${VoiceScrollAccessibilityService::class.java.name}"
                val expectedShort = "${context.packageName}/.service.VoiceScrollAccessibilityService"
                enabledServices.split(":").any {
                    it.equals(expectedFull, ignoreCase = true) || it.equals(expectedShort, ignoreCase = true)
                }
            } catch (e: Exception) {
                instance != null
            }
        }
    }

    private lateinit var prefsManager: PreferencesManager
    private var lastGestureTimeMs: Long = 0L

    override fun onCreate() {
        super.onCreate()
        instance = this
        prefsManager = PreferencesManager(this)
        Log.i(TAG, "VoiceScrollAccessibilityService created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "VoiceScrollAccessibilityService connected and ready")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {
        Log.w(TAG, "VoiceScrollAccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "VoiceScrollAccessibilityService destroyed")
    }

    fun performAction(command: CommandType): Boolean {
        val currentTime = System.currentTimeMillis()
        val cooldown = prefsManager.cooldownMs.coerceAtLeast(300L)
        if (currentTime - lastGestureTimeMs < cooldown) {
            return false
        }

        val success = when (command) {
            CommandType.NEXT -> swipeUp()
            CommandType.PREVIOUS -> swipeDown()
            CommandType.STOP -> {
                prefsManager.isVoiceControlActive = false
                broadcastStateChange()
                true
            }
            CommandType.RESUME -> {
                prefsManager.isVoiceControlActive = true
                broadcastStateChange()
                true
            }
            CommandType.PAUSE, CommandType.PLAY -> {
                singleTapCenter()
            }
            CommandType.NONE -> false
        }

        if (success) {
            lastGestureTimeMs = currentTime
        }
        return success
    }

    private fun swipeUp(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val startY = height * 0.78f
        val endY = height * 0.22f
        val duration = prefsManager.swipeDurationMs.coerceIn(150L, 500L)

        val path = Path().apply {
            moveTo(centerX, startY)
            lineTo(centerX, endY)
        }
        return dispatchSwipe(path, duration)
    }

    private fun swipeDown(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val startY = height * 0.22f
        val endY = height * 0.78f
        val duration = prefsManager.swipeDurationMs.coerceIn(150L, 500L)

        val path = Path().apply {
            moveTo(centerX, startY)
            lineTo(centerX, endY)
        }
        return dispatchSwipe(path, duration)
    }

    private fun singleTapCenter(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val centerY = height / 2.0f

        val path = Path().apply {
            moveTo(centerX, centerY)
        }
        return dispatchSwipe(path, 80L)
    }

    private fun dispatchSwipe(path: Path, durationMs: Long): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            return false
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder()
            .addStroke(stroke)
            .build()

        return dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
            }
        }, null)
    }

    private fun getScreenDimensions(): Pair<Int, Int> {
        val metrics = resources.displayMetrics
        val width = if (metrics.widthPixels > 0) metrics.widthPixels else 1080
        val height = if (metrics.heightPixels > 0) metrics.heightPixels else 2400
        return Pair(width, height)
    }

    private fun broadcastStateChange() {
        val intent = Intent("com.voicescroll.app.ACTION_STATE_CHANGED")
        sendBroadcast(intent)
    }
}

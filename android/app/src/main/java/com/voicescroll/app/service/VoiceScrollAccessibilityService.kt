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

/**
 * Android AccessibilityService responsible for executing dynamic screen swipe gestures.
 * 
 * Safety & Privacy:
 * - Does NOT read text or intercept passwords or sensitive info (canRetrieveWindowContent=false).
 * - Coordinates are dynamically calculated from DisplayMetrics (safe center region, avoiding side buttons).
 * - Enforces anti-spam cooldown to prevent runaway repeated swipes.
 */
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

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Minimal event consumption - we do not inspect other apps' contents
    }

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

    /**
      * Dispatches gesture based on CommandType (NEXT -> Swipe Up, PREVIOUS -> Swipe Down).
      * Returns true if gesture was accepted by Android framework.
      */
    fun performAction(command: CommandType): Boolean {
        val currentTime = System.currentTimeMillis()
        val cooldown = prefsManager.cooldownMs.coerceAtLeast(300L)
        if (currentTime - lastGestureTimeMs < cooldown) {
            Log.d(TAG, "Cooldown active (${currentTime - lastGestureTimeMs}ms < ${cooldown}ms), suppressing repeat")
            return false
        }

        // Verify runtime gesture capability
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val capabilities = serviceInfo?.capabilities ?: 0
            val hasGestureCap = (capabilities and android.accessibilityservice.AccessibilityServiceInfo.CAPABILITY_CAN_PERFORM_GESTURES) != 0
            Log.d(TAG, "Runtime check: canPerformGestures capability=$hasGestureCap (flags=${serviceInfo?.flags})")
        }

        Log.i(TAG, "performAction invoked with command: $command")

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
                // Optional single-tap in center if user explicitly configured it
                singleTapCenter()
            }
            CommandType.NONE -> false
        }

        if (success) {
            lastGestureTimeMs = currentTime
        }
        return success
    }

    /**
     * Executes Swipe Up (Next video in TikTok, YouTube Shorts, Instagram Reels, Facebook).
     * Swipes from safe lower-middle area (78% height) to upper-middle area (22% height).
     * Uses 50% width to stay clear of side buttons (likes, comments, share on right/left edges).
     */
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

        Log.i(TAG, "Executing Swipe UP (NEXT): from ($centerX, $startY) to ($centerX, $endY) in ${duration}ms")
        return dispatchSwipe(path, duration)
    }

    /**
     * Executes Swipe Down (Previous video).
     * Swipes from safe upper-middle area (22% height) to lower-middle area (78% height).
     */
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

        Log.i(TAG, "Executing Swipe DOWN (PREVIOUS): from ($centerX, $startY) to ($centerX, $endY) in ${duration}ms")
        return dispatchSwipe(path, duration)
    }

    /**
     * Optional center tap for play/pause toggle if supported by video app.
     */
    private fun singleTapCenter(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val centerY = height / 2.0f

        val path = Path().apply {
            moveTo(centerX, centerY)
        }

        Log.i(TAG, "Executing single tap center at ($centerX, $centerY)")
        return dispatchSwipe(path, 80L)
    }

    private fun dispatchSwipe(path: Path, durationMs: Long): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            Log.e(TAG, "Cannot dispatch gesture: requires Android N (API 24)+")
            return false
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder()
            .addStroke(stroke)
            .build()

        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.i(TAG, "Gesture completed successfully on screen")
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Gesture cancelled by Android system (screen locked or interrupted)")
            }
        }, null)

        Log.i(TAG, "dispatchGesture system call returned: $dispatched")
        return dispatched
    }

    /**
     * Computes actual display metrics dynamically to ensure compatibility with all screen sizes & aspect ratios.
     */
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

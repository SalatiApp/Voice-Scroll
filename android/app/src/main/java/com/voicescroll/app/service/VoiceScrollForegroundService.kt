package com.voicescroll.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.voicescroll.app.R
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.engine.CommandMatchResult
import com.voicescroll.app.model.CommandType
import com.voicescroll.app.speech.VoiceCommandRecognizer
import com.voicescroll.app.ui.MainActivity

/**
 * Foreground Service that keeps speech recognition alive while user interacts with
 * external video apps (TikTok, YouTube, Instagram, Facebook).
 * Uses Android 14+ microphone foreground service type.
 */
class VoiceScrollForegroundService : Service(), VoiceCommandRecognizer.Callback {

    companion object {
        private const val TAG = "VoiceForegroundService"
        const val CHANNEL_ID = "voice_scroll_service_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.voicescroll.app.ACTION_START"
        const val ACTION_STOP = "com.voicescroll.app.ACTION_STOP"
        const val ACTION_BROADCAST_STATUS = "com.voicescroll.app.BROADCAST_STATUS"

        const val EXTRA_STATUS_TEXT = "extra_status_text"
        const val EXTRA_LAST_COMMAND = "extra_last_command"
        const val EXTRA_LAST_PHRASE = "extra_last_phrase"
        const val EXTRA_IS_LISTENING = "extra_is_listening"
        const val EXTRA_IS_SERVICE_RUNNING = "extra_is_service_running"

        var isRunning = false
            internal set

        fun updateRunningState(running: Boolean) {
            isRunning = running
        }
    }

    private var recognizer: VoiceCommandRecognizer? = null
    private lateinit var prefsManager: PreferencesManager

    override fun onCreate() {
        super.onCreate()
        prefsManager = PreferencesManager(this)
        createNotificationChannel()
        recognizer = VoiceCommandRecognizer(this, this)
        Log.i(TAG, "VoiceScrollForegroundService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        if (action == ACTION_STOP) {
            stopServiceAndControl()
            return START_NOT_STICKY
        }

        isRunning = true
        prefsManager.isVoiceControlActive = true

        val notification = buildNotification(getString(R.string.notification_running_text))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        recognizer?.startListening()
        broadcastStatus(isListening = true, statusText = getString(R.string.status_listening))

        return START_STICKY
    }

    private fun stopServiceAndControl() {
        isRunning = false
        prefsManager.isVoiceControlActive = false
        recognizer?.stopListening()
        broadcastStatus(isListening = false, statusText = getString(R.string.status_stopped))
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        recognizer?.stopListening()
        recognizer = null
        Log.i(TAG, "VoiceScrollForegroundService destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // --- VoiceCommandRecognizer.Callback ---

    override fun onListeningStateChanged(isListening: Boolean, statusMessage: String) {
        broadcastStatus(isListening = isListening, statusText = statusMessage)
    }

    override fun onRmsChanged(rmsdB: Float) {
        // Can be routed to UI visualizer
    }

    override fun onCommandMatched(result: CommandMatchResult) {
        Log.i(TAG, "onCommandMatched received: ${result.command} from '${result.rawText}'")

        if (result.command == CommandType.STOP) {
            stopServiceAndControl()
            return
        }

        val accessibility = VoiceScrollAccessibilityService.instance
        if (accessibility == null) {
            Log.w(TAG, "VoiceScrollAccessibilityService.instance is NULL! Accessibility is not connected.")
            broadcastStatus(
                isListening = true,
                statusText = getString(R.string.msg_accessibility_required),
                command = result.command.name,
                phrase = result.rawText
            )
            return
        }

        val executed = accessibility.performAction(result.command)
        Log.i(TAG, "Accessibility performAction result for ${result.command}: $executed")

        val statusText = if (executed) {
            getString(R.string.status_gesture_dispatched, result.command.displayNameAr)
        } else {
            getString(R.string.status_command_recognized, result.command.displayNameAr)
        }

        broadcastStatus(
            isListening = true,
            statusText = statusText,
            command = result.command.name,
            phrase = result.rawText
        )
    }

    override fun onUnrecognizedSpeech(rawText: String) {
        broadcastStatus(
            isListening = true,
            statusText = getString(R.string.status_not_understood),
            phrase = rawText
        )
    }

    override fun onError(errorCode: Int, errorMessage: String) {
        broadcastStatus(
            isListening = false,
            statusText = getString(R.string.status_error, errorMessage)
        )
    }

    private fun broadcastStatus(
        isListening: Boolean,
        statusText: String,
        command: String? = null,
        phrase: String? = null
    ) {
        val intent = Intent(ACTION_BROADCAST_STATUS).apply {
            putExtra(EXTRA_IS_SERVICE_RUNNING, isRunning)
            putExtra(EXTRA_IS_LISTENING, isListening)
            putExtra(EXTRA_STATUS_TEXT, statusText)
            command?.let { putExtra(EXTRA_LAST_COMMAND, it) }
            phrase?.let { putExtra(EXTRA_LAST_PHRASE, it) }
        }
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, VoiceScrollForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle(getString(R.string.notification_running_title))
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, getString(R.string.btn_stop_voice_control), stopPendingIntent)
            .setOngoing(true)
            .build()
    }
}

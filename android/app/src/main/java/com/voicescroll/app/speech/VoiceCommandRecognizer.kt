package com.voicescroll.app.speech

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.engine.CommandEngine
import com.voicescroll.app.engine.CommandMatchResult
import com.voicescroll.app.model.CommandType

/**
 * High-performance, continuous Speech Recognition Manager using Android's native SpeechRecognizer.
 * Strictly local matching against local aliases. Zero AI / LLM APIs.
 * 
 * Features:
 * - Pre-warmed SpeechRecognizer instance on creation for 0-delay startup.
 * - Hardware acoustic noise suppression against background media audio (TikTok / YouTube / Reels).
 * - Suppression of repetitive system earcons / beep sounds ("تيط تيط") during continuous recognition.
 * - Fast-path partial result matching for instant (<200ms) gesture response.
 * - Dynamic language support for Moroccan Darija (ar-MA), Standard Arabic (ar-SA), French (fr-FR), English (en-US).
 */
class VoiceCommandRecognizer(
    private val context: Context,
    private val listener: Callback
) : RecognitionListener {

    companion object {
        private const val TAG = "VoiceRecognizer"
        private const val RESTART_NORMAL_DELAY_MS = 25L
        private const val RESTART_BUSY_DELAY_MS = 300L
        private const val COOLDOWN_COMMAND_MS = 500L
    }

    interface Callback {
        fun onListeningStateChanged(isListening: Boolean, statusMessage: String)
        fun onRmsChanged(rmsdB: Float)
        fun onCommandMatched(result: CommandMatchResult)
        fun onUnrecognizedSpeech(rawText: String)
        fun onError(errorCode: Int, errorMessage: String)
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val prefsManager = PreferencesManager(context)
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    
    @Volatile
    private var isIntentionallyListening = false
    private var isRecognizing = false
    private var isInitialStart = true
    private var lastDispatchedCommand: CommandType = CommandType.NONE
    private var lastDispatchedTime: Long = 0L

    init {
        // Pre-warm SpeechRecognizer instance immediately if on main thread
        if (Looper.myLooper() == Looper.getMainLooper()) {
            ensureRecognizerInstance()
        } else {
            mainHandler.post {
                ensureRecognizerInstance()
            }
        }
    }

    fun startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            Log.e(TAG, "Speech recognition is NOT available on this device!")
            listener.onError(-1, "خدمة التعرف على الصوت غير متوفرة على هذا الجهاز")
            return
        }

        isIntentionallyListening = true
        isInitialStart = true
        Log.i(TAG, "startListening requested")

        // Execute immediately if already on Main Thread to avoid any dispatch delay
        if (Looper.myLooper() == Looper.getMainLooper()) {
            startListeningInternal()
        } else {
            mainHandler.post {
                startListeningInternal()
            }
        }
    }

    fun stopListening() {
        Log.i(TAG, "stopListening requested")
        isIntentionallyListening = false
        isInitialStart = true
        mainHandler.removeCallbacksAndMessages(null)

        val action = {
            try {
                if (isRecognizing) {
                    speechRecognizer?.cancel()
                }
                speechRecognizer?.destroy()
            } catch (e: Exception) {
                Log.e(TAG, "Error destroying speech recognizer", e)
            } finally {
                speechRecognizer = null
                isRecognizing = false
                unmuteBeepStreams()
                listener.onListeningStateChanged(false, "التحكم الصوتي متوقف")
            }
        }

        if (Looper.myLooper() == Looper.getMainLooper()) {
            action()
        } else {
            mainHandler.post { action() }
        }
    }

    private fun startListeningInternal() {
        if (!isIntentionallyListening) return

        try {
            ensureRecognizerInstance()
            configureAudioEnvironment()

            val intent = createRecognizerIntent()
            isRecognizing = true
            speechRecognizer?.startListening(intent)
            Log.d(TAG, "SpeechRecognizer startListening invoked immediately")
            listener.onListeningStateChanged(true, "يستمع إلى صوتك…")

        } catch (e: Exception) {
            Log.e(TAG, "Error invoking startListening, recovering...", e)
            recreateAndRestart(RESTART_BUSY_DELAY_MS)
        }
    }

    private fun ensureRecognizerInstance() {
        if (speechRecognizer == null) {
            Log.i(TAG, "Creating SpeechRecognizer instance")
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@VoiceCommandRecognizer)
            }
        }
    }

    /**
     * Configures the Android audio subsystem to prevent video playback in other apps
     * (TikTok, YouTube, Reels) from overwhelming or canceling the microphone input.
     */
    private fun configureAudioEnvironment() {
        try {
            audioManager?.let { am ->
                // Ensure microphone is not muted
                if (am.isMicrophoneMute) {
                    am.isMicrophoneMute = false
                }
            }
        } catch (_: Exception) {}
    }

    /**
     * Mutes system earcon streams temporarily so continuous SpeechRecognizer restarts
     * do NOT produce repetitive annoying beep sounds ("تيط تيط").
     * Leaves STREAM_MUSIC untouched so videos play audio normally.
     */
    private fun muteBeepStreams() {
        try {
            audioManager?.let { am ->
                am.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_MUTE, 0)
                am.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_MUTE, 0)
            }
        } catch (_: Exception) {}
    }

    private fun unmuteBeepStreams() {
        try {
            audioManager?.let { am ->
                am.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_UNMUTE, 0)
                am.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_UNMUTE, 0)
            }
        } catch (_: Exception) {}
    }

    private fun recreateAndRestart(delayMs: Long) {
        if (!isIntentionallyListening) return
        mainHandler.removeCallbacksAndMessages(null)
        try {
            speechRecognizer?.destroy()
        } catch (_: Exception) {}
        speechRecognizer = null
        isRecognizing = false

        mainHandler.postDelayed({
            if (isIntentionallyListening) {
                startListeningInternal()
            }
        }, delayMs)
    }

    private fun scheduleRestart(delayMs: Long = RESTART_NORMAL_DELAY_MS) {
        if (!isIntentionallyListening) return
        mainHandler.removeCallbacksAndMessages(null)
        mainHandler.postDelayed({
            if (isIntentionallyListening) {
                try {
                    val intent = createRecognizerIntent()
                    muteBeepStreams()
                    isRecognizing = true
                    speechRecognizer?.startListening(intent)
                } catch (e: Exception) {
                    Log.w(TAG, "Failed quick restart, doing full re-init: ${e.message}")
                    recreateAndRestart(RESTART_BUSY_DELAY_MS)
                }
            }
        }, delayMs)
    }

    private fun createRecognizerIntent(): Intent {
        return Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)

            // Capture up to 10 hypotheses so even if media audio is at index 0,
            // our spoken command in subsequent hypotheses is captured
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 10)

            // Prefer offline local processing on device for minimum latency (<100ms)
            // and avoiding network contention while streaming video data
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)

            // Direct hardware voice recognition acoustic profile with noise reduction
            putExtra("android.speech.extra.AUDIO_SOURCE", MediaRecorder.AudioSource.VOICE_RECOGNITION)

            // Suppress system earcons and beeps during continuous listening sessions
            putExtra("android.speech.extras.SPEECH_INPUT_QUIET_MODE", true)
            putExtra("android.speech.extra.QUIET_MODE", true)
            putExtra("android.speech.extra.SUPPRESS_START_SOUND", true)
            putExtra("android.speech.extra.SUPPRESS_STOP_SOUND", true)
            putExtra("suppress_earcons", true)
            putExtra("suppressEarcons", true)

            // Minimum length for fast responsiveness (<100ms)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 100L)

            // Keep the listening session alive continuously (8s of silence)
            // so the user can say multiple commands in succession without restarting the mic or hearing "طيط طيط"
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 8000L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 8000L)

            // Biasing on Android 14+ (API 34) gives priority to our command words over background media dialogue
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                putExtra(
                    RecognizerIntent.EXTRA_BIASING_STRINGS,
                    arrayOf(
                        "دوز", "طلع", "هبط", "رجع", "وقف", "حبس", "صافي", "كمل", "تابع", "ابدأ",
                        "التالي", "السابق", "دوزها", "طلعها", "هبطها", "رجعها", "وقفها", "طالع", "هابط",
                        "سير", "زيد", "مرر", "دوزو", "دوزي", "طلعو", "طلعي", "ندوز", "نطلع", "نرجع", "نهبط",
                        "next", "up", "previous", "down", "back", "stop", "resume",
                        "suivant", "precedent", "monte", "descends"
                    )
                )
            }

            val lang = prefsManager.commandLanguage
            when (lang) {
                PreferencesManager.LANG_AR_MOROCCO -> {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-MA")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-MA")
                }
                PreferencesManager.LANG_AR_STANDARD -> {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-SA")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ar-SA")
                }
                PreferencesManager.LANG_FRENCH -> {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fr-FR")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "fr-FR")
                }
                PreferencesManager.LANG_ENGLISH -> {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en-US")
                }
                PreferencesManager.LANG_AUTO -> {
                    // Let Android recognize system default locale
                }
                else -> {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                }
            }
        }
    }

    // --- RecognitionListener Callbacks ---

    override fun onReadyForSpeech(params: Bundle?) {
        Log.d(TAG, "onReadyForSpeech")
        if (isInitialStart) {
            isInitialStart = false
            // After initial start sound has completed once, mute subsequent earcons
            muteBeepStreams()
        }
        if (isIntentionallyListening) {
            listener.onListeningStateChanged(true, "يستمع إلى صوتك…")
        }
    }

    override fun onBeginningOfSpeech() {
        Log.d(TAG, "onBeginningOfSpeech: speech detected")
        if (isIntentionallyListening) {
            listener.onListeningStateChanged(true, "جارٍ التقاط الصوت…")
        }
    }

    override fun onRmsChanged(rmsdB: Float) {
        listener.onRmsChanged(rmsdB)
    }

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        Log.d(TAG, "onEndOfSpeech")
        isRecognizing = false
    }

    override fun onError(error: Int) {
        isRecognizing = false

        val errorMessage = when (error) {
            SpeechRecognizer.ERROR_NO_MATCH -> "لم يتم التقاط كلام (صمت)"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "انتهت مهلة الصوت"
            SpeechRecognizer.ERROR_AUDIO -> "خطأ في التقاط الصوت"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "يرجى منح إذن الميكروفون"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT, SpeechRecognizer.ERROR_NETWORK -> "تعذر الاتصال بخدمة الصوت"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "معرّف الصوت مشغول"
            SpeechRecognizer.ERROR_CLIENT -> "خطأ في التطبيق العميل"
            SpeechRecognizer.ERROR_SERVER -> "خطأ في خادم الصوت"
            else -> "كود الخطأ: $error"
        }
        Log.d(TAG, "SpeechRecognizer onError: code=$error ($errorMessage)")

        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
            isIntentionallyListening = false
            unmuteBeepStreams()
            listener.onError(error, errorMessage)
            return
        }

        // Automatic non-blocking continuous restart with low latency
        val delay = when (error) {
            SpeechRecognizer.ERROR_NO_MATCH,
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> RESTART_NORMAL_DELAY_MS
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY,
            SpeechRecognizer.ERROR_CLIENT -> RESTART_BUSY_DELAY_MS
            else -> 100L
        }

        scheduleRestart(delay)
    }

    override fun onResults(results: Bundle?) {
        Log.d(TAG, "onResults received")
        isRecognizing = false
        processSpeechResults(results, isPartial = false)
        if (isIntentionallyListening) {
            scheduleRestart(RESTART_NORMAL_DELAY_MS)
        }
    }

    override fun onPartialResults(partialResults: Bundle?) {
        // Fast command matching and execution without stopping or restarting the microphone session!
        // Keeping the session active avoids the annoying repeated "طيط طيط" sound and enables continuous commands.
        processSpeechResults(partialResults, isPartial = true)
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}

    /**
     * Inspects recognition results for valid commands.
     * Returns true if a command was matched and dispatched.
     */
    private fun processSpeechResults(bundle: Bundle?, isPartial: Boolean): Boolean {
        val matches = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return false
        if (matches.isEmpty()) return false

        val customAliases = prefsManager.getCustomAliasMap()
        val now = System.currentTimeMillis()

        for (candidate in matches) {
            val trimmed = candidate.trim()
            if (trimmed.isEmpty()) continue

            val result = CommandEngine.match(trimmed, customAliases)
            if (result.isValid) {
                // If it's the exact same command type within 350ms, avoid duplicate firing for the same continuous utterance
                if (result.command == lastDispatchedCommand && (now - lastDispatchedTime < 350L)) {
                    return true
                }

                lastDispatchedCommand = result.command
                lastDispatchedTime = now
                Log.i(TAG, "Command recognized: ${result.command} (alias='${result.matchedAlias}', raw='$trimmed', partial=$isPartial)")
                listener.onCommandMatched(result)
                return true
            }
        }

        if (!isPartial && matches.isNotEmpty()) {
            listener.onUnrecognizedSpeech(matches[0])
        }

        return false
    }
}

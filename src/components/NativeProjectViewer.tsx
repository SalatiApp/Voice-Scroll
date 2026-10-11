import React, { useState } from 'react';
import { Folder, FileCode, Download, Check, Copy, Terminal, Layers } from 'lucide-react';

interface FileNode {
  path: string;
  name: string;
  category: 'manifest' | 'config' | 'service' | 'engine' | 'ui' | 'build';
  content: string;
}

const ANDROID_FILES: FileNode[] = [
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.voicescroll.app">

    <!-- Essential Android Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".VoiceScrollApp"
        android:allowBackup="true"
        android:icon="@android:drawable/ic_btn_speak_now"
        android:label="@string/app_name"
        android:roundIcon="@android:drawable/ic_btn_speak_now"
        android:supportsRtl="true"
        android:theme="@style/Theme.VoiceScroll">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity android:name=".ui.TestVoiceActivity" android:exported="false" />
        <activity android:name=".ui.SettingsActivity" android:exported="false" />
        <activity android:name=".ui.CustomAliasesActivity" android:exported="false" />
        <activity android:name=".ui.PrivacyActivity" android:exported="false" />
        <activity android:name=".ui.AboutActivity" android:exported="false" />

        <!-- Foreground Service for background voice listening -->
        <service
            android:name=".service.VoiceScrollForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <!-- Accessibility Service for dispatching dynamic screen gestures -->
        <service
            android:name=".service.VoiceScrollAccessibilityService"
            android:exported="true"
            android:label="@string/accessibility_service_label"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>`
  },
  {
    path: 'android/app/src/main/res/xml/accessibility_service_config.xml',
    name: 'accessibility_service_config.xml',
    category: 'config',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="false"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100" />`
  },
  {
    path: 'android/app/src/main/java/com/voicescroll/app/service/VoiceScrollAccessibilityService.kt',
    name: 'VoiceScrollAccessibilityService.kt',
    category: 'service',
    content: `package com.voicescroll.app.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.model.CommandType

/**
 * Android AccessibilityService executing dynamic swipe gestures.
 * Computes coordinates dynamically from DisplayMetrics (safe center region, avoiding side buttons).
 */
class VoiceScrollAccessibilityService : AccessibilityService() {

    companion object {
        var instance: VoiceScrollAccessibilityService? = null
            private set
        val isServiceEnabled: Boolean get() = instance != null
    }

    private lateinit var prefsManager: PreferencesManager
    private var lastGestureTimeMs: Long = 0L

    override fun onCreate() {
        super.onCreate()
        instance = this
        prefsManager = PreferencesManager(this)
    }

    fun performAction(command: CommandType): Boolean {
        if (!prefsManager.isVoiceControlActive) return false

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastGestureTimeMs < prefsManager.cooldownMs) return false

        val success = when (command) {
            CommandType.NEXT -> swipeUp()
            CommandType.PREVIOUS -> swipeDown()
            CommandType.STOP -> {
                prefsManager.isVoiceControlActive = false
                true
            }
            CommandType.RESUME -> {
                prefsManager.isVoiceControlActive = true
                true
            }
            CommandType.PAUSE, CommandType.PLAY -> singleTapCenter()
            CommandType.NONE -> false
        }
        if (success) lastGestureTimeMs = currentTime
        return success
    }

    private fun swipeUp(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val startY = height * 0.75f
        val endY = height * 0.22f
        val duration = prefsManager.swipeDurationMs.coerceIn(150L, 600L)

        val path = Path().apply {
            moveTo(centerX, startY)
            lineTo(centerX, endY)
        }
        return dispatchSwipe(path, duration)
    }

    private fun swipeDown(): Boolean {
        val (width, height) = getScreenDimensions()
        val centerX = width / 2.0f
        val startY = height * 0.25f
        val endY = height * 0.78f
        val duration = prefsManager.swipeDurationMs.coerceIn(150L, 600L)

        val path = Path().apply {
            moveTo(centerX, startY)
            lineTo(centerX, endY)
        }
        return dispatchSwipe(path, duration)
    }

    private fun singleTapCenter(): Boolean {
        val (width, height) = getScreenDimensions()
        val path = Path().apply { moveTo(width / 2.0f, height / 2.0f) }
        return dispatchSwipe(path, 80L)
    }

    private fun dispatchSwipe(path: Path, durationMs: Long): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        return dispatchGesture(gesture, null, null)
    }

    private fun getScreenDimensions(): Pair<Int, Int> {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        wm.defaultDisplay.getRealMetrics(metrics)
        return Pair(metrics.widthPixels.coerceAtLeast(1080), metrics.heightPixels.coerceAtLeast(2400))
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/voicescroll/app/engine/CommandEngine.kt',
    name: 'CommandEngine.kt',
    category: 'engine',
    content: `package com.voicescroll.app.engine

import com.voicescroll.app.model.CommandType

/**
 * Centralized, offline Command Engine.
 * Converts spoken phrases in Standard Arabic, Moroccan Darija, French, and English
 * into unified CommandType actions. Zero AI / LLM APIs.
 */
object CommandEngine {

    private val DEFAULT_ALIASES: Map<CommandType, List<String>> = mapOf(
        CommandType.NEXT to listOf(
            // Arabic: التالي، مرر، طلع، دوز
            "التالي", "مرر", "مرّر", "مرر للأعلى", "الفيديو التالي", "دوز", "طلع", "طلع للفوق", "زيد",
            // French: suivant, monte, passe
            "suivant", "suivante", "passe", "fais défiler", "vers le haut", "monte",
            // English: next, scroll up, swipe up
            "next", "next video", "scroll up", "swipe up", "up"
        ),
        CommandType.PREVIOUS to listOf(
            // Arabic: السابق، ارجع، هبط، رجوع
            "السابق", "ارجع", "رجوع", "الفيديو السابق", "مرر للأسفل", "هبط", "هبط لتحت",
            // French: précédent, retour, descends
            "précédent", "retour", "reviens", "vers le bas", "descend",
            // English: previous, back, scroll down
            "previous", "previous video", "back", "scroll down", "swipe down", "down"
        ),
        CommandType.STOP to listOf(
            "توقف", "وقف", "حبس", "أوقف", "صافي", "بركة", "stop", "arrête"
        ),
        CommandType.RESUME to listOf(
            "تابع", "استمر", "كمل", "ابدأ", "continue", "resume", "start"
        )
    )

    fun match(rawText: String?, customAliases: Map<String, CommandType> = emptyMap()): CommandMatchResult {
        val normalized = ArabicNormalizer.normalize(rawText)
        if (normalized.isEmpty()) return CommandMatchResult(CommandType.NONE, "", rawText ?: "")

        // 1. Check custom aliases first
        for ((word, cmd) in customAliases) {
            val normCustom = ArabicNormalizer.normalize(word)
            if (normCustom.isNotEmpty() && (normalized == normCustom || normalized.contains(normCustom))) {
                return CommandMatchResult(cmd, word, rawText ?: "")
            }
        }

        // 2. Exact match in built-in dictionary
        for ((cmd, aliases) in DEFAULT_ALIASES) {
            for (alias in aliases) {
                val normAlias = ArabicNormalizer.normalize(alias)
                if (normalized == normAlias || normalized.contains(normAlias)) {
                    return CommandMatchResult(cmd, alias, rawText ?: "")
                }
            }
        }

        return CommandMatchResult(CommandType.NONE, "", rawText ?: "")
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/voicescroll/app/service/VoiceScrollForegroundService.kt',
    name: 'VoiceScrollForegroundService.kt',
    category: 'service',
    content: `package com.voicescroll.app.service

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.voicescroll.app.R
import com.voicescroll.app.speech.VoiceCommandRecognizer

class VoiceScrollForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "voice_scroll_service_channel"
        var isRunning = false
            private set
    }
    // Listens for speech commands in background while user scrolls TikTok, Reels, etc.
}`
  },
  {
    path: 'android/app/build.gradle',
    name: 'app/build.gradle',
    category: 'build',
    content: `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.voicescroll.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.voicescroll.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}`
  }
];

export const NativeProjectViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/VoiceScroll-Android-Native-Source.zip');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const binaryBlob = new Blob([blob], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(binaryBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'VoiceScroll-Android-Native-Source.zip';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch {
      window.location.href = '/VoiceScroll-Android-Native-Source.zip';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            مستكشف كود مشروع Android Native المصدري
          </h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {ANDROID_FILES.length} ملفات أساسية
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/VoiceScroll-Android-Native-Source.zip"
            download="VoiceScroll-Android-Native-Source.zip"
            onClick={handleDownloadZip}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تحميل المشروع كاملاً (.ZIP)
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
        {/* File tree sidebar */}
        <div className="md:col-span-4 p-3 bg-slate-950/40 border-b md:border-b-0 md:border-l border-slate-800 space-y-1">
          <div className="px-2 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            ملفات Android Studio
          </div>
          {ANDROID_FILES.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                selectedFile.path === file.path
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                {file.category}
              </span>
            </button>
          ))}

          <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
            <div className="text-white font-bold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              أمر البناء في Terminal:
            </div>
            <code className="block bg-slate-950 p-1.5 rounded text-cyan-300 font-mono text-[10px] dir-ltr text-left">
              ./gradlew assembleRelease
            </code>
          </div>
        </div>

        {/* Code display */}
        <div className="md:col-span-8 flex flex-col bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="truncate dir-ltr text-left">{selectedFile.path}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto overflow-y-auto max-h-[460px] leading-relaxed dir-ltr text-left selection:bg-cyan-500/30">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

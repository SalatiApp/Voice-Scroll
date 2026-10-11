package com.voicescroll.app.ui

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ImageButton
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import com.voicescroll.app.R
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.service.VoiceScrollAccessibilityService
import com.voicescroll.app.service.VoiceScrollForegroundService

class MainActivity : Activity() {

    companion object {
        private const val REQ_CODE_RECORD_AUDIO = 201
    }

    private lateinit var prefsManager: PreferencesManager

    private lateinit var tvStatusDot: TextView
    private lateinit var tvStatusText: TextView
    private lateinit var tvLastCommandInfo: TextView
    private lateinit var btnToggleVoice: Button
    private lateinit var tvAccessibilityStatus: TextView
    private lateinit var btnFixAccessibility: Button
    private lateinit var spinnerLanguage: Spinner

    private val statusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == VoiceScrollForegroundService.ACTION_BROADCAST_STATUS) {
                val isServiceRunning = intent.getBooleanExtra(
                    VoiceScrollForegroundService.EXTRA_IS_SERVICE_RUNNING,
                    VoiceScrollForegroundService.isRunning
                )
                val isListening = intent.getBooleanExtra(VoiceScrollForegroundService.EXTRA_IS_LISTENING, false)
                val statusText = intent.getStringExtra(VoiceScrollForegroundService.EXTRA_STATUS_TEXT) ?: ""
                val phrase = intent.getStringExtra(VoiceScrollForegroundService.EXTRA_LAST_PHRASE)
                VoiceScrollForegroundService.updateRunningState(isServiceRunning)
                updateControlState()
                updateStatusDisplay(isListening, statusText, phrase)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefsManager = PreferencesManager(this)

        initViews()
        setupListeners()
        setupLanguageSpinner()
    }

    private fun initViews() {
        tvStatusDot = findViewById(R.id.tvStatusDot)
        tvStatusText = findViewById(R.id.tvStatusText)
        tvLastCommandInfo = findViewById(R.id.tvLastCommandInfo)
        btnToggleVoice = findViewById(R.id.btnToggleVoice)
        tvAccessibilityStatus = findViewById(R.id.tvAccessibilityStatus)
        btnFixAccessibility = findViewById(R.id.btnFixAccessibility)
        spinnerLanguage = findViewById(R.id.spinnerLanguage)
    }

    private fun setupListeners() {
        btnToggleVoice.setOnClickListener {
            // Immediate state toggle with 0 delay
            val isCurrentRunning = VoiceScrollForegroundService.isRunning || prefsManager.isVoiceControlActive
            if (isCurrentRunning) {
                stopVoiceControl()
            } else {
                attemptStartVoiceControl()
            }
        }

        btnFixAccessibility.setOnClickListener {
            openAccessibilitySettings()
        }

        findViewById<ImageButton>(R.id.btnOpenSettings).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        findViewById<Button>(R.id.btnOpenTestVoice).setOnClickListener {
            startActivity(Intent(this, TestVoiceActivity::class.java))
        }

        findViewById<Button>(R.id.btnOpenCustomAliases).setOnClickListener {
            startActivity(Intent(this, CustomAliasesActivity::class.java))
        }

        findViewById<TextView>(R.id.tvPrivacyLink).setOnClickListener {
            startActivity(Intent(this, PrivacyActivity::class.java))
        }

        findViewById<TextView>(R.id.tvAboutLink).setOnClickListener {
            startActivity(Intent(this, AboutActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        checkAccessibilityStatus()
        val isServiceActive = VoiceScrollForegroundService.isRunning || prefsManager.isVoiceControlActive
        VoiceScrollForegroundService.updateRunningState(isServiceActive)
        updateControlState()

        val filter = IntentFilter(VoiceScrollForegroundService.ACTION_BROADCAST_STATUS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(statusReceiver, filter)
        }
    }

    override fun onPause() {
        super.onPause()
        try {
            unregisterReceiver(statusReceiver)
        } catch (_: Exception) {}
    }

    private fun setupLanguageSpinner() {
        val languages = listOf(
            "الدارجة المغربية (ar-MA)" to PreferencesManager.LANG_AR_MOROCCO,
            "العربية الفصحى (ar-SA) – لغة الأوامر" to PreferencesManager.LANG_AR_STANDARD,
            "Français (fr-FR)" to PreferencesManager.LANG_FRENCH,
            "English (en-US)" to PreferencesManager.LANG_ENGLISH,
            "تلقائي (Auto)" to PreferencesManager.LANG_AUTO
        )

        val adapter = object : ArrayAdapter<String>(this, R.layout.item_spinner_language, languages.map { it.first }) {
            override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                val view = super.getView(position, convertView, parent) as TextView
                view.textAlignment = View.TEXT_ALIGNMENT_CENTER
                view.gravity = android.view.Gravity.CENTER
                view.isSingleLine = true
                view.ellipsize = android.text.TextUtils.TruncateAt.END
                return view
            }

            override fun getDropDownView(position: Int, convertView: View?, parent: ViewGroup): View {
                val view = super.getDropDownView(position, convertView, parent) as TextView
                view.textAlignment = View.TEXT_ALIGNMENT_CENTER
                view.gravity = android.view.Gravity.CENTER
                view.isSingleLine = true
                view.ellipsize = android.text.TextUtils.TruncateAt.END
                return view
            }
        }
        adapter.setDropDownViewResource(R.layout.item_spinner_language_dropdown)
        spinnerLanguage.adapter = adapter

        val currentLang = prefsManager.commandLanguage
        val selectedIndex = languages.indexOfFirst { it.second == currentLang }.coerceAtLeast(0)
        spinnerLanguage.setSelection(selectedIndex)

        spinnerLanguage.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val chosen = languages[position].second
                if (prefsManager.commandLanguage != chosen) {
                    prefsManager.commandLanguage = chosen
                    if (VoiceScrollForegroundService.isRunning) {
                        Toast.makeText(this@MainActivity, "تم تغيير لغة الأوامر بنجاح", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun attemptStartVoiceControl() {
        if (!VoiceScrollAccessibilityService.isServiceEnabled(this)) {
            showAccessibilityRequiredDialog()
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQ_CODE_RECORD_AUDIO)
                return
            }
        }

        startVoiceControl()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_CODE_RECORD_AUDIO) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startVoiceControl()
            } else {
                showPermissionDeniedDialog()
            }
        }
    }

    private fun startVoiceControl() {
        VoiceScrollForegroundService.updateRunningState(true)
        prefsManager.isVoiceControlActive = true
        updateControlState()

        val serviceIntent = Intent(this, VoiceScrollForegroundService::class.java).apply {
            action = VoiceScrollForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun stopVoiceControl() {
        VoiceScrollForegroundService.updateRunningState(false)
        prefsManager.isVoiceControlActive = false
        updateControlState()

        val serviceIntent = Intent(this, VoiceScrollForegroundService::class.java).apply {
            action = VoiceScrollForegroundService.ACTION_STOP
        }
        startService(serviceIntent)
    }

    private fun checkAccessibilityStatus() {
        val isEnabled = VoiceScrollAccessibilityService.isServiceEnabled(this)
        val params = tvAccessibilityStatus.layoutParams as? ViewGroup.MarginLayoutParams
        if (isEnabled) {
            tvAccessibilityStatus.text = getString(R.string.accessibility_enabled)
            tvAccessibilityStatus.setTextColor(getColor(R.color.accent))
            params?.let {
                it.marginEnd = 0
                tvAccessibilityStatus.layoutParams = it
            }
            btnFixAccessibility.visibility = View.GONE
        } else {
            tvAccessibilityStatus.text = getString(R.string.accessibility_disabled)
            tvAccessibilityStatus.setTextColor(getColor(R.color.accent_red))
            params?.let {
                it.marginEnd = (16 * resources.displayMetrics.density).toInt()
                tvAccessibilityStatus.layoutParams = it
            }
            btnFixAccessibility.visibility = View.VISIBLE
        }
    }

    private fun updateControlState() {
        val isRunning = VoiceScrollForegroundService.isRunning
        if (isRunning) {
            btnToggleVoice.text = getString(R.string.btn_stop_voice_control)
            btnToggleVoice.setBackgroundResource(R.drawable.btn_danger)
            tvStatusDot.text = "●"
            tvStatusDot.setTextColor(getColor(R.color.accent))
            tvStatusText.text = getString(R.string.status_running)
            tvLastCommandInfo.text = "يستمع لأوامرك (دوز، رجع، وقف، كمل…)"
        } else {
            btnToggleVoice.text = getString(R.string.btn_start_voice_control)
            btnToggleVoice.setBackgroundResource(R.drawable.btn_primary)
            tvStatusDot.text = "●"
            tvStatusDot.setTextColor(getColor(R.color.text_muted))
            tvStatusText.text = getString(R.string.status_stopped)
            tvLastCommandInfo.text = "جاهز للبدء"
        }
    }

    private fun updateStatusDisplay(isListening: Boolean, statusText: String, phrase: String?) {
        if (!VoiceScrollForegroundService.isRunning) {
            updateControlState()
            return
        }
        tvStatusText.text = statusText
        if (!phrase.isNullOrBlank()) {
            tvLastCommandInfo.text = "آخر كلام ملتقط: \"$phrase\""
        }
    }

    private fun openAccessibilitySettings() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (_: Exception) {
            val fallback = Intent(Settings.ACTION_SETTINGS)
            startActivity(fallback)
        }
    }

    private fun openAppDetailsSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", packageName, null)
        }
        startActivity(intent)
    }

    private fun showAccessibilityRequiredDialog() {
        val builder = AlertDialog.Builder(this)
            .setTitle("تفعيل إمكانية الوصول")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            builder.setMessage("${getString(R.string.msg_accessibility_required)}\n\n" +
                    "ملاحظة لأندرويد 13 فما فوق:\n" +
                    "إذا ظهرت رسالة 'إعداد مقيد' (Restricted setting)، اضغط على زر 'معلومات التطبيق'، ثم اضغط على القائمة (⋮) أعلى اليمين واختر 'السماح بالإعدادات المقيدة'.")
                .setPositiveButton(getString(R.string.btn_enable_accessibility)) { _, _ ->
                    openAccessibilitySettings()
                }
                .setNeutralButton("معلومات التطبيق") { _, _ ->
                    openAppDetailsSettings()
                }
                .setNegativeButton(getString(R.string.btn_cancel), null)
        } else {
            builder.setMessage(getString(R.string.msg_accessibility_required))
                .setPositiveButton(getString(R.string.btn_enable_accessibility)) { _, _ ->
                    openAccessibilitySettings()
                }
                .setNegativeButton(getString(R.string.btn_cancel), null)
        }
        builder.show()
    }

    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("إذن الميكروفون مطلوب")
            .setMessage(getString(R.string.permission_mic_required))
            .setPositiveButton("فتح إعدادات التطبيق") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }
}

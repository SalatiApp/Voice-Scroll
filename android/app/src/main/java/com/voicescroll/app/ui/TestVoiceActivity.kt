package com.voicescroll.app.ui

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import com.voicescroll.app.R
import com.voicescroll.app.engine.CommandMatchResult
import com.voicescroll.app.speech.VoiceCommandRecognizer

class TestVoiceActivity : Activity(), VoiceCommandRecognizer.Callback {

    companion object {
        private const val REQ_CODE_AUDIO = 101
    }

    private var recognizer: VoiceCommandRecognizer? = null
    private var isTesting = false

    private lateinit var tvTestListeningPrompt: TextView
    private lateinit var btnToggleTestMic: Button
    private lateinit var progressBarAudioLevel: ProgressBar
    private lateinit var tvTestRawSpeech: TextView
    private lateinit var tvTestMatchedCommand: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_test_voice)

        recognizer = VoiceCommandRecognizer(this, this)

        tvTestListeningPrompt = findViewById(R.id.tvTestListeningPrompt)
        btnToggleTestMic = findViewById(R.id.btnToggleTestMic)
        progressBarAudioLevel = findViewById(R.id.progressBarAudioLevel)
        tvTestRawSpeech = findViewById(R.id.tvTestRawSpeech)
        tvTestMatchedCommand = findViewById(R.id.tvTestMatchedCommand)

        btnToggleTestMic.setOnClickListener {
            if (isTesting) {
                stopTesting()
            } else {
                startTestingWithPermission()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        startTestingWithPermission()
    }

    override fun onPause() {
        super.onPause()
        stopTesting()
    }

    override fun onDestroy() {
        super.onDestroy()
        recognizer?.stopListening()
        recognizer = null
    }

    private fun startTestingWithPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQ_CODE_AUDIO)
                return
            }
        }

        isTesting = true
        tvTestListeningPrompt.text = "يستمع… تحدث الآن (دوز، رجع، وقف، طلع…)"
        btnToggleTestMic.text = "إيقاف الاستماع"
        btnToggleTestMic.setBackgroundResource(R.drawable.btn_danger)
        recognizer?.startListening()
    }

    private fun stopTesting() {
        isTesting = false
        recognizer?.stopListening()
        tvTestListeningPrompt.text = "تم إيقاف الاستماع التجريبي"
        btnToggleTestMic.text = "بدء الاختبار"
        btnToggleTestMic.setBackgroundResource(R.drawable.btn_primary)
        progressBarAudioLevel.progress = 0
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_CODE_AUDIO && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startTestingWithPermission()
        }
    }

    // --- VoiceCommandRecognizer.Callback ---

    override fun onListeningStateChanged(isListening: Boolean, statusMessage: String) {
        runOnUiThread {
            if (isTesting) {
                tvTestListeningPrompt.text = statusMessage
            }
        }
    }

    override fun onRmsChanged(rmsdB: Float) {
        runOnUiThread {
            val level = ((rmsdB + 2) * 10).toInt().coerceIn(0, 100)
            progressBarAudioLevel.progress = level
        }
    }

    override fun onCommandMatched(result: CommandMatchResult) {
        runOnUiThread {
            tvTestRawSpeech.text = "\"${result.rawText}\""
            tvTestMatchedCommand.text = "${result.command.displayNameAr} (${result.command.name})"
            tvTestMatchedCommand.setTextColor(getColor(R.color.accent))
        }
    }

    override fun onUnrecognizedSpeech(rawText: String) {
        runOnUiThread {
            tvTestRawSpeech.text = "\"$rawText\""
            tvTestMatchedCommand.text = "لم يطابق أي أمر مسجل"
            tvTestMatchedCommand.setTextColor(getColor(R.color.accent_red))
        }
    }

    override fun onError(errorCode: Int, errorMessage: String) {
        runOnUiThread {
            tvTestListeningPrompt.text = "تنبيه: $errorMessage"
        }
    }
}

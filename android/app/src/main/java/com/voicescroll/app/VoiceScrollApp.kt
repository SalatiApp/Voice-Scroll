package com.voicescroll.app

import android.app.Application
import android.util.Log

class VoiceScrollApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("VoiceScrollApp", "Voice Scroll initialized (100% offline, privacy-first, zero AI APIs)")
    }
}

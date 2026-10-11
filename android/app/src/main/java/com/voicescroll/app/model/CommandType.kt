package com.voicescroll.app.model

/**
 * Standard Command Types supported by Voice Scroll.
 * Strictly local, offline, deterministic enum.
 */
enum class CommandType(val displayNameAr: String, val displayNameEn: String) {
    NEXT("التالي (Swipe Up)", "Next"),
    PREVIOUS("السابق (Swipe Down)", "Previous"),
    STOP("إيقاف الاستماع", "Stop"),
    RESUME("متابعة الاستماع", "Resume"),
    PLAY("تشغيل", "Play"),
    PAUSE("إيقاف مؤقت", "Pause"),
    NONE("غير معروف", "Unknown");

    companion object {
        fun fromString(name: String?): CommandType {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: NONE
        }
    }
}

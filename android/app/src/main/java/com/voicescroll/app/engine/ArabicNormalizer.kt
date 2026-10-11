package com.voicescroll.app.engine

import java.util.regex.Pattern

object ArabicNormalizer {

    private val DIACRITICS_PATTERN = Pattern.compile("[\u064B-\u065F\u0670]")

    /**
     * Normalizes text for reliable matching across Arabic dialects (Darija, Standard), French, and English:
     * - Removes Arabic tashkeel / harakat
     * - Unifies alefs (أ, إ, آ, ٱ -> ا)
     * - Unifies taa marbuta (ة -> ه)
     * - Unifies yeh (ى -> ي)
     * - Normalizes Maghrebi / Persian characters (ڤ, ڥ -> ف, گ, ݣ -> ك, ڨ -> ق)
     * - Removes punctuation and excess whitespace
     * - Converts latin characters to lowercase
     */
    fun normalize(rawText: String?): String {
        if (rawText.isNullOrBlank()) return ""

        var text = rawText.trim().lowercase()

        // Remove Arabic diacritics
        text = DIACRITICS_PATTERN.matcher(text).replaceAll("")

        // Normalize Alef variants
        text = text.replace('أ', 'ا')
            .replace('إ', 'ا')
            .replace('آ', 'ا')
            .replace('ٱ', 'ا')

        // Normalize Taa Marbuta
        text = text.replace('ة', 'ه')

        // Normalize Alef Maqsura
        text = text.replace('ى', 'ي')

        // Normalize Maghrebi dialect letter variants
        text = text.replace('ڤ', 'ف')
            .replace('ڥ', 'ف')
            .replace('گ', 'ك')
            .replace('ݣ', 'ك')
            .replace('ڨ', 'ق')

        // Remove common punctuation and symbols
        text = text.replace(Regex("[,.!?:;\"'\\-_/\\\\()\\[\\]{}~`@#$%^&*+=<>|]"), " ")

        // Collapse whitespace
        text = text.replace(Regex("\\s+"), " ").trim()

        return text
    }
}

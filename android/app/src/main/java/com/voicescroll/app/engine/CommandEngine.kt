package com.voicescroll.app.engine

import com.voicescroll.app.model.CommandType

/**
 * Centralized, offline Command Engine.
 * Converts spoken phrases in Modern Standard Arabic, Moroccan Darija, French, and English
 * into unified CommandType actions. Supports custom user aliases without any remote server or AI.
 */
object CommandEngine {

    // Centralized built-in dictionary
    private val DEFAULT_ALIASES: Map<CommandType, List<String>> = mapOf(
        CommandType.NEXT to listOf(
            // Arabic Standard & Darija - Next / Swipe Up
            "طلع",
            "دوز",
            "التالي",
            "طالع",
            "اطلع",
            "إطلع",
            "طّلع",
            "ططلع",
            "دووز",
            "دوزو",
            "دوزي",
            "دوزها",
            "طلعها",
            "ندوز",
            "نطلع",
            "دوزلي",
            "طلعلي",
            "دوزوا",
            "طلعوا",
            "سير",
            "مرر",
            "مرّر",
            "مرر للاعلي",
            "مرر للأعلى",
            "الفيديو التالي",
            "التالي من فضلك",
            "دوز للفيديو الجاي",
            "طلع للفوق",
            "طلع لفوق",
            "طلع الفيديو",
            "الفيديو الجاي",
            "دوز للي بعد",
            "دوز للفيديو اللي بعدو",
            "زيد",
            "فوق",
            "للفوق",
            // French
            "suivant",
            "suivante",
            "passe",
            "fais defiler",
            "fais défiler",
            "video suivante",
            "vidéo suivante",
            "passe a la suivante",
            "passe à la suivante",
            "vers le haut",
            "monte",
            // English
            "next",
            "next video",
            "scroll",
            "scroll up",
            "swipe up",
            "up"
        ),

        CommandType.PREVIOUS to listOf(
            // Arabic Standard & Darija - Previous / Swipe Down
            "هبط",
            "رجع",
            "ارجع",
            "إرجع",
            "هابط",
            "اهبط",
            "إهبط",
            "هبّط",
            "هود",
            "رجّع",
            "رجعو",
            "رجعي",
            "رجعها",
            "هبطها",
            "نرجع",
            "نهبط",
            "رجعلي",
            "هبطلي",
            "رجعوا",
            "هبطوا",
            "السابق",
            "رجوع",
            "الفيديو السابق",
            "مرر للاسفل",
            "مرر للأسفل",
            "ارجع للفيديو السابق",
            "هبط لتحت",
            "هبط دابا",
            "رجع للفيديو اللي فات",
            "الفيديو اللي فات",
            "الفيديو لي فات",
            "تحت",
            "لتحت",
            // French
            "precedent",
            "précédent",
            "precedente",
            "précédente",
            "retour",
            "reviens",
            "video precedente",
            "vidéo précédente",
            "vers le bas",
            "descends",
            "descend",
            // English
            "previous",
            "previous video",
            "back",
            "go back",
            "scroll down",
            "swipe down",
            "down"
        ),

        CommandType.STOP to listOf(
            // Arabic Standard & Darija - Stop
            "وقف",
            "حبس",
            "صافي",
            "توقف",
            "اوقف",
            "أوقف",
            "وقّف",
            "وقفو",
            "وقفي",
            "وقفها",
            "حبّس",
            "حبسو",
            "حبسي",
            "حبسها",
            "اوكف",
            "بركة",
            "توقف عن الاستماع",
            "وقف الاستماع",
            // French
            "stop",
            "arrete",
            "arrête",
            "arreter",
            "arrêter",
            // English
            "stop",
            "stop listening",
            "halt"
        ),

        CommandType.RESUME to listOf(
            // Arabic Standard & Darija - Resume
            "كمل",
            "كمّل",
            "تابع",
            "استمر",
            "ابدا",
            "ابدأ",
            "استئناف",
            "عاود خدم",
            "بدا",
            "كملها",
            // French
            "continue",
            "continuer",
            "reprendre",
            "recommence",
            "recommencer",
            // English
            "resume",
            "continue",
            "start"
        ),

        CommandType.PAUSE to listOf(
            "ايقاف مؤقت",
            "إيقاف مؤقت",
            "pause"
        ),

        CommandType.PLAY to listOf(
            "شغل",
            "تشغيل",
            "خدم",
            "play",
            "lance"
        )
    )

    // Pre-normalized internal lookup cache for ultra-fast matching
    private val normalizedDefaultMap: MutableMap<String, CommandType> = HashMap()
    private val sortedPhrasesByLength: List<Pair<String, CommandType>>

    init {
        val pairs = mutableListOf<Pair<String, CommandType>>()
        for ((cmd, aliases) in DEFAULT_ALIASES) {
            for (alias in aliases) {
                val norm = ArabicNormalizer.normalize(alias)
                if (norm.isNotEmpty()) {
                    normalizedDefaultMap[norm] = cmd
                    pairs.add(norm to cmd)
                }
            }
        }
        // Sort descending by character length so longer, more specific phrases match first
        sortedPhrasesByLength = pairs.sortedByDescending { it.first.length }
    }

    /**
     * Resolves spoken raw speech into a CommandType.
     * Order of precedence:
     * 1. Custom user aliases (exact & contains)
     * 2. Direct exact normalized match
     * 3. Single-word token match (e.g. user says "عفاك طلع" or "دوز دابا" or "please next")
     * 4. Multi-word phrase containment (longer phrases first)
     */
    fun match(
        rawText: String?,
        customAliases: Map<String, CommandType> = emptyMap()
    ): CommandMatchResult {
        if (rawText.isNullOrBlank()) {
            return CommandMatchResult(CommandType.NONE, "", rawText ?: "")
        }

        val normalized = ArabicNormalizer.normalize(rawText)
        if (normalized.isEmpty()) {
            return CommandMatchResult(CommandType.NONE, "", rawText)
        }

        // 1. Check custom user aliases (normalized)
        for ((customWord, cmd) in customAliases) {
            val normCustom = ArabicNormalizer.normalize(customWord)
            if (normCustom.isNotEmpty()) {
                if (normalized == normCustom || normalized.contains(normCustom)) {
                    return CommandMatchResult(cmd, customWord, rawText)
                }
            }
        }

        // 2. Exact match in built-in dictionary
        normalizedDefaultMap[normalized]?.let { cmd ->
            return CommandMatchResult(cmd, normalized, rawText)
        }

        // 3. Token-based word match (handles speech with background video words or filler words e.g. "كلام دوز", "طلع دابا", "please next")
        // Check tokens in reverse order so the most recently spoken command word takes precedence over earlier words in the buffer
        val words = normalized.split(" ").filter { it.isNotBlank() }
        for (word in words.reversed()) {
            if (word.length >= 2) {
                // Direct word match
                normalizedDefaultMap[word]?.let { cmd ->
                    return CommandMatchResult(cmd, word, rawText)
                }

                // Moroccan Darija / Arabic verb prefix stripping: "ودوز", "فدوز", "ندوز", "نطلع", "نرجع", "نهبط"
                if (word.length >= 3 && (word.startsWith("و") || word.startsWith("ف") || word.startsWith("ن") || word.startsWith("ت") || word.startsWith("ي"))) {
                    val stripped = word.substring(1)
                    normalizedDefaultMap[stripped]?.let { cmd ->
                        return CommandMatchResult(cmd, stripped, rawText)
                    }
                }

                // Suffix stripping: "دوزها", "طلعها", "رجعها", "هبطها", "دوزلي", "طلعلي"
                if (word.length >= 4 && (word.endsWith("ها") || word.endsWith("لي") || word.endsWith("لو") || word.endsWith("هم"))) {
                    val strippedSuffix = word.substring(0, word.length - 2)
                    normalizedDefaultMap[strippedSuffix]?.let { cmd ->
                        return CommandMatchResult(cmd, strippedSuffix, rawText)
                    }
                }

                // Repeated/elongated character collapse: e.g. "دوووز" -> "دوز", "ططلع" -> "طلع", "صااافي" -> "صافي"
                val collapsed = word.replace(Regex("(.)\\1+"), "$1")
                if (collapsed != word && collapsed.length >= 2) {
                    normalizedDefaultMap[collapsed]?.let { cmd ->
                        return CommandMatchResult(cmd, collapsed, rawText)
                    }
                }
            }
        }

        // 4. Substring / phrase matching for natural multi-word phrases (longest phrases first)
        for ((phrase, cmd) in sortedPhrasesByLength) {
            if (normalized.contains(phrase)) {
                return CommandMatchResult(cmd, phrase, rawText)
            }
        }

        return CommandMatchResult(CommandType.NONE, "", rawText)
    }

    /**
     * Returns all default aliases for documentation and UI display.
     */
    fun getDefaultAliases(): Map<CommandType, List<String>> = DEFAULT_ALIASES
}

data class CommandMatchResult(
    val command: CommandType,
    val matchedAlias: String,
    val rawText: String
) {
    val isValid: Boolean
        get() = command != CommandType.NONE
}

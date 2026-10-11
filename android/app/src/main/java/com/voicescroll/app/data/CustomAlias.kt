package com.voicescroll.app.data

import com.voicescroll.app.model.CommandType

data class CustomAlias(
    val id: String = java.util.UUID.randomUUID().toString(),
    val phrase: String,
    val command: CommandType
)

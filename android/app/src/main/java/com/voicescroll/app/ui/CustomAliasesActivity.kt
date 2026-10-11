package com.voicescroll.app.ui

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.BaseAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ListView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import com.voicescroll.app.R
import com.voicescroll.app.data.CustomAlias
import com.voicescroll.app.data.PreferencesManager
import com.voicescroll.app.model.CommandType

class CustomAliasesActivity : Activity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var adapter: CustomAliasAdapter
    private val aliasList = mutableListOf<CustomAlias>()

    private lateinit var btnAddNewAlias: Button
    private lateinit var tvEmptyAliases: TextView
    private lateinit var lvCustomAliases: ListView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_aliases)

        prefsManager = PreferencesManager(this)

        btnAddNewAlias = findViewById(R.id.btnAddNewAlias)
        tvEmptyAliases = findViewById(R.id.tvEmptyAliases)
        lvCustomAliases = findViewById(R.id.rvCustomAliases)

        adapter = CustomAliasAdapter(aliasList) { aliasToDelete ->
            prefsManager.removeCustomAlias(aliasToDelete.id)
            Toast.makeText(this, getString(R.string.alias_deleted), Toast.LENGTH_SHORT).show()
            loadAliases()
        }
        lvCustomAliases.adapter = adapter

        btnAddNewAlias.setOnClickListener {
            showAddAliasDialog()
        }

        loadAliases()
    }

    private fun loadAliases() {
        aliasList.clear()
        aliasList.addAll(prefsManager.getCustomAliases())
        adapter.notifyDataSetChanged()

        if (aliasList.isEmpty()) {
            tvEmptyAliases.visibility = View.VISIBLE
            lvCustomAliases.visibility = View.GONE
        } else {
            tvEmptyAliases.visibility = View.GONE
            lvCustomAliases.visibility = View.VISIBLE
        }
    }

    private fun showAddAliasDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_alias, null)
        val etPhrase = dialogView.findViewById<EditText>(R.id.etNewAliasPhrase)
        val spinnerCmd = dialogView.findViewById<Spinner>(R.id.spinnerTargetCommand)

        val commands = listOf(
            CommandType.NEXT to "التالي (Swipe Up)",
            CommandType.PREVIOUS to "السابق (Swipe Down)",
            CommandType.STOP to "توقف عن الاستماع (Stop)",
            CommandType.RESUME to "استئناف الاستماع (Resume)"
        )

        spinnerCmd.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            commands.map { it.second }
        )

        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton(getString(R.string.btn_add)) { _, _ ->
                val phrase = etPhrase.text.toString().trim()
                if (phrase.isEmpty()) {
                    Toast.makeText(this, getString(R.string.err_empty_alias), Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                val selectedCommand = commands[spinnerCmd.selectedItemPosition].first
                prefsManager.addCustomAlias(phrase, selectedCommand)
                Toast.makeText(this, getString(R.string.alias_saved), Toast.LENGTH_SHORT).show()
                loadAliases()
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }

    class CustomAliasAdapter(
        private val items: List<CustomAlias>,
        private val onDeleteClick: (CustomAlias) -> Unit
    ) : BaseAdapter() {

        override fun getCount(): Int = items.size
        override fun getItem(position: Int): Any = items[position]
        override fun getItemId(position: Int): Long = position.toLong()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
            val view = convertView ?: LayoutInflater.from(parent?.context)
                .inflate(R.layout.item_custom_alias, parent, false)

            val item = items[position]
            val tvPhrase = view.findViewById<TextView>(R.id.tvAliasPhrase)
            val tvCommand = view.findViewById<TextView>(R.id.tvAliasCommand)
            val btnDelete = view.findViewById<ImageButton>(R.id.btnDeleteAlias)

            tvPhrase.text = "\"${item.phrase}\""
            tvCommand.text = "= ${item.command.displayNameAr}"
            btnDelete.setOnClickListener {
                onDeleteClick(item)
            }

            return view
        }
    }
}

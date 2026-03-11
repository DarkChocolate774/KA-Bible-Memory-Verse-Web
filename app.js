// Global error catcher — logs any crash to console so we can see it in DevTools
window.addEventListener("error", (e) => {
  console.error("[CRASH] Uncaught error:", e.message, "at", e.filename, e.lineno)
})
window.addEventListener("unhandledrejection", (e) => {
  console.error("[CRASH] Unhandled promise rejection:", e.reason)
})

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC9ree98RpN5OlY5GnzKoLwT04WLxQm3sE",
  authDomain: "scripture-memory-c047d.firebaseapp.com",
  projectId: "scripture-memory-c047d",
  storageBucket: "scripture-memory-c047d.firebasestorage.app",
  messagingSenderId: "875411886063",
  appId: "1:875411886063:web:a4dd8d4b4f620f0d975f82",
  measurementId: "G-1R3VY8M8VE"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

const DEFAULT_VERSES = [
  {
    id: "rom12-1",
    title: "Living Sacrifice",
    ref: "Romans 12:1",
    version: "ESV",
    text: "I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship.",
    collection: "None",
    group: ""
  },
  {
    id: "rom12-2",
    title: "Be Transformed",
    ref: "Romans 12:2",
    version: "ESV",
    text: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.",
    collection: "None",
    group: ""
  }
]

let verses = [...DEFAULT_VERSES]
let selectedVerseId = verses[0]?.id || null
let currentUser = null
let practiceMode = "type"
let dragWords = []
let dragAnswer = []
let dragBankWords = []
let selectedBankWord = ""
let currentGroupName = ""
let currentMoveVerseId = null
let typingReveal = false
let currentBlankedWords = []
let isFirstLetterMode = false
let currentFirstLetterWords = []
let currentTypingVerseWords = []
let currentTypingInput = ""
let selectedCollectionFilter = ""
let selectedGroupFilter = ""
let _isLoadingVerses = false
let _libraryRenderPending = false
let _filterBusy = false
let _lastFilterRebuildTime = 0
let _collectionFiltersCacheKey = ""
let _groupFiltersCacheKey = ""
let _lastRenderedLibraryKey = ""
let _activePage = "practice"

// DOM
const pagePractice = document.getElementById("pagePractice")
const pageLibrary = document.getElementById("pageLibrary")
const pageManage = document.getElementById("pageManage")
const pageTyping = document.getElementById("pageTyping")
const pageDrag = document.getElementById("pageDrag")
const pageFirstLetter = document.getElementById("pageFirstLetter")
const pageMoveVerse = document.getElementById("pageMoveVerse")
const pageImportCsv = document.getElementById("pageImportCsv")

const tabPractice = document.getElementById("tabPractice")
const tabLibrary = document.getElementById("tabLibrary")
const tabManage = document.getElementById("tabManage")

const practiceVerseTitle = document.getElementById("practiceVerseTitle")
const practiceVerseRef = document.getElementById("practiceVerseRef")
const verseText = document.getElementById("verseText")
const btnTypeMode = document.getElementById("btnTypeMode")
const btnDragMode = document.getElementById("btnDragMode")
const btnFirstLetterMode = document.getElementById("btnFirstLetterMode")
const btnShowLibraryManage = document.getElementById("btnShowLibraryManage")

const libraryCollectionFilters = document.getElementById("libraryCollectionFilters")
const libraryGroupFilters = document.getElementById("libraryGroupFilters")
const libraryGrid = document.getElementById("libraryGrid")
const btnAddVerse = document.getElementById("btnAddVerse")
const btnImportCsvPage = document.getElementById("btnImportCsvPage")

const manageCollection = document.getElementById("manageCollection")
const manageGroup = document.getElementById("manageGroup")
const manageTitle = document.getElementById("manageTitle")
const manageRef = document.getElementById("manageRef")
const manageVersion = document.getElementById("manageVersion")
const manageText = document.getElementById("manageText")
const btnSaveVerse = document.getElementById("btnSaveVerse")
const btnDeleteVerse = document.getElementById("btnDeleteVerse")
const manageMsg = document.getElementById("manageMsg")

const typingVerseTitle = document.getElementById("typingVerseTitle")
const typingVerseRef = document.getElementById("typingVerseRef")
const typingPrompt = document.getElementById("typingPrompt")
const typingInput = document.getElementById("typingInput")
const typingStats = document.getElementById("typingStats")
const typingResult = document.getElementById("typingResult")
const btnCheckTyping = document.getElementById("btnCheckTyping")
const btnRevealTyping = document.getElementById("btnRevealTyping")
const btnBackFromTyping = document.getElementById("btnBackFromTyping")

const dragVerseTitle = document.getElementById("dragVerseTitle")
const dragVerseRef = document.getElementById("dragVerseRef")
const dragHint = document.getElementById("dragHint")
const dragPuzzleArea = document.getElementById("dragPuzzleArea")
const dragBank = document.getElementById("dragBank")
const dragResult = document.getElementById("dragResult")
const btnCheckDrag = document.getElementById("btnCheckDrag")
const btnResetDrag = document.getElementById("btnResetDrag")
const btnBackFromDrag = document.getElementById("btnBackFromDrag")

const firstLetterVerseTitle = document.getElementById("firstLetterVerseTitle")
const firstLetterVerseRef = document.getElementById("firstLetterVerseRef")
const firstLetterPrompt = document.getElementById("firstLetterPrompt")
const firstLetterInput = document.getElementById("firstLetterInput")
const firstLetterStats = document.getElementById("firstLetterStats")
const firstLetterResult = document.getElementById("firstLetterResult")
const btnCheckFirstLetter = document.getElementById("btnCheckFirstLetter")
const btnRevealFirstLetter = document.getElementById("btnRevealFirstLetter")
const btnBackFromFirstLetter = document.getElementById("btnBackFromFirstLetter")

const moveVerseTitle = document.getElementById("moveVerseTitle")
const moveVerseSelect = document.getElementById("moveVerseSelect")
const moveCollectionSelect = document.getElementById("moveCollectionSelect")
const moveGroupSelect = document.getElementById("moveGroupSelect")
const moveNewGroupInput = document.getElementById("moveNewGroupInput")
const btnSaveMoveVerse = document.getElementById("btnSaveMoveVerse")
const btnBackFromMoveVerse = document.getElementById("btnBackFromMoveVerse")
const moveVerseMsg = document.getElementById("moveVerseMsg")

let csvFileInput = document.getElementById("csvFileInput")
const importCollectionSelect = document.getElementById("importCollectionSelect")
const importGroupSelect = document.getElementById("importGroupSelect")
const importNewGroupInput = document.getElementById("importNewGroupInput")
const btnImportCsv = document.getElementById("btnImportCsv")
const btnBackFromImportCsv = document.getElementById("btnBackFromImportCsv")
const importCsvMsg = document.getElementById("importCsvMsg")

function sanitizeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function normalizeWord(word) {
  return String(word || "")
    .replace(/[“”‘’]/g, "")
    .replace(/[^\p{L}\p{N}']/gu, "")
    .toLowerCase()
}

function tokenizeVerse(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function getSelectedVerse() {
  return verses.find(v => v.id === selectedVerseId) || verses[0] || null
}

function setPracticeEnabled(enabled) {
  btnTypeMode.disabled = !enabled
  btnDragMode.disabled = !enabled
  btnFirstLetterMode.disabled = !enabled
}

function setTypingEnabled(enabled) {
  typingInput.disabled = !enabled
  btnCheckTyping.disabled = !enabled
  btnRevealTyping.disabled = !enabled
  btnCheckFirstLetter.disabled = !enabled
  btnRevealFirstLetter.disabled = !enabled
  firstLetterInput.disabled = !enabled
}

function showPage(name) {
  _activePage = name

  ;[
    pagePractice,
    pageLibrary,
    pageManage,
    pageTyping,
    pageDrag,
    pageFirstLetter,
    pageMoveVerse,
    pageImportCsv
  ].forEach(p => p.classList.add("isHidden"))

  ;[tabPractice, tabLibrary, tabManage].forEach(t => t.classList.remove("active"))

  if (name === "practice") {
    pagePractice.classList.remove("isHidden")
    tabPractice.classList.add("active")
    return
  }

  if (name === "library") {
    pageLibrary.classList.remove("isHidden")
    tabLibrary.classList.add("active")
    renderLibrary()
    return
  }

  if (name === "manage") {
    pageManage.classList.remove("isHidden")
    tabManage.classList.add("active")
    return
  }

  if (name === "typing") {
    pageTyping.classList.remove("isHidden")
    return
  }

  if (name === "drag") {
    pageDrag.classList.remove("isHidden")
    return
  }

  if (name === "firstletter") {
    pageFirstLetter.classList.remove("isHidden")
    return
  }

  if (name === "move") {
    pageMoveVerse.classList.remove("isHidden")
    return
  }

  if (name === "importcsv") {
    pageImportCsv.classList.remove("isHidden")
  }
}

function getAllCollectionNames() {
  const names = new Set()
  verses.forEach(v => {
    const name = String(v.collection || "None").trim() || "None"
    names.add(name)
  })
  return ["All", ...Array.from(names).sort((a, b) => a.localeCompare(b))]
}

function getAllGroupNamesForCollection(collectionName) {
  const names = new Set()
  verses.forEach(v => {
    const vCollection = String(v.collection || "None").trim() || "None"
    const vGroup = String(v.group || "").trim()
    if (collectionName && collectionName !== "All" && vCollection !== collectionName) return
    if (vGroup) names.add(vGroup)
  })
  return Array.from(names).sort((a, b) => a.localeCompare(b))
}

function getFilteredVerses() {
  return verses.filter(v => {
    const vCollection = String(v.collection || "None").trim() || "None"
    const vGroup = String(v.group || "").trim()

    const collectionPass = !selectedCollectionFilter || selectedCollectionFilter === "All" || vCollection === selectedCollectionFilter
    const groupPass = !selectedGroupFilter || vGroup === selectedGroupFilter

    return collectionPass && groupPass
  })
}

function renderCollectionFilters() {
  const names = getAllCollectionNames()
  const cacheKey = JSON.stringify({
    names,
    selectedCollectionFilter
  })

  if (cacheKey === _collectionFiltersCacheKey) return
  _collectionFiltersCacheKey = cacheKey

  _lastFilterRebuildTime = Date.now()
  libraryCollectionFilters.innerHTML = ""

  names.forEach(name => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "chip" + ((selectedCollectionFilter || "All") === name ? " active" : "")
    btn.textContent = name

    btn.addEventListener("click", () => {
      if (Date.now() - _lastFilterRebuildTime < 600) return
      if (_filterBusy) return
      if (selectedCollectionFilter === name) return

      _filterBusy = true
      selectedCollectionFilter = name
      selectedGroupFilter = ""
      _collectionFiltersCacheKey = null
      _groupFiltersCacheKey = null
      renderGroupFilters()
      renderLibrary()

      setTimeout(() => {
        _filterBusy = false
      }, 300)
    })

    libraryCollectionFilters.appendChild(btn)
  })
}

function renderGroupFilters() {
  const collectionName = selectedCollectionFilter || "All"
  const groups = getAllGroupNamesForCollection(collectionName)
  const cacheKey = JSON.stringify({
    collectionName,
    groups,
    selectedGroupFilter
  })

  if (cacheKey === _groupFiltersCacheKey) return
  _groupFiltersCacheKey = cacheKey

  _lastFilterRebuildTime = Date.now()
  libraryGroupFilters.innerHTML = ""

  const allBtn = document.createElement("button")
  allBtn.type = "button"
  allBtn.className = "chip" + (!selectedGroupFilter ? " active" : "")
  allBtn.textContent = "All groups"
  allBtn.addEventListener("click", () => {
    if (Date.now() - _lastFilterRebuildTime < 600) return
    if (_filterBusy) return
    if (!selectedGroupFilter) return

    _filterBusy = true
    selectedGroupFilter = ""
    _groupFiltersCacheKey = null
    renderLibrary()

    setTimeout(() => {
      _filterBusy = false
    }, 300)
  })
  libraryGroupFilters.appendChild(allBtn)

  groups.forEach(itemName => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "chip" + (selectedGroupFilter === itemName ? " active" : "")
    btn.textContent = itemName

    btn.addEventListener("click", () => {
      if (Date.now() - _lastFilterRebuildTime < 600) return
      if (_filterBusy) return

      const nextGroup = selectedGroupFilter === itemName ? "" : itemName
      if (selectedGroupFilter === nextGroup) return

      _filterBusy = true
      selectedGroupFilter = nextGroup
      _groupFiltersCacheKey = null
      renderLibrary()

      setTimeout(() => {
        _filterBusy = false
      }, 300)
    })

    libraryGroupFilters.appendChild(btn)
  })
}

function renderLibrary() {
  if (_libraryRenderPending) return
  _libraryRenderPending = true

  requestAnimationFrame(() => {
    _libraryRenderPending = false
    _renderLibraryNow()
  })
}

function _renderLibraryNow() {
  renderCollectionFilters()
  renderGroupFilters()

  const items = getFilteredVerses()
  const renderKey = JSON.stringify({
    ids: items.map(v => v.id),
    selectedVerseId,
    selectedCollectionFilter,
    selectedGroupFilter
  })

  if (renderKey === _lastRenderedLibraryKey) return
  _lastRenderedLibraryKey = renderKey

  libraryGrid.innerHTML = ""

  if (!items.length) {
    libraryGrid.innerHTML = `<div class="muted">No verses found.</div>`
    return
  }

  items.forEach(v => {
    const card = document.createElement("button")
    card.type = "button"
    card.className = "verseCard" + (selectedVerseId === v.id ? " active" : "")
    card.innerHTML = `
      <div class="verseCardTitle">${sanitizeHtml(v.title || "Untitled")}</div>
      <div class="verseCardRef">${sanitizeHtml(v.ref || "")}${v.version ? " · " + sanitizeHtml(v.version) : ""}</div>
      <div class="verseCardText">${sanitizeHtml(v.text || "")}</div>
      <div class="verseMetaRow">
        <span class="metaPill">${sanitizeHtml(v.collection || "None")}</span>
        ${v.group ? `<span class="metaPill">${sanitizeHtml(v.group)}</span>` : ""}
      </div>
      <div class="verseCardActions">
        <button type="button" class="smallBtn jsMoveVerse" data-id="${sanitizeHtml(v.id)}">Move</button>
        <button type="button" class="smallBtn jsEditVerse" data-id="${sanitizeHtml(v.id)}">Edit</button>
      </div>
    `

    card.addEventListener("click", (e) => {
      const moveBtn = e.target.closest(".jsMoveVerse")
      const editBtn = e.target.closest(".jsEditVerse")

      if (moveBtn) {
        e.preventDefault()
        e.stopPropagation()
        openMoveVerse(v.id)
        return
      }

      if (editBtn) {
        e.preventDefault()
        e.stopPropagation()
        selectedVerseId = v.id
        loadVerse(v.id)
        loadManageForm(v.id)
        showPage("manage")
        return
      }

      selectedVerseId = v.id
      loadVerse(v.id)
      loadManageForm(v.id)
      renderLibrary()
      showPage("practice")
    })

    libraryGrid.appendChild(card)
  })
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id
  practiceVerseTitle.textContent = verse.title || "Untitled"
  practiceVerseRef.textContent = `${verse.ref || ""}${verse.version ? " · " + verse.version : ""}`
  verseText.textContent = verse.text || ""

  prepareTypingMode()
  prepareDragMode()
  prepareFirstLetterMode()
}

function loadManageForm(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id
  manageCollection.value = verse.collection || "None"
  manageGroup.value = verse.group || ""
  manageTitle.value = verse.title || ""
  manageRef.value = verse.ref || ""
  manageVersion.value = verse.version || ""
  manageText.value = verse.text || ""
  manageMsg.textContent = ""
}

function resetManageForm() {
  selectedVerseId = null
  manageCollection.value = "None"
  manageGroup.value = ""
  manageTitle.value = ""
  manageRef.value = ""
  manageVersion.value = ""
  manageText.value = ""
  manageMsg.textContent = ""
}

function prepareTypingMode() {
  const verse = getSelectedVerse()
  if (!verse) {
    typingVerseTitle.textContent = "No verses yet"
    typingVerseRef.textContent = ""
    typingPrompt.textContent = ""
    typingInput.value = ""
    typingStats.textContent = ""
    typingResult.textContent = ""
    setTypingEnabled(false)
    return
  }

  currentTypingVerseWords = tokenizeVerse(verse.text)
  currentTypingInput = ""
  typingReveal = false

  typingVerseTitle.textContent = verse.title || "Untitled"
  typingVerseRef.textContent = `${verse.ref || ""}${verse.version ? " · " + verse.version : ""}`
  typingPrompt.textContent = "Type the verse from memory."
  typingInput.value = ""
  typingStats.textContent = `${currentTypingVerseWords.length} words`
  typingResult.textContent = ""
  setTypingEnabled(true)
}

function checkTypingScore() {
  const verse = getSelectedVerse()
  if (!verse) return

  const expected = tokenizeVerse(verse.text)
  const typed = tokenizeVerse(typingInput.value)
  const maxLen = Math.max(expected.length, typed.length)
  let correct = 0

  for (let i = 0; i < Math.min(expected.length, typed.length); i += 1) {
    if (normalizeWord(expected[i]) === normalizeWord(typed[i])) {
      correct += 1
    }
  }

  const percentage = maxLen ? Math.round((correct / maxLen) * 100) : 0
  typingResult.textContent = `Score: ${percentage}%`
}

function revealTypingVerse() {
  const verse = getSelectedVerse()
  if (!verse) return

  typingInput.value = verse.text || ""
  typingResult.textContent = "Verse revealed."
}

function prepareDragMode() {
  const verse = getSelectedVerse()
  if (!verse) return

  dragVerseTitle.textContent = verse.title || "Untitled"
  dragVerseRef.textContent = `${verse.ref || ""}${verse.version ? " · " + verse.version : ""}`

  const words = tokenizeVerse(verse.text)
  dragWords = words
  dragAnswer = words.map((word, index) => ({
    index,
    word,
    filled: ""
  }))

  const blankCount = Math.min(6, Math.max(3, Math.floor(words.length * 0.25)))
  const indexes = shuffleArray(words.map((_, i) => i)).slice(0, blankCount).sort((a, b) => a - b)

  dragBankWords = indexes.map(i => words[i])
  selectedBankWord = ""

  dragAnswer = dragAnswer.map(item => {
    if (indexes.includes(item.index)) {
      return { ...item, filled: "" }
    }
    return { ...item, filled: item.word }
  })

  dragHint.textContent = "Tap a word from the bank, then tap the blank."
  dragResult.textContent = ""
  renderDragPuzzle()
}

function renderDragPuzzle() {
  dragPuzzleArea.innerHTML = ""
  dragBank.innerHTML = ""

  dragAnswer.forEach((item) => {
    const token = document.createElement("button")
    token.type = "button"

    if (item.filled) {
      token.className = "dragToken filled"
      token.textContent = item.filled
      token.addEventListener("click", () => {
        if (item.word === item.filled) return
        if (!item.filled) return
        dragBankWords.push(item.filled)
        item.filled = ""
        renderDragPuzzle()
      })
    } else {
      token.className = "dragToken blank"
      token.textContent = "_____"
      token.addEventListener("click", () => {
        if (!selectedBankWord) return
        item.filled = selectedBankWord
        const wordIndex = dragBankWords.findIndex(w => w === selectedBankWord)
        if (wordIndex > -1) dragBankWords.splice(wordIndex, 1)
        selectedBankWord = ""
        renderDragPuzzle()
      })
    }

    dragPuzzleArea.appendChild(token)
  })

  dragBankWords.forEach((word) => {
    const chip = document.createElement("button")
    chip.type = "button"
    chip.className = "wordChip" + (selectedBankWord === word ? " active" : "")
    chip.textContent = word
    chip.addEventListener("click", () => {
      selectedBankWord = selectedBankWord === word ? "" : word
      renderDragPuzzle()
    })
    dragBank.appendChild(chip)
  })
}

function checkDragAnswer() {
  const correct = dragAnswer.every(item => item.filled === item.word)
  dragResult.textContent = correct ? "Correct." : "Keep going."
}

function resetDragMode() {
  prepareDragMode()
}

function prepareFirstLetterMode() {
  const verse = getSelectedVerse()
  if (!verse) {
    firstLetterVerseTitle.textContent = "No verses yet"
    firstLetterVerseRef.textContent = ""
    firstLetterPrompt.textContent = ""
    firstLetterInput.value = ""
    firstLetterStats.textContent = ""
    firstLetterResult.textContent = ""
    setTypingEnabled(false)
    return
  }

  currentFirstLetterWords = tokenizeVerse(verse.text)
  const prompt = currentFirstLetterWords
    .map(w => (normalizeWord(w) ? normalizeWord(w)[0] : "_"))
    .join(" ")

  firstLetterVerseTitle.textContent = verse.title || "Untitled"
  firstLetterVerseRef.textContent = `${verse.ref || ""}${verse.version ? " · " + verse.version : ""}`
  firstLetterPrompt.textContent = prompt
  firstLetterInput.value = ""
  firstLetterStats.textContent = `${currentFirstLetterWords.length} words`
  firstLetterResult.textContent = ""
  setTypingEnabled(true)
}

function checkFirstLetterScore() {
  const verse = getSelectedVerse()
  if (!verse) return

  const expected = tokenizeVerse(verse.text)
  const typed = tokenizeVerse(firstLetterInput.value)
  const maxLen = Math.max(expected.length, typed.length)
  let correct = 0

  for (let i = 0; i < Math.min(expected.length, typed.length); i += 1) {
    if (normalizeWord(expected[i]) === normalizeWord(typed[i])) {
      correct += 1
    }
  }

  const percentage = maxLen ? Math.round((correct / maxLen) * 100) : 0
  firstLetterResult.textContent = `Score: ${percentage}%`
}

function revealFirstLetterVerse() {
  const verse = getSelectedVerse()
  if (!verse) return

  firstLetterInput.value = verse.text || ""
  firstLetterResult.textContent = "Verse revealed."
}

function populateManageCollectionOptions() {
  const names = getAllCollectionNames().filter(n => n !== "All")
  const current = manageCollection.value || "None"
  manageCollection.innerHTML = ""
  names.forEach(name => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    manageCollection.appendChild(option)
  })
  if (!names.includes("None")) {
    const option = document.createElement("option")
    option.value = "None"
    option.textContent = "None"
    manageCollection.appendChild(option)
  }
  manageCollection.value = names.includes(current) || current === "None" ? current : "None"
}

function populateMoveCollectionOptions() {
  const names = getAllCollectionNames().filter(n => n !== "All")
  moveCollectionSelect.innerHTML = ""
  names.forEach(name => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    moveCollectionSelect.appendChild(option)
  })
  if (!names.includes("None")) {
    const option = document.createElement("option")
    option.value = "None"
    option.textContent = "None"
    moveCollectionSelect.appendChild(option)
  }
}

function populateMoveGroupOptions(collectionName) {
  const groups = getAllGroupNamesForCollection(collectionName)
  moveGroupSelect.innerHTML = `<option value="">None</option>`
  groups.forEach(name => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    moveGroupSelect.appendChild(option)
  })
}

function populateImportCollectionOptions() {
  const names = getAllCollectionNames().filter(n => n !== "All")
  importCollectionSelect.innerHTML = ""
  names.forEach(name => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    importCollectionSelect.appendChild(option)
  })
  if (!names.includes("None")) {
    const option = document.createElement("option")
    option.value = "None"
    option.textContent = "None"
    importCollectionSelect.appendChild(option)
  }
}

function populateImportGroupOptions(collectionName) {
  const groups = getAllGroupNamesForCollection(collectionName)
  importGroupSelect.innerHTML = `<option value="">None</option>`
  groups.forEach(name => {
    const option = document.createElement("option")
    option.value = name
    option.textContent = name
    importGroupSelect.appendChild(option)
  })
}

function openMoveVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  currentMoveVerseId = id
  moveVerseTitle.textContent = `${verse.title || "Untitled"}${verse.ref ? " · " + verse.ref : ""}`

  populateMoveCollectionOptions()
  moveCollectionSelect.value = verse.collection || "None"

  populateMoveGroupOptions(moveCollectionSelect.value)
  moveGroupSelect.value = verse.group || ""

  moveNewGroupInput.value = ""
  moveVerseMsg.textContent = ""
  showPage("move")
}

async function saveMoveVerse() {
  const verse = verses.find(v => v.id === currentMoveVerseId)
  if (!verse) return

  const newCollection = (moveCollectionSelect.value || "None").trim() || "None"
  const newGroup = (moveNewGroupInput.value.trim() || moveGroupSelect.value || "").trim()

  try {
    if (currentUser && !String(verse.id).startsWith("rom12-")) {
      const verseRef = doc(db, "users", currentUser.uid, "verses", verse.id)
      await updateDoc(verseRef, {
        collection: newCollection,
        group: newGroup,
        updatedAt: serverTimestamp()
      })
    }

    verse.collection = newCollection
    verse.group = newGroup

    moveVerseMsg.textContent = "Verse moved."
    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""
    renderLibrary()
    loadManageForm(verse.id)
    loadVerse(verse.id)
  } catch (error) {
    console.error(error)
    moveVerseMsg.textContent = "Failed to move verse."
  }
}

async function saveVerse() {
  const payload = {
    collection: (manageCollection.value || "None").trim() || "None",
    group: manageGroup.value.trim(),
    title: manageTitle.value.trim(),
    ref: manageRef.value.trim(),
    version: manageVersion.value.trim(),
    text: manageText.value.trim()
  }

  if (!payload.title || !payload.ref || !payload.text) {
    manageMsg.textContent = "Please fill in Title, Reference, and Text."
    return
  }

  try {
    if (selectedVerseId) {
      const existing = verses.find(v => v.id === selectedVerseId)
      if (existing && currentUser && !String(existing.id).startsWith("rom12-")) {
        const verseRef = doc(db, "users", currentUser.uid, "verses", existing.id)
        await updateDoc(verseRef, {
          ...payload,
          updatedAt: serverTimestamp()
        })
      }

      if (existing) {
        Object.assign(existing, payload)
        loadVerse(existing.id)
        loadManageForm(existing.id)
      }
      manageMsg.textContent = "Verse updated."
    } else {
      if (!currentUser) {
        manageMsg.textContent = "Please sign in first."
        return
      }

      const docRef = await addDoc(collection(db, "users", currentUser.uid, "verses"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      verses.push({
        id: docRef.id,
        ...payload
      })

      selectedVerseId = docRef.id
      loadVerse(docRef.id)
      loadManageForm(docRef.id)
      manageMsg.textContent = "Verse added."
    }

    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""
    populateManageCollectionOptions()
    populateMoveCollectionOptions()
    populateImportCollectionOptions()
    renderLibrary()
  } catch (error) {
    console.error(error)
    manageMsg.textContent = "Failed to save verse."
  }
}

async function deleteCurrentVerse() {
  const verse = verses.find(v => v.id === selectedVerseId)
  if (!verse) return

  const ok = window.confirm(`Delete "${verse.title || "this verse"}"?`)
  if (!ok) return

  try {
    if (currentUser && !String(verse.id).startsWith("rom12-")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "verses", verse.id))
    }

    verses = verses.filter(v => v.id !== verse.id)
    selectedVerseId = verses[0]?.id || null

    if (selectedVerseId) {
      loadVerse(selectedVerseId)
      loadManageForm(selectedVerseId)
    } else {
      resetManageForm()
      setPracticeEnabled(false)
    }

    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""
    populateManageCollectionOptions()
    populateMoveCollectionOptions()
    populateImportCollectionOptions()
    renderLibrary()
    manageMsg.textContent = "Verse deleted."
  } catch (error) {
    console.error(error)
    manageMsg.textContent = "Failed to delete verse."
  }
}

async function loadVersesFromCloud() {
  if (_isLoadingVerses) return

  if (!currentUser) {
    verses = [...DEFAULT_VERSES]
    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""
    renderLibrary()
    return
  }

  _isLoadingVerses = true

  if (libraryGrid) {
    libraryGrid.innerHTML = "<div style='padding:12px;color:var(--muted);'>Loading...</div>"
  }

  try {
    const versesRef = collection(db, "users", currentUser.uid, "verses")
    const snapshot = await getDocs(versesRef)

    const cloudVerses = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      cloudVerses.push({
        id: docSnap.id,
        title: data.title || "",
        ref: data.ref || "",
        version: data.version || "",
        text: data.text || "",
        collection: data.collection || "None",
        group: data.group || ""
      })
    })

    verses = [...DEFAULT_VERSES, ...cloudVerses]

    if (!verses.some(v => v.id === selectedVerseId)) {
      selectedVerseId = verses[0]?.id || null
    }

    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""

    populateManageCollectionOptions()
    populateMoveCollectionOptions()
    populateImportCollectionOptions()
    renderCollectionFilters()
    renderGroupFilters()
    renderLibrary()

    if (verses.length > 0) {
      const idToLoad = (selectedVerseId && verses.some(v => v.id === selectedVerseId))
        ? selectedVerseId
        : verses[0].id
      loadVerse(idToLoad)
      loadManageForm(idToLoad)
      setPracticeEnabled(true)
    } else {
      setPracticeEnabled(false)
      practiceVerseTitle.textContent = "No verses yet"
      practiceVerseRef.textContent = ""
      verseText.textContent = "Go to Library to add one."
      setTypingEnabled(false)
    }
  } catch (error) {
    console.error("Load verses failed:", error)
    manageMsg.textContent = "Failed to load cloud verses."
    if (libraryGrid) libraryGrid.innerHTML = ""
  } finally {
    _isLoadingVerses = false
  }
}

function parseCsvText(text) {
  const rows = []
  let current = ""
  let row = []
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      row.push(current)
      current = ""
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1
      row.push(current)
      rows.push(row)
      row = []
      current = ""
    } else {
      current += char
    }
  }

  if (current.length || row.length) {
    row.push(current)
    rows.push(row)
  }

  return rows
}

async function importCsvFile() {
  importCsvMsg.textContent = ""

  const file = csvFileInput?.files?.[0]
  if (!file) {
    importCsvMsg.textContent = "Please choose a CSV file."
    return
  }

  if (!currentUser) {
    importCsvMsg.textContent = "Please sign in first."
    return
  }

  const targetCollection = (importCollectionSelect.value || "None").trim() || "None"
  const targetGroup = (importNewGroupInput.value.trim() || importGroupSelect.value || "").trim()

  try {
    const text = await file.text()
    const rows = parseCsvText(text)

    if (!rows.length) {
      importCsvMsg.textContent = "CSV file is empty."
      return
    }

    const headers = rows[0].map(h => String(h || "").trim().toLowerCase())
    const titleIndex = headers.indexOf("title")
    const refIndex = headers.indexOf("ref")
    const versionIndex = headers.indexOf("version")
    const textIndex = headers.indexOf("text")

    if (titleIndex === -1 || refIndex === -1 || textIndex === -1) {
      importCsvMsg.textContent = "CSV must include title, ref, and text columns."
      return
    }

    const validRows = rows
      .slice(1)
      .map(cols => ({
        title: String(cols[titleIndex] || "").trim(),
        ref: String(cols[refIndex] || "").trim(),
        version: versionIndex > -1 ? String(cols[versionIndex] || "").trim() : "",
        text: String(cols[textIndex] || "").trim()
      }))
      .filter(item => item.title && item.ref && item.text)

    if (!validRows.length) {
      importCsvMsg.textContent = "No valid verse rows found."
      return
    }

    const batch = writeBatch(db)
    const newVerseItems = []

    validRows.forEach(item => {
      const refDoc = doc(collection(db, "users", currentUser.uid, "verses"))
      batch.set(refDoc, {
        ...item,
        collection: targetCollection,
        group: targetGroup,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      newVerseItems.push({
        id: refDoc.id,
        ...item,
        collection: targetCollection,
        group: targetGroup
      })
    })

    await batch.commit()

    verses.push(...newVerseItems)
    _lastRenderedLibraryKey = ""
    _collectionFiltersCacheKey = ""
    _groupFiltersCacheKey = ""
    populateManageCollectionOptions()
    populateMoveCollectionOptions()
    populateImportCollectionOptions()
    renderLibrary()

    importCsvMsg.textContent = `${validRows.length} verse(s) imported.`

    try {
      const newInput = csvFileInput.cloneNode(true)
      csvFileInput.parentNode.replaceChild(newInput, csvFileInput)
      csvFileInput = newInput
    } catch (_) {
      csvFileInput.value = ""
    }
  } catch (error) {
    console.error(error)
    importCsvMsg.textContent = "Import failed."
  }
}

function attachTopLevelEvents() {
  tabPractice.addEventListener("click", () => showPage("practice"))
  tabLibrary.addEventListener("click", () => showPage("library"))
  tabManage.addEventListener("click", () => {
    if (!selectedVerseId) {
      resetManageForm()
    } else {
      loadManageForm(selectedVerseId)
    }
    showPage("manage")
  })

  btnShowLibraryManage.addEventListener("click", () => showPage("library"))

  btnTypeMode.addEventListener("click", () => {
    prepareTypingMode()
    showPage("typing")
  })

  btnDragMode.addEventListener("click", () => {
    prepareDragMode()
    showPage("drag")
  })

  btnFirstLetterMode.addEventListener("click", () => {
    prepareFirstLetterMode()
    showPage("firstletter")
  })

  btnBackFromTyping.addEventListener("click", () => showPage("practice"))
  btnBackFromDrag.addEventListener("click", () => showPage("practice"))
  btnBackFromFirstLetter.addEventListener("click", () => showPage("practice"))

  btnCheckTyping.addEventListener("click", checkTypingScore)
  btnRevealTyping.addEventListener("click", revealTypingVerse)

  btnCheckDrag.addEventListener("click", checkDragAnswer)
  btnResetDrag.addEventListener("click", resetDragMode)

  btnCheckFirstLetter.addEventListener("click", checkFirstLetterScore)
  btnRevealFirstLetter.addEventListener("click", revealFirstLetterVerse)

  btnAddVerse.addEventListener("click", () => {
    resetManageForm()
    populateManageCollectionOptions()
    showPage("manage")
  })

  btnSaveVerse.addEventListener("click", saveVerse)
  btnDeleteVerse.addEventListener("click", deleteCurrentVerse)

  btnImportCsvPage.addEventListener("click", () => {
    populateImportCollectionOptions()
    populateImportGroupOptions(importCollectionSelect.value || "None")
    importNewGroupInput.value = ""
    importCsvMsg.textContent = ""
    showPage("importcsv")
  })

  btnBackFromImportCsv.addEventListener("click", () => showPage("library"))
  btnImportCsv.addEventListener("click", importCsvFile)

  importCollectionSelect.addEventListener("change", () => {
    populateImportGroupOptions(importCollectionSelect.value || "None")
  })

  moveCollectionSelect.addEventListener("change", () => {
    populateMoveGroupOptions(moveCollectionSelect.value || "None")
  })

  btnSaveMoveVerse.addEventListener("click", saveMoveVerse)
  btnBackFromMoveVerse.addEventListener("click", () => showPage("library"))
}

const loginBtn = document.getElementById("btnLogin")
const logoutBtn = document.getElementById("btnLogout")
const authStatus = document.getElementById("authMsg")

loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    console.error(error)
    alert("Google sign in failed.")
  }
})

logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error)
  }
})

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null

  if (currentUser) {
    authStatus.textContent = currentUser.displayName || currentUser.email || "Signed in"
    loginBtn.classList.add("isHidden")
    logoutBtn.classList.remove("isHidden")
  } else {
    authStatus.textContent = "Not signed in"
    loginBtn.classList.remove("isHidden")
    logoutBtn.classList.add("isHidden")
  }

  await loadVersesFromCloud()
})

attachTopLevelEvents()
populateManageCollectionOptions()
populateMoveCollectionOptions()
populateImportCollectionOptions()
renderCollectionFilters()
renderGroupFilters()
renderLibrary()

if (selectedVerseId) {
  loadVerse(selectedVerseId)
  loadManageForm(selectedVerseId)
} else {
  setPracticeEnabled(false)
}

showPage("practice")
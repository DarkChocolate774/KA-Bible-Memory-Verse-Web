const DEFAULT_VERSES = []

let verses = []
let words = []
let hiddenIndexes = []

let selectedVerseId = ""
let currentMode = "type"

let puzzleHidden = []
let puzzleSlots = []

const pagePractice = document.getElementById("pagePractice")
const pageLibrary = document.getElementById("pageLibrary")
const pageGame = document.getElementById("pageGame")
const pageSettings = document.getElementById("pageSettings")

const tabLibrary = document.getElementById("tabLibrary")
const tabSettings = document.getElementById("tabSettings")

const gameTitle = document.getElementById("gameTitle")
const gameRef = document.getElementById("gameRef")

const modeType = document.getElementById("modeType")
const modeDrag = document.getElementById("modeDrag")
const modeLetters = document.getElementById("modeLetters")
const btnBackToLibrary = document.getElementById("btnBackToLibrary")

const verseSelect = document.getElementById("verseSelect")
const verseText = document.getElementById("verseText")
const refText = document.getElementById("refText")
const result = document.getElementById("result")
const stats = document.getElementById("stats")
const answer = document.getElementById("answer")
const answerRow = document.getElementById("answerRow")

const lettersGame = document.getElementById("lettersGame")
const dragGame = document.getElementById("dragGame")
const blankLine = document.getElementById("blankLine")
const wordBank = document.getElementById("wordBank")

const btnRevealOne = document.getElementById("btnRevealOne")
const btnHideMore = document.getElementById("btnHideMore")
const btnHideAll = document.getElementById("btnHideAll")
const btnReset = document.getElementById("btnReset")
const btnGiveHint = document.getElementById("btnGiveHint")
const btnCheck = document.getElementById("btnCheck")

const newRef = document.getElementById("newRef")
const newText = document.getElementById("newText")
const manageMsg = document.getElementById("ManageMsg")
const btnSaveVerse = document.getElementById("btnSaveVerse")
const libraryGrid = document.getElementById("libraryGrid")
const gameVerse = document.getElementById("gameVerse")

function getCustomVerses() {
  const raw = localStorage.getItem("customVerses")
  if (!raw) return []

  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (e) {
    return []
  }
}

function setCustomVerses(list) {
  localStorage.setItem("customVerses", JSON.stringify(list))
}

function refreshVerses() {
  verses = DEFAULT_VERSES.concat(getCustomVerses())
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function setTypingEnabled(enabled) {
  answer.disabled = !enabled
  answer.placeholder = enabled ? "Start typing here." : "Hide words first to type."
}

function setPracticeEnabled(enabled) {
  btnRevealOne.disabled = !enabled
  btnHideMore.disabled = !enabled
  btnHideAll.disabled = !enabled
  btnReset.disabled = !enabled
  btnCheck.disabled = !enabled
  btnGiveHint.disabled = !enabled

  if (!enabled) {
    answer.value = ""
    result.textContent = ""
    result.className = "result"
  }
}

function loadStats() {
  const count = localStorage.getItem("memoryScore") || 0
  stats.textContent = "Verses memorized: " + count
}

function saveScore() {
  let count = Number(localStorage.getItem("memoryScore") || 0)
  count += 1
  localStorage.setItem("memoryScore", String(count))
  stats.textContent = "Verses memorized: " + count
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  refText.textContent = verse.ref
  words = verse.text.split(" ")
  hiddenIndexes = []

  renderVerse()
  answer.value = ""
  result.textContent = ""
  result.className = "result"
}

function loadVerses() {
  refreshVerses()
  verseSelect.innerHTML = ""

  verses.forEach(v => {
    const option = document.createElement("option")
    option.value = v.id
    option.textContent = v.ref
    verseSelect.appendChild(option)
  })

  if (verses.length > 0) {
    setPracticeEnabled(true)
    loadVerse(verses[0].id)
  } else {
    setPracticeEnabled(false)
    refText.textContent = "No verses yet"
    verseText.textContent = "Go to Library to add one."
    setTypingEnabled(false)
  }
}

function rebuildDropdown(selectedId) {
  refreshVerses()
  verseSelect.innerHTML = ""

  if (verses.length === 0) {
    setPracticeEnabled(false)
    refText.textContent = "No verses yet"
    verseText.textContent = "Go to Library to add one."
    setTypingEnabled(false)
    return
  }

  verses.forEach(v => {
    const option = document.createElement("option")
    option.value = v.id
    option.textContent = v.ref
    verseSelect.appendChild(option)
  })

  const idToLoad = selectedId || verses[0].id
  verseSelect.value = idToLoad
  setPracticeEnabled(true)
  loadVerse(idToLoad)
}

function renderVerse() {
  verseText.innerHTML = ""

  words.forEach((word, index) => {
    const span = document.createElement("span")
    span.classList.add("token")

    if (hiddenIndexes.includes(index)) {
      span.classList.add("hidden")
      span.textContent = "__".repeat(word.length)
    } else {
      span.textContent = word
    }

    verseText.appendChild(span)
    verseText.appendChild(document.createTextNode(" "))
  })
}

function hideRandomWord() {
  const visible = words.map((w, i) => i).filter(i => !hiddenIndexes.includes(i))
  if (visible.length === 0) return

  const randomIndex = visible[Math.floor(Math.random() * visible.length)]
  hiddenIndexes.push(randomIndex)

  renderVerse()
  setTypingEnabled(true)
  answer.focus()
}

function revealOneWord() {
  if (hiddenIndexes.length === 0) return
  hiddenIndexes.pop()
  renderVerse()
}

function hideAllWords() {
  hiddenIndexes = words.map((w, i) => i)
  renderVerse()
  setTypingEnabled(true)
  answer.focus()
}

function revealAllWords() {
  hiddenIndexes = []
  renderVerse()
  answer.focus()
}

function toggleHideAll() {
  if (hiddenIndexes.length === words.length) {
    revealAllWords()
    btnHideAll.textContent = "Hide all"
  } else {
    hideAllWords()
    btnHideAll.textContent = "Reveal all"
  }
}

function resetTypeMode() {
  hiddenIndexes = words.map((w, i) => i)
  renderVerse()
  setTypingEnabled(true)
  answer.value = ""
  result.textContent = ""
  result.className = "result"
  answer.focus()
}

function buildDragPuzzle() {
  const rawHideCount = Math.floor(words.length * 0.25)
  const hideCount = Math.max(1, Math.min(5, rawHideCount || 1))
  puzzleHidden = []

  const indexes = words.map((w, i) => i)

  while (puzzleHidden.length < hideCount && indexes.length > 0) {
    const r = Math.floor(Math.random() * indexes.length)
    puzzleHidden.push(indexes.splice(r, 1)[0])
  }

  puzzleSlots = puzzleHidden.map(i => ({
    index: i,
    expected: words[i],
    filled: ""
  }))

  renderDragPuzzle()
}

function renderDragPuzzle() {
  blankLine.innerHTML = ""
  wordBank.innerHTML = ""

  const hiddenSet = new Set(puzzleHidden)

  for (let i = 0; i < words.length; i++) {
    if (hiddenSet.has(i)) {
      const blank = document.createElement("span")
      const slot = puzzleSlots.find(s => s.index === i)

      blank.textContent = slot && slot.filled ? slot.filled : "_____"
      blank.className = slot && slot.filled ? "blank filled" : "blank"

      blank.addEventListener("dragover", e => {
        e.preventDefault()
      })

      blank.addEventListener("drop", e => {
        e.preventDefault()
        const word = e.dataTransfer.getData("text/plain")
        fillBlank(i, word)
      })

      blank.addEventListener("click", () => {
        const currentSlot = puzzleSlots.find(s => s.index === i)
        if (currentSlot) {
          currentSlot.filled = ""
          renderDragPuzzle()
        }
      })

      blankLine.appendChild(blank)
    } else {
      const span = document.createElement("span")
      span.textContent = words[i]
      blankLine.appendChild(span)
    }

    blankLine.appendChild(document.createTextNode(" "))
  }

  const used = new Set(puzzleSlots.map(s => s.filled).filter(Boolean))
  const bankWords = puzzleSlots
    .map(s => s.expected)
    .filter(w => !used.has(w))

  bankWords.sort(() => Math.random() - 0.5)

  bankWords.forEach(w => {
    const pill = document.createElement("span")
    pill.className = "pill"
    pill.textContent = w
    pill.draggable = true

    pill.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", w)
    })

    wordBank.appendChild(pill)
  })
}

function fillBlank(index, word) {
  const slot = puzzleSlots.find(s => s.index === index)
  if (!slot) return

  slot.filled = word
  renderDragPuzzle()
}

function renderLettersGame() {
  lettersGame.innerHTML = ""

  words.forEach((word, index) => {
    const wrapper = document.createElement("span")
    wrapper.className = "letterWord"

    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    const leading = word.match(/^[^a-zA-Z0-9]+/)?.[0] || ""
    const trailing = word.match(/[^a-zA-Z0-9]+$/)?.[0] || ""

    if (!cleanWord) {
      const plain = document.createElement("span")
      plain.className = "fullWord"
      plain.textContent = word
      wrapper.appendChild(plain)
      lettersGame.appendChild(wrapper)
      lettersGame.appendChild(document.createTextNode(" "))
      return
    }

    if (leading) {
      const leadSpan = document.createElement("span")
      leadSpan.className = "fullWord"
      leadSpan.textContent = leading
      wrapper.appendChild(leadSpan)
    }

    const input = document.createElement("input")
    input.type = "text"
    input.maxLength = 1
    input.className = "letterBox"
    input.dataset.index = String(index)
    input.placeholder = "_"

    const fullWord = document.createElement("span")
    fullWord.className = "fullWord isHidden"
    fullWord.textContent = cleanWord

    input.addEventListener("input", () => {
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      input.classList.remove("wrong")

      if (!user) return

      if (user === expected) {
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        moveToNextLetterBox()
      } else {
        input.classList.add("wrong")
      }
    })

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.classList.contains("isHidden")) {
        e.preventDefault()
      }
    })

    wrapper.appendChild(input)
    wrapper.appendChild(fullWord)

    if (trailing) {
      const trailSpan = document.createElement("span")
      trailSpan.className = "fullWord"
      trailSpan.textContent = trailing
      wrapper.appendChild(trailSpan)
    }

    lettersGame.appendChild(wrapper)
    lettersGame.appendChild(document.createTextNode(" "))
  })

  const firstBox = lettersGame.querySelector(".letterBox:not(.isHidden)")
  if (firstBox) firstBox.focus()
}

function moveToNextLetterBox() {
  const next = lettersGame.querySelector(".letterBox:not(.isHidden)")
  if (next) next.focus()
}

function checkTypeMode() {
  const expectedWords = words.map(word =>
    normalize(word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
  ).filter(Boolean)

  const userWords = normalize(answer.value).split(" ").filter(Boolean)

  let correct = 0
  const total = expectedWords.length

  for (let i = 0; i < total; i++) {
    const expected = expectedWords[i] || ""
    const user = userWords[i] || ""

    if (user === expected) {
      correct += 1
    }
  }

  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  result.textContent = correct + "/" + total + " correct. " + percent + "%."
  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkDragMode() {
  if (!puzzleSlots || puzzleSlots.length === 0) {
    result.textContent = "Start a drag game first."
    result.className = "result bad"
    return
  }

  let correct = 0
  let filled = 0

  puzzleSlots.forEach(s => {
    if (s.filled && s.filled.trim() !== "") filled += 1
    if (normalize(s.filled || "") === normalize(s.expected || "")) correct += 1
  })

  const total = puzzleSlots.length
  const pct = Math.round((correct / total) * 100)

  result.textContent = filled + "/" + total + " filled. " + correct + "/" + total + " correct. " + pct + "%."
  result.className = pct === 100 ? "result good" : "result bad"

  if (pct === 100) {
    saveScore()
  }
}

function checkLettersGame() {
  const wrappers = lettersGame.querySelectorAll(".letterWord")

  let correct = 0
  let total = 0

  wrappers.forEach(wrapper => {
    const input = wrapper.querySelector(".letterBox")
    const fullWord = wrapper.querySelector(".fullWord")

    if (!input || !fullWord) return

    total += 1

    if (!fullWord.classList.contains("isHidden")) {
      correct += 1
      return
    }

    const index = Number(input.dataset.index)
    const cleanWord = words[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    const expected = cleanWord.charAt(0).toLowerCase()
    const user = input.value.trim().toLowerCase()

    if (user === expected) {
      correct += 1
      input.classList.add("isHidden")
      fullWord.classList.remove("isHidden")
      input.classList.remove("wrong")
    } else if (user) {
      input.classList.add("wrong")
    }
  })

  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  result.textContent = correct + "/" + total + " correct. " + percent + "%."
  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkCurrentMode() {
  if (currentMode === "drag") {
    checkDragMode()
    return
  }

  if (currentMode === "letters") {
    checkLettersGame()
    return
  }

  checkTypeMode()
}

function revealOneBlank() {
  const empty = puzzleSlots.filter(s => !s.filled)
  if (empty.length === 0) return

  const pick = empty[Math.floor(Math.random() * empty.length)]
  pick.filled = pick.expected
  renderDragPuzzle()
}

function revealOneLetterBox() {
  const wrappers = Array.from(lettersGame.querySelectorAll(".letterWord"))
  const unfinished = wrappers.filter(wrapper => {
    const input = wrapper.querySelector(".letterBox")
    const fullWord = wrapper.querySelector(".fullWord")
    return input && fullWord && fullWord.classList.contains("isHidden")
  })

  if (unfinished.length === 0) return

  const pick = unfinished[Math.floor(Math.random() * unfinished.length)]
  const input = pick.querySelector(".letterBox")
  const fullWord = pick.querySelector(".fullWord")

  input.classList.add("isHidden")
  fullWord.classList.remove("isHidden")
  input.classList.remove("wrong")

  moveToNextLetterBox()
}

function giveHint() {
  if (currentMode === "drag") {
    revealOneBlank()
    return
  }

  if (currentMode === "letters") {
    revealOneLetterBox()
    return
  }

  revealOneWord()
}

function resetCurrentGame() {
  if (currentMode === "drag") {
    buildDragPuzzle()
    result.textContent = ""
    result.className = "result"
    return
  }

  if (currentMode === "letters") {
    renderLettersGame()
    result.textContent = ""
    result.className = "result"
    return
  }

  resetTypeMode()
}

function updatePracticeUI() {
  const isDrag = currentMode === "drag"
  const isLetters = currentMode === "letters"

  verseText.classList.toggle("isHidden", isDrag || isLetters)
  dragGame.classList.toggle("isHidden", !isDrag)
  lettersGame.classList.toggle("isHidden", !isLetters)

  btnRevealOne.classList.toggle("isHidden", isDrag || isLetters)
  btnHideMore.classList.toggle("isHidden", isDrag || isLetters)
  btnHideAll.classList.toggle("isHidden", isDrag || isLetters)

  answerRow.classList.toggle("isHidden", isDrag || isLetters)
}

function applyModeUI() {
  updatePracticeUI()
  btnHideAll.textContent = "Hide All"
  result.textContent = ""
  result.className = "result"

  if (currentMode === "type") {
    resetTypeMode()
    return
  }

  if (currentMode === "drag") {
    setTypingEnabled(false)
    buildDragPuzzle()
    return
  }

  if (currentMode === "letters") {
    setTypingEnabled(false)
    renderLettersGame()
  }
}

function showPage(name) {
  pagePractice.classList.add("isHidden")
  pageLibrary.classList.add("isHidden")
  pageGame.classList.add("isHidden")
  pageSettings.classList.add("isHidden")

  tabLibrary.classList.remove("active")
  tabSettings.classList.remove("active")

  if (name === "practice") {
    pagePractice.classList.remove("isHidden")
    refreshVerses()
    setPracticeEnabled(verses.length > 0)
    return
  }

  if (name === "library") {
    pageLibrary.classList.remove("isHidden")
    tabLibrary.classList.add("active")
    renderLibrary()
    return
  }

  if (name === "game") {
    pageGame.classList.remove("isHidden")
    return
  }

  if (name === "settings") {
    pageSettings.classList.remove("isHidden")
    tabSettings.classList.add("active")
  }
}

function openGamePicker(verseId) {
  refreshVerses()
  const verse = verses.find(v => v.id === verseId)
  if (!verse) return

  selectedVerseId = verseId
  gameTitle.textContent = "Choose a game"
  gameRef.textContent = verse.ref
  gameVerse.textContent = verse.text

  showPage("game")
}

function startSelectedGame(mode) {
  currentMode = mode
  loadVerse(selectedVerseId)
  applyModeUI()
  showPage("practice")
}

function renderLibrary() {
  refreshVerses()
  libraryGrid.innerHTML = ""

  if (verses.length === 0) {
    libraryGrid.textContent = "No verses yet. Add one above."
    return
  }

  verses.forEach(v => {
    const card = document.createElement("div")
    card.className = "customItem"

    const meta = document.createElement("div")
    meta.className = "meta"

    const title = document.createElement("div")
    title.textContent = v.ref

    const preview = document.createElement("small")
    preview.textContent = v.text.slice(0, 80) + (v.text.length > 80 ? "..." : "")

    meta.appendChild(title)
    meta.appendChild(preview)

    const actions = document.createElement("div")
    actions.className = "controls"

    const playBtn = document.createElement("button")
    playBtn.type = "button"
    playBtn.className = "ghost"
    playBtn.textContent = "Play"
    playBtn.addEventListener("click", e => {
      e.stopPropagation()
      openGamePicker(v.id)
    })

    const delBtn = document.createElement("button")
    delBtn.type = "button"
    delBtn.className = "danger"
    delBtn.textContent = "Delete"
    delBtn.addEventListener("click", e => {
      e.stopPropagation()
      confirmDelete(v.id, card)
    })

    actions.appendChild(playBtn)
    actions.appendChild(delBtn)

    card.appendChild(meta)
    card.appendChild(actions)

    card.addEventListener("click", () => openGamePicker(v.id))
    libraryGrid.appendChild(card)
  })
}

function confirmDelete(id, row) {
  row.innerHTML = ""

  const meta = document.createElement("div")
  meta.className = "meta"

  const title = document.createElement("div")
  title.textContent = "Delete this verse?"

  const small = document.createElement("small")
  small.textContent = "This removes it from your browser only."

  meta.appendChild(title)
  meta.appendChild(small)

  const yes = document.createElement("button")
  yes.type = "button"
  yes.className = "danger"
  yes.textContent = "Delete"
  yes.addEventListener("click", () => deleteCustomVerse(id))

  const no = document.createElement("button")
  no.type = "button"
  no.className = "ghost"
  no.textContent = "Cancel"
  no.addEventListener("click", renderLibrary)

  const actions = document.createElement("div")
  actions.className = "controls"

  actions.appendChild(yes)
  actions.appendChild(no)

  row.appendChild(meta)
  row.appendChild(actions)
}

function deleteCustomVerse(id) {
  const custom = getCustomVerses().filter(v => v.id !== id)
  setCustomVerses(custom)

  refreshVerses()

  if (verses.length === 0) {
    verseSelect.innerHTML = ""
    setPracticeEnabled(false)
    refText.textContent = "No verses yet"
    verseText.textContent = "Go to Library to add one."
    setTypingEnabled(false)
    renderLibrary()
    manageMsg.textContent = "Deleted."
    return
  }

  const currentSelected = verseSelect.value
  const stillExists = verses.some(v => v.id === currentSelected)

  rebuildDropdown(stillExists ? currentSelected : verses[0].id)
  renderLibrary()
  manageMsg.textContent = "Deleted."
}

function saveNewVerse() {
  const ref = newRef.value.trim()
  const text = newText.value.trim()

  if (!ref || !text) {
    manageMsg.textContent = "Please fill in reference and verse text."
    return
  }

  const custom = getCustomVerses()
  const item = {
    id: "custom_" + Date.now(),
    ref: ref,
    text: text
  }

  custom.unshift(item)
  setCustomVerses(custom)

  refreshVerses()
  rebuildDropdown(item.id)
  renderLibrary()

  manageMsg.textContent = "Saved."
  newRef.value = ""
  newText.value = ""
  newRef.focus()
}

verseSelect.addEventListener("change", e => {
  loadVerse(e.target.value)
})

btnRevealOne.addEventListener("click", revealOneWord)
btnHideMore.addEventListener("click", hideRandomWord)
btnHideAll.addEventListener("click", toggleHideAll)
btnReset.addEventListener("click", resetCurrentGame)
btnGiveHint.addEventListener("click", giveHint)
btnCheck.addEventListener("click", checkCurrentMode)

btnSaveVerse.addEventListener("click", saveNewVerse)
btnBackToLibrary.addEventListener("click", () => showPage("library"))

tabLibrary.addEventListener("click", () => showPage("library"))
tabSettings.addEventListener("click", () => showPage("settings"))

modeType.addEventListener("click", () => startSelectedGame("type"))
modeDrag.addEventListener("click", () => startSelectedGame("drag"))
modeLetters.addEventListener("click", () => startSelectedGame("letters"))

showPage("library")
loadVerses()
loadStats()
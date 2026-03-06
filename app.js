const DEFAULT_VERSES = []

let titlePuzzleHidden = []
let titlePuzzleSlots = []
let versePuzzleHidden = []
let versePuzzleSlots = []
let selectedTitleBankWord = ""
let selectedVerseBankWord = ""

let titleWords = []
let verseWords = []

let verses = []
let words = []
let hiddenIndexes = []

let selectedVerseId = ""
let currentMode = "type"

let puzzleHidden = []
let puzzleSlots = []
let selectedBankWord = ""
let titleWordCount = 0
let dragDifficulty = 1

const newTitle = document.getElementById("newTitle")
const practiceTitle = document.getElementById("practiceTitle")
const gameMemoryTitle = document.getElementById("gameMemoryTitle")

const pagePractice = document.getElementById("pagePractice")
const pageLibrary = document.getElementById("pageLibrary")
const pageGame = document.getElementById("pageGame")
const pageSettings = document.getElementById("pageSettings")

const tabLibrary = document.getElementById("tabLibrary")
const tabSettings = document.getElementById("tabSettings")

const gameTitle = document.getElementById("gameTitle")
const gameRef = document.getElementById("gameRef")
const gameVerse = document.getElementById("gameVerse")

const modeType = document.getElementById("modeType")
const modeDrag = document.getElementById("modeDrag")
const modeLetters = document.getElementById("modeLetters")
const btnBackToLibrary = document.getElementById("btnBackToLibrary")

const verseText = document.getElementById("verseText")
const result = document.getElementById("result")
const stats = document.getElementById("stats")
const answer = document.getElementById("answer")
const answerRow = document.getElementById("answerRow")

const lettersGame = document.getElementById("lettersGame")
const dragGame = document.getElementById("dragGame")
const blankLine = document.getElementById("blankLine")
const wordBank = document.getElementById("wordBank")

const btnHideAll = document.getElementById("btnHideAll")
const btnReset = document.getElementById("btnReset")
const btnGiveHint = document.getElementById("btnGiveHint")
const btnCheck = document.getElementById("btnCheck")

const pasteBox = document.getElementById("pasteBox")
const btnAutoFill = document.getElementById("btnAutoFill")

const newRef = document.getElementById("newRef")
const newText = document.getElementById("newText")
const manageMsg = document.getElementById("ManageMsg")
const btnSaveVerse = document.getElementById("btnSaveVerse")
const libraryGrid = document.getElementById("libraryGrid")

const themeSelect = document.getElementById("themeSelect")
const settingsMsg = document.getElementById("settingsMsg")
const newVersion = document.getElementById("newVersion")
const btnBackToGame = document.getElementById("btnBackToGame")
const practiceVerseTitle = document.getElementById("practiceVerseTitle")

const titleAnswerRow = document.getElementById("titleAnswerRow")
const titleAnswer = document.getElementById("titleAnswer")

const titleDragSection = document.getElementById("titleDragSection")
const titleBlankLine = document.getElementById("titleBlankLine")
const titleWordBank = document.getElementById("titleWordBank")

const titleLettersSection = document.getElementById("titleLettersSection")
const titleLettersGame = document.getElementById("titleLettersGame")
const verseLettersGame = document.getElementById("verseLettersGame")

function getCustomVerses() {
  const raw = localStorage.getItem("customVerses")
  if (!raw) return []

  try {
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (error) {
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
  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function setTypingEnabled(enabled) {
  answer.disabled = !enabled
  answer.placeholder = enabled ? "Start typing here." : "Hide words first to type."

  if (titleAnswer) {
    titleAnswer.disabled = !enabled
  }
}

function setPracticeEnabled(enabled) {
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
  const count = localStorage.getItem("memoryScore") || "0"
  stats.textContent = "Verses memorized: " + count
}

function saveScore() {
  let count = Number(localStorage.getItem("memoryScore") || 0)
  count += 1
  localStorage.setItem("memoryScore", String(count))
  stats.textContent = "Verses memorized: " + count
}

function getSavedTheme() {
  return localStorage.getItem("memoryTheme") || "sepia"
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme)
  if (themeSelect) themeSelect.value = theme
}

function saveTheme(theme) {
  localStorage.setItem("memoryTheme", theme)
  applyTheme(theme)
  settingsMsg.textContent = "Theme saved."
}

function initTheme() {
  const theme = getSavedTheme()
  applyTheme(theme)
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id

  const fullRef = verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref
  practiceVerseTitle.textContent = fullRef

  titleWords = verse.title ? verse.title.split(/\s+/) : []
  verseWords = verse.text.split(/\s+/)

  if (practiceTitle) {
    practiceTitle.textContent = ""
    practiceTitle.classList.add("isHidden")
  }

  if (titleAnswerRow) {
    titleAnswerRow.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleAnswer) {
    titleAnswer.value = ""
  }

  words = [...verseWords]

  hiddenIndexes = []
  puzzleHidden = []
  puzzleSlots = []
  selectedBankWord = ""

  titleWordCount = titleWords.length

  renderVerse()
  answer.value = ""
  result.textContent = ""
  result.className = "result"
}

function rebuildDropdown(selectedId) {
  refreshVerses()

  if (verses.length === 0) {
    setPracticeEnabled(false)
    practiceVerseTitle.textContent = "No verses yet"
    verseText.textContent = "Go to Library to add one."
    setTypingEnabled(false)
    return
  }

  const idToLoad = selectedId && verses.some(v => v.id === selectedId)
    ? selectedId
    : verses[0].id

  setPracticeEnabled(true)
  loadVerse(idToLoad)
}

function renderVerse() {
  verseText.innerHTML = ""

  words.forEach((word, index) => {
    const span = document.createElement("span")
    span.className = "token"

    if (hiddenIndexes.includes(index)) {
      span.classList.add("hidden")
      span.textContent = "__".repeat(Math.max(1, word.length))
    } else {
      span.textContent = word
    }

    verseText.appendChild(span)
    verseText.appendChild(document.createTextNode(" "))
  })
}

function hideRandomWord() {
  const visible = words.map((word, index) => index).filter(index => !hiddenIndexes.includes(index))
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
  hiddenIndexes = words.map((word, index) => index)
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
    btnHideAll.textContent = "Hide All"
  } else {
    hideAllWords()
    btnHideAll.textContent = "Reveal All"
  }
}

function resetTypeMode() {
  hiddenIndexes = words.map((word, index) => index)
  renderVerse()
  setTypingEnabled(true)
  answer.value = ""
  if (titleAnswer) titleAnswer.value = ""
  result.textContent = ""
  result.className = "result"

  if (titleAnswerRow && !titleAnswerRow.classList.contains("isHidden")) {
    titleAnswer.focus()
  } else {
    answer.focus()
  }
}

function buildDragPuzzle() {

  const difficultyLevels = [0.2, 0.35, 0.5, 0.7, 0.9]
  const ratio = difficultyLevels[Math.min(dragDifficulty - 1, difficultyLevels.length - 1)]

  const hideCount = Math.max(1, Math.floor(verseWords.length * ratio))

  versePuzzleHidden = []
  selectedVerseBankWord = ""

  const indexes = verseWords.map((word, index) => index)

  while (versePuzzleHidden.length < hideCount && indexes.length > 0) {
    const randomPos = Math.floor(Math.random() * indexes.length)
    versePuzzleHidden.push(indexes.splice(randomPos, 1)[0])
  }

  versePuzzleHidden.sort((a, b) => a - b)

  versePuzzleSlots = versePuzzleHidden.map(index => ({
    index,
    expected: verseWords[index],
    filled: ""
  }))

  renderDragPuzzle()
}

function renderDragPuzzle() {
  blankLine.innerHTML = ""
  wordBank.innerHTML = ""

  if (titleDragSection) {
    titleDragSection.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleBlankLine) titleBlankLine.innerHTML = ""
  if (titleWordBank) titleWordBank.innerHTML = ""

  if (titleWords.length > 0 && titleBlankLine && titleWordBank) {
    const titleHiddenSet = new Set(titlePuzzleHidden)

    for (let i = 0; i < titleWords.length; i++) {
      if (titleHiddenSet.has(i)) {
        const blank = document.createElement("span")
        const slot = titlePuzzleSlots.find(s => s.index === i)

        blank.textContent = slot && slot.filled ? slot.filled : "_____"
        blank.className = slot && slot.filled ? "blank filled" : "blank"

        blank.addEventListener("dragover", event => {
          event.preventDefault()
        })

        blank.addEventListener("drop", event => {
          event.preventDefault()
          const word = event.dataTransfer.getData("text/plain")
          fillTitleBlank(i, word)
        })

        blank.addEventListener("click", () => {
          const currentSlot = titlePuzzleSlots.find(s => s.index === i)
          if (!currentSlot) return

          if (selectedTitleBankWord) {
            currentSlot.filled = selectedTitleBankWord
            selectedTitleBankWord = ""
            renderDragPuzzle()
            return
          }

          if (currentSlot.filled) {
            currentSlot.filled = ""
            renderDragPuzzle()
          }
        })

        titleBlankLine.appendChild(blank)
      } else {
        const span = document.createElement("span")
        span.textContent = titleWords[i]
        titleBlankLine.appendChild(span)
      }

      titleBlankLine.appendChild(document.createTextNode(" "))
    }

    const titleBankWords = titlePuzzleSlots
      .filter(slot => !slot.filled)
      .map(slot => slot.expected)

    titleBankWords.sort(() => Math.random() - 0.5)

    titleBankWords.forEach(word => {
      const pill = document.createElement("span")
      pill.className = "pill"
      pill.textContent = word
      pill.draggable = true

      pill.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", word)
      })

      pill.addEventListener("click", () => {
        selectedTitleBankWord = word
        titleWordBank.querySelectorAll(".pill").forEach(p => p.classList.remove("active"))
        pill.classList.add("active")
      })

      titleWordBank.appendChild(pill)
    })
  }

  const verseHiddenSet = new Set(versePuzzleHidden)

  for (let i = 0; i < verseWords.length; i++) {
    if (verseHiddenSet.has(i)) {
      const blank = document.createElement("span")
      const slot = versePuzzleSlots.find(s => s.index === i)

      blank.textContent = slot && slot.filled ? slot.filled : "_____"
      blank.className = slot && slot.filled ? "blank filled" : "blank"

      blank.addEventListener("dragover", event => {
        event.preventDefault()
      })

      blank.addEventListener("drop", event => {
        event.preventDefault()
        const word = event.dataTransfer.getData("text/plain")
        fillVerseBlank(i, word)
      })

      blank.addEventListener("click", () => {
        const currentSlot = versePuzzleSlots.find(s => s.index === i)
        if (!currentSlot) return

        if (selectedVerseBankWord) {
          currentSlot.filled = selectedVerseBankWord
          selectedVerseBankWord = ""
          renderDragPuzzle()
          return
        }

        if (currentSlot.filled) {
          currentSlot.filled = ""
          renderDragPuzzle()
        }
      })

      blankLine.appendChild(blank)
    } else {
      const span = document.createElement("span")
      span.textContent = verseWords[i]
      blankLine.appendChild(span)
    }

    blankLine.appendChild(document.createTextNode(" "))
  }

  const verseBankWords = versePuzzleSlots
    .filter(slot => !slot.filled)
    .map(slot => slot.expected)

  verseBankWords.sort(() => Math.random() - 0.5)

  verseBankWords.forEach(word => {
    const pill = document.createElement("span")
    pill.className = "pill"
    pill.textContent = word
    pill.draggable = true

    pill.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", word)
    })

    pill.addEventListener("click", () => {
      selectedVerseBankWord = word
      wordBank.querySelectorAll(".pill").forEach(p => p.classList.remove("active"))
      pill.classList.add("active")
    })

    wordBank.appendChild(pill)
  })
}

function fillTitleBlank(index, word) {
  const slot = titlePuzzleSlots.find(s => s.index === index)
  if (!slot || !word) return

  slot.filled = word
  selectedTitleBankWord = ""
  renderDragPuzzle()
}

function fillVerseBlank(index, word) {
  const slot = versePuzzleSlots.find(s => s.index === index)
  if (!slot || !word) return

  slot.filled = word
  selectedVerseBankWord = ""
  renderDragPuzzle()
}

function fillBlank(index, word) {
  const slot = puzzleSlots.find(s => s.index === index)
  if (!slot || !word) return

  slot.filled = word
  selectedBankWord = ""
  renderDragPuzzle()
}

function renderLettersGame() {
  if (titleLettersSection) {
    titleLettersSection.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleLettersGame) {
    titleLettersGame.innerHTML = ""
  }

  if (verseLettersGame) {
    verseLettersGame.innerHTML = ""
  }

  if (titleWords.length > 0 && titleLettersGame) {
    renderLetterSection(titleWords, titleLettersGame, "title")
  }

  if (verseLettersGame) {
    renderLetterSection(verseWords, verseLettersGame, "verse")
  }

  const firstBox =
    document.querySelector('#titleLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#verseLettersGame .letterBox:not(.isHidden)')

  if (firstBox) firstBox.focus()
}

function renderLetterSection(sourceWords, container, sectionType) {
  sourceWords.forEach((word, index) => {
    const wrapper = document.createElement("span")
    wrapper.className = "letterWord"

    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    const leading = (word.match(/^[^a-zA-Z0-9]+/) || [""])[0]
    const trailing = (word.match(/[^a-zA-Z0-9]+$/) || [""])[0]

    if (!cleanWord) {
      const plain = document.createElement("span")
      plain.className = "fullWord"
      plain.textContent = word
      wrapper.appendChild(plain)
      container.appendChild(wrapper)
      container.appendChild(document.createTextNode(" "))
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
    input.dataset.section = sectionType
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

    input.addEventListener("keydown", event => {
      if (event.key === "Backspace" && input.classList.contains("isHidden")) {
        event.preventDefault()
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

    container.appendChild(wrapper)
    container.appendChild(document.createTextNode(" "))
  })
}

function moveToNextLetterBox() {
  const next =
    document.querySelector('#titleLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#verseLettersGame .letterBox:not(.isHidden)')

  if (next) next.focus()
}

function checkTypeMode() {
  const expectedTitleWords = titleWords.map(word => normalize(word)).filter(Boolean)
  const expectedVerseWords = verseWords.map(word => normalize(word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))).filter(Boolean)

  const userTitleWords = normalize(titleAnswer ? titleAnswer.value : "").split(" ").filter(Boolean)
  const userVerseWords = normalize(answer.value).split(" ").filter(Boolean)

  let correctTitle = 0
  let correctVerse = 0

  for (let i = 0; i < expectedTitleWords.length; i++) {
    if ((userTitleWords[i] || "") === expectedTitleWords[i]) {
      correctTitle += 1
    }
  }

  for (let i = 0; i < expectedVerseWords.length; i++) {
    if ((userVerseWords[i] || "") === expectedVerseWords[i]) {
      correctVerse += 1
    }
  }

  const total = expectedTitleWords.length + expectedVerseWords.length
  const correct = correctTitle + correctVerse
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (expectedTitleWords.length > 0) {
    result.textContent =
      "Title: " + correctTitle + "/" + expectedTitleWords.length +
      ". Verse: " + correctVerse + "/" + expectedVerseWords.length +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + correctVerse + "/" + expectedVerseWords.length +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkDragMode() {
  let titleCorrect = 0
  let titleFilled = 0
  let titleTotal = titlePuzzleSlots.length

  titlePuzzleSlots.forEach(slot => {
    if (slot.filled && slot.filled.trim() !== "") titleFilled += 1
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) titleCorrect += 1
  })

  let verseCorrect = 0
  let verseFilled = 0
  let verseTotal = versePuzzleSlots.length

  versePuzzleSlots.forEach(slot => {
    if (slot.filled && slot.filled.trim() !== "") verseFilled += 1
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) verseCorrect += 1
  })

  const total = titleTotal + verseTotal
  const correct = titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (titleTotal > 0) {
    result.textContent =
      "Title: " + titleCorrect + "/" + titleTotal +
      ". Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
    dragDifficulty += 1
  }
}

function checkLettersGame() {
  let titleCorrect = 0
  let titleTotal = 0
  let verseCorrect = 0
  let verseTotal = 0

  if (titleLettersGame) {
    const titleWrappers = titleLettersGame.querySelectorAll(".letterWord")

    titleWrappers.forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")

      if (!input || !fullWord) return

      titleTotal += 1

      if (!fullWord.classList.contains("isHidden")) {
        titleCorrect += 1
        return
      }

      const index = Number(input.dataset.index)
      const cleanWord = titleWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      if (user === expected) {
        titleCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        input.classList.remove("wrong")
      } else if (user) {
        input.classList.add("wrong")
      }
    })
  }

  if (verseLettersGame) {
    const verseWrappers = verseLettersGame.querySelectorAll(".letterWord")

    verseWrappers.forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")

      if (!input || !fullWord) return

      verseTotal += 1

      if (!fullWord.classList.contains("isHidden")) {
        verseCorrect += 1
        return
      }

      const index = Number(input.dataset.index)
      const cleanWord = verseWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      if (user === expected) {
        verseCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        input.classList.remove("wrong")
      } else if (user) {
        input.classList.add("wrong")
      }
    })
  }

  const total = titleTotal + verseTotal
  const correct = titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (titleTotal > 0) {
    result.textContent =
      "Title: " + titleCorrect + "/" + titleTotal +
      ". Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

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
  const emptyTitle = titlePuzzleSlots.filter(slot => !slot.filled)
  const emptyVerse = versePuzzleSlots.filter(slot => !slot.filled)

  if (emptyTitle.length > 0) {
    const pick = emptyTitle[Math.floor(Math.random() * emptyTitle.length)]
    pick.filled = pick.expected
    selectedTitleBankWord = ""
    renderDragPuzzle()
    return
  }

  if (emptyVerse.length > 0) {
    const pick = emptyVerse[Math.floor(Math.random() * emptyVerse.length)]
    pick.filled = pick.expected
    selectedVerseBankWord = ""
    renderDragPuzzle()
  }
}

function revealOneLetterBox() {
  const titleUnfinished = titleLettersGame
    ? Array.from(titleLettersGame.querySelectorAll(".letterWord")).filter(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      return input && fullWord && fullWord.classList.contains("isHidden")
    })
    : []

  const verseUnfinished = verseLettersGame
    ? Array.from(verseLettersGame.querySelectorAll(".letterWord")).filter(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      return input && fullWord && fullWord.classList.contains("isHidden")
    })
    : []

  if (titleUnfinished.length > 0) {
    const pick = titleUnfinished[Math.floor(Math.random() * titleUnfinished.length)]
    const input = pick.querySelector(".letterBox")
    const fullWord = pick.querySelector(".fullWord")

    input.classList.add("isHidden")
    fullWord.classList.remove("isHidden")
    input.classList.remove("wrong")
    moveToNextLetterBox()
    return
  }

  if (verseUnfinished.length > 0) {
    const pick = verseUnfinished[Math.floor(Math.random() * verseUnfinished.length)]
    const input = pick.querySelector(".letterBox")
    const fullWord = pick.querySelector(".fullWord")

    input.classList.add("isHidden")
    fullWord.classList.remove("isHidden")
    input.classList.remove("wrong")
    moveToNextLetterBox()
  }
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
    dragDifficulty += 1
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

  btnHideAll.classList.toggle("isHidden", isDrag || isLetters)

  answerRow.classList.toggle("isHidden", isDrag || isLetters)

  if (titleAnswerRow) {
    titleAnswerRow.classList.toggle("isHidden", isDrag || isLetters || titleWords.length === 0)
  }
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
  gameRef.textContent = verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref
  gameVerse.textContent = verse.text

  if (gameMemoryTitle) {
    gameMemoryTitle.textContent = verse.title ? verse.title : ""
    gameMemoryTitle.classList.toggle("isHidden", !verse.title)
  }

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

  verses.forEach(verse => {
    const card = document.createElement("div")
    card.className = "customItem"

    const meta = document.createElement("div")
    meta.className = "meta"

    const title = document.createElement("div")
    title.textContent = verse.title
      ? verse.title + " • " + (verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref)
      : (verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref)

    const preview = document.createElement("small")
    preview.textContent = verse.text.slice(0, 80) + (verse.text.length > 80 ? "..." : "")

    meta.appendChild(title)
    meta.appendChild(preview)

    const actions = document.createElement("div")
    actions.className = "controls"

    const playBtn = document.createElement("button")
    playBtn.type = "button"
    playBtn.className = "ghost"
    playBtn.textContent = "Play"
    playBtn.addEventListener("click", event => {
      event.stopPropagation()
      openGamePicker(verse.id)
    })

    const delBtn = document.createElement("button")
    delBtn.type = "button"
    delBtn.className = "danger"
    delBtn.textContent = "Delete"
    delBtn.addEventListener("click", event => {
      event.stopPropagation()
      confirmDelete(verse.id, card)
    })

    actions.appendChild(playBtn)
    actions.appendChild(delBtn)

    card.appendChild(meta)
    card.appendChild(actions)

    card.addEventListener("click", () => openGamePicker(verse.id))
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
  yes.addEventListener("click", (event) => {
    event.stopPropagation()
    deleteCustomVerse(id)
  })

  const no = document.createElement("button")
  no.type = "button"
  no.className = "ghost"
  no.textContent = "Cancel"
  no.addEventListener("click", (event) => {
    event.stopPropagation()
    showPage("library")
  })

  const actions = document.createElement("div")
  actions.className = "controls"
  actions.appendChild(yes)
  actions.appendChild(no)

  row.appendChild(meta)
  row.appendChild(actions)
}

function saveNewVerse() {
  const title = newTitle.value.trim()
  const ref = newRef.value.trim()
  const version = newVersion.value.trim()
  const text = newText.value.trim()

  if (!ref || !text) {
    manageMsg.textContent = "Please fill in version, reference and verse text."
    return
  }

  const custom = getCustomVerses()
  const item = {
    id: "custom_" + Date.now(),
    title,
    ref,
    version,
    text
  }

  custom.unshift(item)
  setCustomVerses(custom)

  refreshVerses()
  rebuildDropdown(item.id)
  renderLibrary()

  manageMsg.textContent = "Saved."
  pasteBox.value = ""
  newTitle.value = ""
  newRef.value = ""
  newVersion.value = ""
  newText.value = ""
  pasteBox.focus()
}

function deleteCustomVerse(id) {
  const custom = getCustomVerses().filter(verse => verse.id !== id)
  setCustomVerses(custom)

  refreshVerses()

  if (verses.length === 0) {
    setPracticeEnabled(false)
    practiceVerseTitle.textContent = "No verses yet"
    verseText.textContent = "Go to Library to add one."
    setTypingEnabled(false)
    renderLibrary()
    manageMsg.textContent = "Deleted."
    showPage("library")
    return
  }

  const stillExists = verses.some(v => v.id === selectedVerseId)
  const nextId = stillExists ? selectedVerseId : verses[0].id

  rebuildDropdown(nextId)

  renderLibrary()
  manageMsg.textContent = "Deleted."
  showPage("library")
}

function autoFillFromPastedText() {
  const raw = (pasteBox.value || "").trim()

  if (!raw) {
    manageMsg.textContent = "Please paste the Bible text first."
    return
  }

  const lines = raw
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "")

  if (lines.length === 0) {
    manageMsg.textContent = "Nothing to parse."
    return
  }

  const urlPattern = /^https?:\/\/\S+$/i
  const urlLine = lines.find(line => urlPattern.test(line)) || ""
  const contentLines = lines.filter(line => !urlPattern.test(line))

  if (contentLines.length === 0) {
    manageMsg.textContent = "Could not find verse text."
    return
  }

  let referenceLine = ""
  let version = ""
  let verseLines = []

  if (urlLine) {
    const versionMatch = urlLine.match(/\.([A-Z0-9]+)$/i)
    if (versionMatch) {
      version = versionMatch[1].toUpperCase()
    }
  }

  const firstLine = contentLines[0] || ""
  const lastLine = contentLines[contentLines.length - 1] || ""

  const looksLikeReference = (line) => {
    return /\d+:\d+/.test(line)
  }

  if (looksLikeReference(firstLine)) {
    referenceLine = firstLine

    if (!version) {
      const refVersionMatch = firstLine.match(/\b([A-Z]{2,})$/)
      if (refVersionMatch) {
        version = refVersionMatch[1].toUpperCase()
      }
    }

    referenceLine = referenceLine.replace(/\b([A-Z]{2,})$/, "").trim()
    verseLines = contentLines.slice(1)
  } else if (looksLikeReference(lastLine)) {
    referenceLine = lastLine
    verseLines = contentLines.slice(0, -1)
  } else {
    verseLines = contentLines.slice()
  }

  let cleanedVerseText = verseLines.join(" ").trim()

  cleanedVerseText = cleanedVerseText
    .replace(/^\[\d+\]\s*/, "")
    .replace(/^['"“”‘’]+\s*/, "")
    .replace(/\s*['"“”‘’]+$/, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  newRef.value = referenceLine
  newVersion.value = version
  newText.value = cleanedVerseText

  manageMsg.textContent = "Auto filled."
}

btnBackToGame.addEventListener("click", () => {
  openGamePicker(selectedVerseId)
})

btnHideAll.addEventListener("click", toggleHideAll)
btnReset.addEventListener("click", resetCurrentGame)
btnGiveHint.addEventListener("click", giveHint)
btnCheck.addEventListener("click", checkCurrentMode)


btnAutoFill.addEventListener("click", autoFillFromPastedText)

btnSaveVerse.addEventListener("click", saveNewVerse)
btnBackToLibrary.addEventListener("click", () => showPage("library"))

tabLibrary.addEventListener("click", () => showPage("library"))
tabSettings.addEventListener("click", () => showPage("settings"))

modeType.addEventListener("click", () => startSelectedGame("type"))
modeDrag.addEventListener("click", () => startSelectedGame("drag"))
modeLetters.addEventListener("click", () => startSelectedGame("letters"))

pasteBox.addEventListener("paste", () => {
  setTimeout(autoFillFromPastedText, 0)
})

themeSelect.addEventListener("change", event => {
  saveTheme(event.target.value)
})

initTheme()
showPage("library")
refreshVerses()
loadStats()


const DEFAULT_VERSES = [
{
id: "john316",
ref: "John 3:16",
text: "For God so loved the world that he gave his one and only Son that whoever believes in him shall not perish but have eternal life."
},
{
id: "psalm11911",
ref: "Psalm 119:11",
text: "I have hidden your word in my heart that I might not sin against you."
},
{
id: "matt311",
ref: "Matthew 3:11",
text: "I baptize you with water for repentance but after me comes one who is more powerful than I whose sandals I am not worthy to carry."
}
]

let verses = []

const verseSelect = document.getElementById("verseSelect")
const verseText = document.getElementById("verseText")
const refText = document.getElementById("refText")
const result = document.getElementById("result")
const stats = document.getElementById("stats")
const answer = document.getElementById("answer")

const btnRevealOne = document.getElementById("btnRevealOne")
const btnHideMore = document.getElementById("btnHideMore")
const btnReset = document.getElementById("btnReset")
const btnCheck = document.getElementById("btnCheck")
const btnGiveHint = document.getElementById("btnGiveHint")
const btnHideAll = document.getElementById("btnHideAll")

const btnManage = document.getElementById("btnManage")
const btnCloseManage = document.getElementById("btnCloseManage")
const newText = document.getElementById("newText")
const ManageMsg = document.getElementById("ManageMsg")
const customList = document.getElementById("customList")
const managePanel = document.getElementById("managePanel")
const newRef = document.getElementById("newRef")

let words = []
let hiddenIndexes = []

function loadVerses(){

refreshVerses()

verseSelect.innerHTML = ""

verses.forEach(v =>
{
const option = document.createElement("option")
option.value = v.id
option.textContent = v.ref
verseSelect.appendChild(option)
})

if(verses.length > 0){
    loadVerse(verses[0].id)
}
}

function loadVerse(id)
{
const verse = verses.find(v => v.id === id)

refText.textContent = verse.ref

words = verse.text.split(" ")
hiddenIndexes = []

renderVerse()
setTypingEnabled(false)
answer.value = ""
result.textContent = ""
}

function renderVerse()
{
verseText.innerHTML = ""

words.forEach((word,index)=>
{
const span = document.createElement("span")
span.classList.add("token")

if(hiddenIndexes.includes(index))
{
span.classList.add("hidden")
span.textContent = "__".repeat(word.length)
}

else
{
span.textContent = word
}

verseText.appendChild(span)
verseText.appendChild(document.createTextNode(" "))
})
}

function hideRandomWord()
{
const visible = words.map((w,i)=>i).filter(i=>!hiddenIndexes.includes(i))

if(visible.length === 0) return

const randomIndex = visible[Math.floor(Math.random()*visible.length)]

hiddenIndexes.push(randomIndex)

renderVerse()
setTypingEnabled(true)
answer.focus()
}

function revealOneWord()
{
if(hiddenIndexes.length === 0) return

hiddenIndexes.pop()

renderVerse()
}

function resetVerse()
{
hiddenIndexes = []
renderVerse()
setTypingEnabled(false)
answer.value = ""
result.textContent = ""
}

function normalize(text){
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()[\]{}]/g,"")
    .replace(/\s+/g," ")
    .trim()
}

function checkAnswer(){
    const verse = normalize(words.join(" "))
    const user = normalize(answer.value)

    console.log("VERSE:", verse)
    console.log("USER :", user)

    if(user === verse){
        result.textContent = "Correct"
        result.className = "result good"
        saveScore()
    }

    else{
        result.textContent = "Not correct yet. Try again."
        result.className = "result bad"
    }
}

function giveHint()
{
revealOneWord()
}

function saveScore()
{
let count = localStorage.getItem("memoryScore") || 0
count++
localStorage.setItem("memoryScore",count)

stats.textContent = "Verses memorized: " + count
}

function loadStats()
{
let count = localStorage.getItem("memoryScore") || 0
stats.textContent = "Verses memorized: " + count
}

function setTypingEnabled(enabled){
    answer.disabled =!enabled
    answer.placeholder = enabled ? "start typing here." : "Hide words first to type."
}

function hideAllWords(){
    hiddenIndexes = words.map((w,i)=>i)
    renderVerse()
    setTypingEnabled(true)
    answer.focus()
}

function revealAllWords(){
    hiddenIndexes = []
    renderVerse()
    answer.focus()
}

function toggleHideAll(){
    if(hiddenIndexes.length === words.length){
        revealAllWords()
        btnHideAll.textContent = "Hide all"
    }

    else{
        hideAllWords()
        btnHideAll.textContent = "Reveal all"
    }
}


function getCustomVerses(){
    const raw = localStorage.getItem("customVerses")
    if(!raw) return[]
    try{
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data : []
    }catch(e){
        return[]
    }
}

function setCustomVerses(list){
    localStorage.setItem("customVerses", JSON.stringify(list))
}

function refreshVerses(){
    verses = DEFAULT_VERSES.concat(getCustomVerses())
}

function rebuildDropdown(selectedId){
    verseSelect.innerHTML = ""
    verses.forEach(v => {
        const option = document.createElement("option")
        option.value = v.id
        option.textContent = v.ref
        verseSelect.appendChild(option)
    })

    const idToLoad = selectedId || verses[0].id
    verseSelect.value = idToLoad
    loadVerse(idToLoad)
}

function openManage(){
    managePanel.classList.remove("isHidden")
    ManageMsg.textContent = ""
    renderCustomList()
    newRef.focus()
}

function closeManage(){
    managePanel.classList.add("isHidden")
    ManageMsg.textContent = ""
    newRef.value = ""
    newText.value = ""
}

function renderCustomList(){
    const custom = getCustomVerses()
    customList.innerHTML = ""

    if(custom.length === 0){
        customList.textContent = "No saved verses yet."
        return
    }

    custom.forEach(v => {
        const row = document.createElement("div")
        row.className = "customItem"

        const meta = document.createElement("div")
        meta.className = "meta"

        const title = document.createElement("div")
        title.textContent = v.ref

        const preview = document.createElement("small")
        preview.textContent = v.text.slice(0, 60) + (v.text.length > 60 ? "..." : "")

        meta.appendChild(title)
        meta.appendChild(preview)

        const actions = document.createElement("div")
        actions.className = "controls"

        const useBtn = document.createElement("button")
        useBtn.type = "button"
        useBtn.className = "ghost"
        useBtn.textContent = "Use"
        useBtn.addEventListener("click", () => {
            refreshVerses()
            rebuildDropdown(v.id)
            closeManage()
        })

        const delBtn = document.createElement("button")
        delBtn.type = "button"
        delBtn.className = "danger"
        delBtn.textContent = "Delete"
        delBtn.addEventListener("click", () => confirmDelete(v.id, row))


        actions.appendChild(useBtn)
        actions.appendChild(delBtn)

        row.appendChild(meta)
        row.appendChild(actions)
        customList.appendChild(row)
    })
}


function confirmDelete(id, row){
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
    yes.addEventListener("click", () => {
        deleteCustomVerse(id)
    })
    const no = document.createElement("button")
    no.type = "button"
    no.className = "ghost"
    no.textContent = "Cancel"
    no.addEventListener("click", renderCustomList)

    const actions = document.createElement("div")
    actions.className = "controls"

    actions.appendChild(yes)
    actions.appendChild(no)

    row.appendChild(meta)
    row.appendChild(actions)

}

function deleteCustomVerse(id){
  const custom = getCustomVerses().filter(v => v.id !== id)
  setCustomVerses(custom)

  refreshVerses()

  const currentSelected = verseSelect.value
  const stillExists = verses.some(v => v.id === currentSelected)

  rebuildDropdown(stillExists ? currentSelected : verses[0].id)

  renderCustomList()
  ManageMsg.textContent = "Deleted."
}

function saveNewVerse(){
  const ref = newRef.value.trim()
  const text = newText.value.trim()

  if(!ref || !text){
    ManageMsg.textContent = "Please fill in reference and verse text."
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

  renderCustomList()
  ManageMsg.textContent = "Saved."

  newRef.value = ""
  newText.value = ""
  newRef.focus()
}


verseSelect.addEventListener("change",e =>
{
loadVerse(e.target.value)
})

btnHideMore.addEventListener("click",hideRandomWord)
btnRevealOne.addEventListener("click",revealOneWord)
btnReset.addEventListener("click",resetVerse)
btnCheck.addEventListener("click",checkAnswer)
btnGiveHint.addEventListener("click",giveHint)
btnHideAll.addEventListener("click",toggleHideAll)
btnManage.addEventListener("click",openManage)
btnCloseManage.addEventListener("click",closeManage)
btnSaveVerse.addEventListener("click",saveNewVerse)

loadVerses()
loadStats()
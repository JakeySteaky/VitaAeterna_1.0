let chosenDirectory;

document.addEventListener("DOMContentLoaded", function() {
    refreshNotes();
});

// Open or create IndexedDB database
let db;
const dbName = 'chosenDirectoryDB';
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = function(event) {
    console.error("Database error: " + event.target.errorCode);
};

request.onsuccess = function(event) {
    db = event.target.result;
    // Retrieve directory path from IndexedDB when the DOM content is fully loaded
    chosenDirectory = getDirectoryPath();
    // Refresh notes after retrieving the directory path
    refreshNotes();
};

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // Create an object store to store directory path
    const objectStore = db.createObjectStore("directories", { keyPath: "id", autoIncrement: true });
};

function saveDirectoryPath(directoryPath) {
    const transaction = db.transaction(["directories"], "readwrite");
    const objectStore = transaction.objectStore("directories");
    objectStore.clear(); // Clear existing data
    objectStore.add({ path: directoryPath });
    console.log("Directory path saved:", directoryPath);
}

function getDirectoryPath() {
    const transaction = db.transaction(["directories"], "readonly");
    const objectStore = transaction.objectStore("directories");
    const request = objectStore.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = function(event) {
            const paths = event.target.result;
            if (paths && paths.length > 0) {
                const directoryPath = paths[0].path;
                console.log("Retrieved directory path:", directoryPath);
                resolve(directoryPath);
            } else {
                console.log("No directory path found.");
                resolve(null);
            }
        };

        request.onerror = function(event) {
            console.error("Error retrieving directory path:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

document.getElementById('directoryInput').addEventListener('change', selectDirectory);

async function selectDirectory(event) {
    const fileList = event.target.files;
    if (fileList.length > 0) {
        const directory = fileList[0];
        chosenDirectory = directory.path;
        saveDirectoryPath(chosenDirectory);
        refreshNotes();
    }
}

async function refreshNotes() {
    let noteList = document.getElementById("noteList");
    let directoryTitleText = document.getElementById("directoryTitleText");

    if (!chosenDirectory) return;

    const directoryName = chosenDirectory.webkitRelativePath.split('/')[0];
    directoryTitleText.innerText = directoryName;

    let fileList = await getFilesFromDirectory(chosenDirectory);

    noteList.innerHTML = "";
    fileList.forEach(async file => {
        const fileName = file.name;
        const fileContent = await readFileContent(file);

        let noteListItem = document.createElement("div");
        noteListItem.classList.add("noteListItem", "lifted");
        noteListItem.innerHTML =
            `<div>
                <h2>${fileName}</h2>
                <a>${fileContent.substring(0, 50)}<a>
            </div>
            <span class="material-symbols-outlined" onclick="deleteNote()">
                delete
            </span>`;

        noteList.appendChild(noteListItem);
    });
}

async function getFilesFromDirectory(directory) {
    try {
        const response = await fetch('/getFiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ directoryPath: directory.path })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch files from directory.');
        }
        const files = await response.json();
        return files;
    } catch (error) {
        console.error('Error fetching files from directory:', error);
        return [];
    }
}

async function readFileContent(file) {
    console.log('Reading file content:', file);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            console.log('File content read:', reader.result);
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}


function deleteNote() {
    // Implement delete note functionality
}

function createNote(){
    const text = "This is a sample text content.";
    const fileName = "example.txt";
    createTextFile(chosenDirectory, fileName, text);
}
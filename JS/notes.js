const dbName = 'NotesDB';
const storeName = 'notes';

let db;
let currentNoteId = null;

document.addEventListener('DOMContentLoaded', () => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        displayNotes();
    };

    request.onerror = (event) => {
        console.error('Database error:', event.target.errorCode);
    };

    document.getElementById('addNoteBtn').addEventListener('click', saveNote);
    document.getElementById('delete-note').addEventListener('click', deleteNote);
    document.getElementById('search-input').addEventListener('input', displayNotes);
});

function saveNote() {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;

    if (!title || !content) {
        alert('Please provide both title and content for the note.');
        return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const note = {
        title: title,
        content: content,
        timestamp: new Date().toISOString()
    };

    let request;
    if (currentNoteId) {
        note.id = currentNoteId;
        request = store.put(note);
    } else {
        request = store.add(note);
    }

    request.onsuccess = () => {
        clearForm();
        displayNotes();
    };

    request.onerror = (event) => {
        console.error('Error saving note:', event.target.errorCode);
    };
}

function deleteNote() {
    if (!currentNoteId) {
        alert('No note selected to delete.');
        return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.delete(currentNoteId);

    request.onsuccess = () => {
        clearForm();
        displayNotes();
    };

    request.onerror = (event) => {
        console.error('Error deleting note:', event.target.errorCode);
    };
}
function displayNotes() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();

    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const request = store.getAll();

    request.onsuccess = (event) => {
        const notes = event.target.result;
        const notesList = document.getElementById('noteList');
        notesList.innerHTML = '';

        const topResults = notes.filter(note => {
            return note.title.toLowerCase().includes(searchInput) || note.content.toLowerCase().includes(searchInput);
        }).slice(0, 5); // Show top 5 results

        topResults.forEach((note) => {
            const listItem = document.createElement('div');
            listItem.classList.add('noteListItem', 'lifted', 'clickable');
            listItem.innerHTML = `
                <div>
                    <h2>${note.title}</h2>
                    <a>${note.content}</a>
                </div>
                <span class="material-symbols-outlined">
                    more_vert
                </span>`;
            listItem.dataset.noteId = note.id;

            listItem.addEventListener('click', () => {
                displayNoteContent(note);
            });

            notesList.appendChild(listItem);
        });
    };
}


function displayNoteContent(note) {
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('delete-note').style.display = 'inline';
    currentNoteId = note.id;
}

function clearForm() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('delete-note').style.display = 'none';
    currentNoteId = null;
}


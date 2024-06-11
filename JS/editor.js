

function updateEditorContent() {
    console.log(currentNoteId);
    const editor = document.getElementById('editor');
    const markdownText = editor.innerText;
    const htmlContent = marked(markdownText);

    // Create a range object to save the caret position
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretOffset = preCaretRange.toString().length;

    // Update the content
    editor.innerHTML = htmlContent;

    // Restore the caret position
    const newRange = document.createRange();
    const nodeIterator = document.createNodeIterator(editor, NodeFilter.SHOW_TEXT, null, false);
    let textNode;
    let chars = 0;

    while (textNode = nodeIterator.nextNode()) {
        const nextChars = chars + textNode.length;
        if (caretOffset <= nextChars) {
            newRange.setStart(textNode, caretOffset - chars);
            newRange.setEnd(textNode, caretOffset - chars);
            break;
        }
        chars = nextChars;
    }

    selection.removeAllRanges();
    selection.addRange(newRange);
}

document.getElementById('editor').addEventListener('input', updateEditorContent);

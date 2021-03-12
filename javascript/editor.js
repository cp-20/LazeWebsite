const editorLineNumbers = document.getElementById('editor-line-numbers');

document.getElementById('editor-editbox').addEventListener('DOMSubtreeModified', function() {
	const lineCount = document.getElementsByClassName('editbox-line').length + 1;
	
	while(true) {
		if (lineCount > editorLineNumbers.childNodes.length) {
			const lineNumber = document.createElement('div');
			lineNumber.classList.add('editor-line-number');
			editorLineNumbers.appendChild(lineNumber);
		}else if (lineCount < editorLineNumbers.childNodes.length) {
			editorLineNumbers.removeChild(editorLineNumbers.childNodes[editorLineNumbers.childNodes.length - 1]);
		}else {
			break;
		}
	}

	editorLineNumbers.childNodes.forEach((lineNumber, i) => {
		lineNumber.innerText = `${i}`;
	})
});
const editorLineNumbers = document.getElementById('editor-line-numbers');

document.getElementById('editor-editbox').addEventListener('DOMSubtreeModified', function() {
	const lineCount = document.getElementsByClassName('editbox-line').length + 1;
	
	while(true) {
		if (lineCount > editorLineNumbers.childNodes.length) {
			const lineNumber = document.createElement('div');
			lineNumber.classList.add('editor-line-number');
			lineNumber.innerText = `${editorLineNumbers.childNodes.length}`;
			editorLineNumbers.appendChild(lineNumber);
		}else if (lineCount < editorLineNumbers.childNodes.length) {
			editorLineNumbers.removeChild(editorLineNumbers.childNodes[editorLineNumbers.childNodes.length - 1]);
		}else {
			break;
		}
	}
});

$("#editor-line-numbers").scroll(function () { 
  $("#editor-editbox").scrollTop($("#editor-line-numbers").scrollTop());
  $("#editor-editbox").scrollLeft($("#editor-line-numbers").scrollLeft());
});
$("#editor-editbox").scroll(function () { 
  $("#editor-line-numbers").scrollTop($("#editor-editbox").scrollTop());
  $("#editor-line-numbers").scrollLeft($("#editor-editbox").scrollLeft());
});
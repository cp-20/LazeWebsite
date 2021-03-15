const editor = CodeMirror(function(elt) {
	const editor = document.getElementById('editor-editbox');
	editor.parentNode.replaceChild(elt, editor);
}, {
  value: '',
	mode: "javascript",
	matchBrackets: true,
	tabSize: 2,
	indentWithTabs: true,
	electricChars: true,
	lineNumbers: true
});

// コンパイル
function compile() {
	console.log(editor.getValue());
}

// イベント登録
document.getElementById('editor-button-compile').onclick = compile;

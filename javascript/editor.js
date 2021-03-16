// Socket.IO
const socket = io.connect('');

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
	lineNumbers: true,
	styleActiveLine: true
});
editor.setOption('styleActiveLine', {nonEmpty: false});

// ログ出力
function logOutput(value, style='log') {
	const outputArea = document.getElementById('editor-output');

	let output = document.createElement('div');
	output.classList.add(style);
	output.innerHTML = `<span class="output-value">${value}</span><span class="output-timestamp">${moment().format('HH:mm')}</span>`;
	outputArea.prepend(output);

	// スクロール
	outputArea.scrollTop = outputArea.scrollHeight;
}

// 出力ウィンドウ
socket.on('output', result => logOutput(result.value, result.style));

// コンパイル
document.getElementById('editor-button-compile').onclick = compile;
function compile() {
	const value = editor.getValue();
	socket.emit('compile', value);
}

// セーブ
document.getElementById('editor-button-save').onclick = save;
function save() {
	const value = editor.getValue();
	socket.emit('save', value);
}
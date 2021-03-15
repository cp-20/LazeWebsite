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

// コンパイル
function compile() {
	const value = editor.getValue();
	socket.emit('compile', value);
}

// ログ出力
function logOutput(value, style='log') {
	const outputArea = document.getElementById('editor-output');

	let output = document.createElement('div');
	output.classList.add(style);
	output.innerHTML = `<span class="output-value">${value}</span><span class="output-timestamp">${moment().format('HH:mm')}</span>`;
	outputArea.appendChild(output);

	// スクロール
	outputArea.scrollTop = outputArea.scrollHeight;
}

socket.on('output', result => {
	if (result.success) {
		logOutput(result.value, 'log');
	}else {
		logOutput(result.value, 'err');
	}
});

// イベント登録
document.getElementById('editor-button-compile').onclick = compile;

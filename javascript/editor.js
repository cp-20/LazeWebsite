// Socket.IO
const socket = io.connect('');

// 編集内容
let editContents = {}

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
	socket.emit('compile', {
		filename: filename,
		value: value
	});
}

// セーブ
document.getElementById('editor-button-save').onclick = save;
function save() {
	const value = editor.getValue();
	socket.emit('save', {
		filename: filename,
		value: value
	});
}

// ファイル選択
function selectFile(index) {
	const tabGroup = document.getElementById('editor-tab-group');
	const selectedTab = tabGroup.getElementsByClassName('selected');
	for (let i = 0; i < selectedTab.length; i++) {
		editContents[selectedTab[i].id] = editor.getValue();
		selectedTab[i].classList.remove('selected');
	}
	tabGroup.children[index].classList.add('selected');
	editor.setValue(editContents[tabGroup.children[index].id]);
}

// ファイルを閉じる
function closeFile(index) {
	const tabGroup = document.getElementById('editor-tab-group');
	const closeingFile = tabGroup.children[index];
	if (closeingFile.classList.contains('selected')) {
		console.log(tabGroup.children.length);
		if (index == tabGroup.children.length - 1) {
			if (index > 0) {
				selectFile(index - 1);
			}
		}else {
			selectFile(index + 1);
		}
	}
	closeingFile.classList.add('closefile');
	closeingFile.getElementsByTagName('button')[0].remove();
	closeingFile.addEventListener('animationend', function() { this.remove(); });
	
	// 後ろのindexをずらす
	const tabs = tabGroup.children;
	for (let i = index; i < tabs.length; i++) {
		tabs[i].dataset.index = tabs[i].dataset.index - 1;
	}
}

// 新規ファイル
document.getElementById('editor-button-newfile').onclick = newFile;
function newFile() {
	// ユニークID生成関数
	const uniqueID = () => {
    return Date.now().toString(16) + Math.floor(1000 * Math.random()).toString(16);
	}

	const tabGroup = document.getElementById('editor-tab-group');
	const index = tabGroup.children.length;
	const newfile = document.createElement('div');
	newfile.classList.add('editor-tab');
	newfile.dataset.index = index;
	newfile.innerHTML = `<span>無題</span><button class="editor-button-closefile"><img src="assets/icons/cross.svg"></button>`;
	newfile.id = uniqueID();
	editContents[newfile.id] = '';
	newfile.getElementsByTagName('button')[0].onclick = function(e) {
		e.stopPropagation();
		closeFile(parseInt(this.parentNode.dataset.index));
	}
	newfile.addEventListener('click', function() {
		selectFile(parseInt(this.dataset.index));
	});
	tabGroup.appendChild(newfile);
	selectFile(index);
}
newFile();
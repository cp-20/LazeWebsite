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

// 未保存
editor.on('change', function() {
	const tabGroup = document.getElementById('editor-tab-group');
	const selectedTab = tabGroup.getElementsByClassName('selected')[0];
	if (!selectedTab.classList.contains('unsave')) selectedTab.classList.add('unsave')
});
socket.on('saved', result => {
	// ログ
	logOutput(result.value, result.style);

	// ポップアップ
	logPopup(result.value, result.style);
});

socket.on('createdProject', result => {
	logOutput(result.value, result.style);
	logPopup(result.value, result.style);
})

socket.on('loadedProject', result => {
	//ここにparseするプログラム
})

// ログ出力
function logOutput(value, style='log') {
	console.log(`${style}：${value}`);
	const outputArea = document.getElementById('editor-output');

	let output = document.createElement('div');
	output.classList.add(style);
	output.innerHTML = `<span class="output-value">${value}</span><span class="output-timestamp">${moment().format('HH:mm')}</span>`;
	outputArea.prepend(output);

	// スクロール
	outputArea.scrollTop = outputArea.scrollHeight;
}
// ポップアップメッセージ
function logPopup(value, style='info') {
	const outputArea = document.getElementById('popup-message');

	let output = document.createElement('div');
	output.classList.add('popup');
	output.classList.add(style);
	output.innerHTML = `<span>${value}</span><button><img src="./assets/icons/cross2.svg"></button>`;
	output.addEventListener('animationend', function(e) {
		if (e.animationName.startsWith('popup-end')) this.remove();
	});
	output.getElementsByTagName('button')[0].onclick = function() {
		this.parentNode.classList.add('close');
	}
	outputArea.prepend(output);
}

// 出力ウィンドウ
socket.on('output', result => logOutput(result.value, result.style));

// コンパイル
document.getElementById('editor-button-compile').onclick = compile;
function compile() {
	const value = editor.getValue();
	const tabGroup = document.getElementById('editor-tab-group');
	const selectedTab = tabGroup.getElementsByClassName('selected')[0];
	const filename = selectedTab.getElementsByTagName('span')[0].innerText;
	socket.emit('compile', {
		filename: filename,
		value: value
	});
}

// セーブ
document.getElementById('editor-button-save').onclick = save;
function save() {
	const tabGroup = document.getElementById('editor-tab-group');
	const selectedTab = tabGroup.getElementsByClassName('selected')[0];
	const value = editor.getValue();
	if (selectedTab.classList.contains('untitled')) {
		// ウィンドウを開く
		const overlay = document.getElementById('overlay');
		overlay.classList.add('setname');

		// 諸変数
		overlay.dataset.changeIndex = selectedTab.dataset.index;
		overlay.dataset.mode = 'save';
		document.getElementById('setname-name').value = '';
	}else {
		// セーブ
		const filename = selectedTab.getElementsByTagName('span')[0].innerText;
		socket.emit('save', {
			filename: filename,
			value: value
		});
	}
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
	newfile.classList.add('untitled');
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
	newfile.addEventListener('contextmenu', function(e) {
		e.preventDefault();
	});
	tabGroup.appendChild(newfile);
	selectFile(index);
}
newFile();

// ファイル名変更 キャンセル
document.getElementById('setname-cancel').onclick = cancelSave;
function cancelSave() {
	// ウィンドウを閉じる
	const overlay = document.getElementById('overlay');
	overlay.classList.remove('setname');
}
// ファイル名変更 保存
document.getElementById('setname-enter').onclick = enterSave;
function enterSave() {
	const overlay = document.getElementById('overlay');
	const tabGroup = document.getElementById('editor-tab-group');
	const value = document.getElementById('setname-name').value;

	// 名前変更
	const changeTab = tabGroup.children[overlay.dataset.changeIndex];
	changeTab.getElementsByTagName('span')[0].innerText = value;
	if (changeTab.classList.contains('untitled')) changeTab.classList.remove('untitled');
	
	if (overlay.dataset.mode == 'save') {
		// 保存
		save();
	}else {
		// 名前の変更
		
	}
	overlay.dataset.mode = '';

	// ウィンドウを閉じる
	overlay.classList.remove('setname');
}

function renameFile(index) {
	
}
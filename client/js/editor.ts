// Socket.IO
const socket: SocketIOClient.Socket = io.connect('');

// CodeMirror
$(() => {
	// @ts-ignore
	const editor = CodeMirror(
		function (elt) {
			const editor = document.getElementById('editor');
			if (editor && editor.parentNode) editor.parentNode.replaceChild(elt, editor);
		},
		{
			value: '',
			mode: 'javascript',
			tabSize: 2,
			indentWithTabs: true,
			electricChars: true,
			styleActiveLine: true,
			lineNumbers: true,
			lineWrapping: true,
			matchBrackets: true,
			autoCloseBrackets: true,
			widget: '…',
			extraKeys: {
				'Ctrl-Q': function (cm) {
					// @ts-ignore
					cm.foldCode(cm.getCursor());
				},
			},
			foldGutter: true,
			gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
		}
	);
	// @ts-ignore
	editor.setOption('styleActiveLine', { nonEmpty: false });

	// ボタン
	$('#btn-load').on('click', loadProject);
	$('#btn-save').on('click', () => save(editor));
	$('#btn-compile').on('click', () => compile(editor));
	$('#btn-newproject').on('click', newProject);

	// newProject
	$('#project-name').on('keyup', () => ($('#project-name').val() ? $('#setname-submit').prop('disabled', false) : $('#setname-submit').prop('disabled', true)));
	$('#setname-cancel').on('click', setNameCancel);

	// リサイズ可能に
	$('.explorer').resizable({
		handleSelector: '.exp-spliter',
		resizeHeight: false,
	});
	$('.editor-console').resizable({
		handleSelector: '.console-spliter',
		resizeWidth: false,
		resizeHeightFrom: 'top',
	});
	$('.editor-output').resizable({
		handleSelector: '.editor-output-spliter',
		resizeHeight: false,
	});

	const canvas = <HTMLCanvasElement>document.getElementById('output-canvas');
	canvas.width = 512;
	canvas.height = 512;

	// アカウントのステータス更新
	updateAccount();

	// ファイルロード
	socket.on('loadedFile', (result: { fileContent: string; logValue: string; style: string }) => {
		editor.setValue(result.fileContent);
		logConsole(result.logValue, result.style);
	});
});

// 変数
let editContents = new Map();
let editFileName = 'test.lang';
let projectName = 'Project1';
let account = {
	id: 'guest',
	username: 'ゲスト',
	avatar: '',
};

// ログ出力
function logConsole(value: string, style = 'log') {
	console.log(`${style}：${value}`);
	const outputArea = document.getElementById('editor-console');
	if (!outputArea) return;

	let output = document.createElement('div');
	output.classList.add(style);
	output.innerHTML = `<span class="output-value">${value}</span><span class="output-timestamp">${moment().format('HH:mm')}</span>`;
	outputArea.append(output);
	outputArea.scrollTop = outputArea.scrollHeight;

	// スクロール
	outputArea.scrollTop = outputArea.scrollHeight;
}
// ポップアップメッセージ
function logPopup(value: string, style = 'info') {
	const outputArea = document.getElementById('popup-message');
	if (!outputArea) return;

	let output = document.createElement('div');
	output.classList.add('popup');
	output.classList.add(style);
	output.innerHTML = `<span>${value}</span><button><svg viewBox="0 0 64 64"><use xlink:href="assets/icons/icons.svg#cross"></use></svg></button>`;
	output.addEventListener('animationend', function (e) {
		if (e.animationName.startsWith('popup-end')) this.remove();
	});

	output.getElementsByTagName('button')[0].onclick = function () {
		output.getElementsByTagName('button')[0].parentElement?.classList.add('close');
	};
	outputArea.prepend(output);
}

// ログ出力
socket.on('output', (result: { value: string; style: 'log' | 'err' | 'info' }) => logConsole(result.value, result.style));

// 保存済み
socket.on('saved', (result: saveResult) => {
	// ログ
	logConsole(result.value, result.style);

	// ポップアップ
	logPopup(result.value, result.style);
});

// セーブ
function save(editor: CodeMirror.Editor) {
	const value = editor.getValue();

	// セーブ
	socket.emit('save', {
		projectName: projectName,
		filename: editFileName,
		value: value,
	});
}

// コンパイル
function compile(editor: CodeMirror.Editor) {
	const value = editor.getValue();
	socket.emit('compile', {
		filename: editFileName,
		value: value,
	});
}

// ============ WebAssembly関係 ==========
const memory = new WebAssembly.Memory({ initial: 17 });

var importObject = {
	console: {
		log: function (arg: any) {
			logConsole(arg, 'console');
			console.log(arg);
		},
	},
	js: {
		mem: memory,
	},
};

socket.on('compileFinished', (result: { success: boolean; wasm: string }) => {
	if (result.success) {
		logConsole('---------- START ----------');
		fetch(result.wasm)
			.then((response) => response.arrayBuffer())
			.then((bytes) => WebAssembly.instantiate(bytes, importObject))
			.then((results) => {
				const instance = results.instance;
				// @ts-ignore
				const res = instance.exports.main(BigInt(Math.floor($('#output-canvas').height())), BigInt(Math.floor($('#output-canvas').width())));
				const byteArray = new Uint8ClampedArray(memory.buffer, 0, 512 * 512 * 4);
				const img = new ImageData(byteArray, 512, 512);
				const canvas = <HTMLCanvasElement>document.getElementById('output-canvas');
				if (canvas) {
					const ctx = canvas.getContext('2d');
					if (ctx) ctx.putImageData(img, 0, 0);
				}
			})
			.catch(console.error);
	} else {
		logConsole('compile erorr', 'err');
	}
});
// ============ WebAssembly関係 ==========

// プロジェクトのロードor作成をキャンセル
function setNameCancel() {
	$('#overlay').removeClass('show');
	$('#setname').off('submit');
}

// プロジェクトのロード
function loadProject() {
	$('label[for="project-name"]').text('ロードするプロジェクトの名前を入力してください');
	$('#project-name').val('');
	$('#setname-submit').prop('disabled', true);
	$('#overlay').addClass('show');
	$('#setname').on('submit', setloadFileName);
	$('#project-name-warning').text('');
}
function setloadFileName() {
	const projectName = $('#project-name').val()?.toString();
	if (projectName) {
		socket.emit('loadProject', {
			projectName: projectName,
		});
		$('#overlay').removeClass('show');
	}
	return false;
}

// ロード完了 → ファイルツリーに反映
socket.on('loadedProject', (result: loadedProject) => {
	// プロジェクト名更新
	projectName = result.value.name;
	$('#project-name-label').text(projectName);

	// ツリービュー
	parseDir(result.value);

	// ログ
	logConsole(`${projectName} is loaded`);
});
function parseDir(dir: dirObject) {
	const tree = (root: Element, dir: dirObject, nest = 0) => {
		if (!dir.value) return;
		dir.value.forEach((subdir) => {
			let file = document.createElement('li');
			file.innerText = subdir.name;
			file.style.paddingLeft = `${nest * 20 + 30}px`;
			file.classList.add('ui-dir');
			if (subdir.type === 'folder') {
				file.classList.add('ui-folder');
				file.onclick = function () {
					file.classList.toggle('opened');
				};
			}
			if (subdir.type === 'file') {
				file.classList.add('ui-file');
				file.onclick = function () {
					socket.emit('loadFile', {
						fileName: file.innerText,
					});
				};
			}
			root.appendChild(file);

			if (subdir.type === 'folder') {
				let folder = document.createElement('ul');
				folder.classList.add('ui-folder-root');
				root.appendChild(folder);
				tree(folder, subdir, nest + 1);
			}
		});
	};
	const root = document.querySelector('#exp-view > ul');
	if (!root) return;
	root.innerHTML = '';
	projectName = dir.name;
	tree(root, dir);
}

// 新しいプロジェクト
function newProject() {
	$('label[for="project-name"]').text('作成するプロジェクトの名前を決めてください');
	$('#project-name').val('');
	$('#setname-submit').prop('disabled', true);
	$('#project-name-warning').text('');
	$('#setname').on('submit', setNewProjectName);
	$('#overlay').addClass('show');
}
function setNewProjectName() {
	const projectName = $('#project-name').val()?.toString();
	if (projectName) {
		if (projectName.indexOf('/') > -1) {
			$('#project-name-warning').text('/は使えません');
		} else {
			socket.emit('newProject', {
				projectName: projectName,
			});
			$('#overlay').removeClass('show');
		}
	}
	return false;
}

// ログインイベント
socket.on('login', (data: userData) => {
	console.log(data);
	account = data;
	updateAccount();
});

// アカウントのステータス更新
function updateAccount() {
	// 名前
	$('#account-name').text(account.username);
	// アバター画像
	$('#avatar-img').attr('src', `/avatar/id?id=${account.id}`);
	// ドロップダウン更新
	const accountMenu = $('ul[aria-labelledby="account-menu"]');
	if (account.id === 'guest') {
		accountMenu.removeClass('user');
		accountMenu.addClass('guest');
	} else {
		accountMenu.addClass('user');
		accountMenu.removeClass('guest');
	}
}

"use strict";
// Socket.IO
// @ts-ignore
var socket = io.connect('');
// CodeMirror
$(function () {
    // @ts-ignore
    var editor = CodeMirror(function (elt) {
        var editor = document.getElementById('editor');
        if (editor && editor.parentNode)
            editor.parentNode.replaceChild(elt, editor);
    }, {
        value: '',
        mode: "javascript",
        tabSize: 2,
        indentWithTabs: true,
        electricChars: true,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        widget: '…',
        // @ts-ignore
        extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
    });
    // @ts-ignore
    editor.setOption('styleActiveLine', { nonEmpty: false });
    // ボタン
    $('#btn-load').on('click', loadProject);
    $('#btn-save').on('click', function () { return save(editor); });
    $('#btn-compile').on('click', function () { return compile(editor); });
    // アカウントのステータス更新
    updateAccount();
    // ファイルツリー
    parseDir({
        type: 'folder',
        name: projectName,
        value: [
            {
                type: 'file',
                name: editFileName
            },
            {
                type: 'folder',
                name: 'samples',
                value: [
                    {
                        type: 'file',
                        name: 'sample.lang'
                    }
                ]
            }
        ]
    });
});
// 変数
var editContents = new Map();
var editFileName = 'test.lang';
var projectName = 'Project1';
var account = {
    id: 'guest',
    name: 'ゲスト',
    avatar: 'assets/icons/guest.svg'
};
// ログ出力
function logConsole(value, style) {
    if (style === void 0) { style = 'log'; }
    console.log(style + "\uFF1A" + value);
    var outputArea = document.getElementById('editor-console');
    if (!outputArea)
        return;
    var output = document.createElement('div');
    output.classList.add(style);
    output.innerHTML = "<span class=\"output-value\">" + value + "</span><span class=\"output-timestamp\">" + moment().format('HH:mm') + "</span>";
    outputArea.prepend(output);
    // スクロール
    outputArea.scrollTop = outputArea.scrollHeight;
}
// ポップアップメッセージ
function logPopup(value, style) {
    if (style === void 0) { style = 'info'; }
    var outputArea = document.getElementById('popup-message');
    if (!outputArea)
        return;
    var output = document.createElement('div');
    output.classList.add('popup');
    output.classList.add(style);
    output.innerHTML = "<span>" + value + "</span><button><img src=\"./assets/icons/cross2.svg\"></button>";
    output.addEventListener('animationend', function (e) {
        if (e.animationName.startsWith('popup-end'))
            this.remove();
    });
    output.getElementsByTagName('button')[0].onclick = function () {
        this.parentNode.classList.add('close');
    };
    outputArea.prepend(output);
}
// 保存済み
socket.on('saved', function (result) {
    // ログ
    logConsole(result.value, result.style);
    // ポップアップ
    logPopup(result.value, result.style);
});
// セーブ
function save(editor) {
    var value = editor.getValue();
    // セーブ
    socket.emit('save', {
        projectName: projectName,
        filename: editFileName,
        value: value
    });
}
// コンパイル
function compile(editor) {
    var value = editor.getValue();
    socket.emit('compile', {
        filename: editFileName,
        value: value
    });
}
// プロジェクトのロード
function loadProject() {
    socket.emit('loadProject', {
        projectName: 'test'
    });
}
// ファイルのロード
function loadFile() {
    socket.emit('loadProject', {
        projectName: 'test'
    });
}
// ロード完了 → ファイルツリーに反映
socket.on('loadedProject', function (result) {
    console.log(result);
    parseDir(result.value);
    // ログ
    logConsole('Project loaded');
});
function parseDir(dir) {
    var tree = function (root, dir, nest) {
        if (nest === void 0) { nest = 0; }
        if (!dir.value)
            return;
        dir.value.forEach(function (subdir) {
            var file = document.createElement('li');
            file.innerText = subdir.name;
            file.style.paddingLeft = nest * 20 + 30 + "px";
            file.classList.add('ui-dir');
            if (subdir.type === 'folder') {
                file.classList.add('ui-folder');
                file.onclick = function () {
                    this.classList.toggle('opened');
                };
            }
            if (subdir.type === 'file')
                file.classList.add('ui-file');
            root.appendChild(file);
            if (subdir.type === 'folder') {
                var folder = document.createElement('ul');
                folder.classList.add('ui-folder-root');
                root.appendChild(folder);
                tree(folder, subdir, nest + 1);
            }
        });
    };
    var root = document.querySelector('#exp-view > ul');
    if (!root)
        return;
    root.innerHTML = '';
    projectName = dir.name;
    tree(root, dir);
}
// アカウントのステータス更新
function updateAccount() {
    // 名前
    $('#account-name').text(account.name);
    // アバター画像
    $('avatar-img').attr('src', account.avatar);
}
// 管理者ページ
// socket.on('requestAdminPage', () => {
// 	console.log('got');
// 	window.location.href = '../html/admin.html'
// });
// var oName = '';
// function adminExecuteBtnClicked()
// {
// console.log(document.getElementById('adminCommand').value);
// 	socket.emit('adminexec', {
// 			command: document.getElementById('adminCommand').value
// 	});
// }
// socket.on('originalUsername', (input) => {
// 	oName = input.originalName;
// });
// function adminLogoutBtnClicked()
// {
// let temp = oName;
// 	socket.emit('adminLogout', {
// 			originalName: temp
// });
// window.location.href = '../index.html';
// }
// socket.on('adminOutEmit', (input) => {
// console.log('gg');
// console.log(input.value);
// 	document.getElementById('adminOutput').innerHTML = input.value;
// });

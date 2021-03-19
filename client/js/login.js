"use strict";
// Socket.IO
// @ts-ignore
var socket = io.connect('');
$(function () {
    // ログイン
    $('#login-field').on('submit', function () {
        var id = ($('login-id').val() || '').toString();
        var password = ($('login-password').val() || '').toString();
        if (id.indexOf('@')) {
            socket.emit('login', {
                email: id,
                password: password
            });
        }
        else {
            socket.emit('login', {
                id: id,
                password: password
            });
        }
    });
    // エラーを閉じる
    $('.err i').on('click', function () {
        $('.err').css('display', 'none');
    });
});
// ログイン処理終わり
socket.on('login', function (result) {
    if (result.success) {
    }
    else {
        $('.err').css('display', 'block');
    }
});

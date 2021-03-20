"use strict";
$(function () {
    var feedback = function (input, success, value) {
        var form = input.parent();
        if (success) {
            if (form.hasClass('invalid'))
                form.removeClass('invalid');
            if (!form.hasClass('valid'))
                form.addClass('valid');
        }
        else {
            if (form.hasClass('valid'))
                form.removeClass('valid');
            if (!form.hasClass('invalid'))
                form.removeClass('invalid');
        }
        console.log(input.next('.feedback'));
        input.next('.feedback').html(value);
    };
    var resetFeedback = function (input) {
        var form = input.parent();
        if (form.hasClass('valid'))
            form.removeClass('valid');
        if (form.hasClass('invalid'))
            form.removeClass('invalid');
        input.next('.feedback').html('');
    };
    // ユーザー名
    var idTimer;
    $('#id').on('keydown', function () {
        if (idTimer)
            clearTimeout(idTimer);
        idTimer = setTimeout(function () {
            // 入力終了
            var id = $('#id').val();
            var form = $('#id');
            if (id) {
                fetch("/register_check/id?id=" + id)
                    .then(function (res) { return res.json(); })
                    .then(function (result) {
                    if (result.success) {
                        feedback(form, result.success, "<strong>" + id + "</stong>\u306F\u5229\u7528\u53EF\u80FD\u3067\u3059");
                    }
                    else {
                        feedback(form, result.success, "<strong>" + id + "</strong>\u306F\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
                    }
                });
            }
            else {
                resetFeedback(form);
            }
        }, 500);
    });
    // Eメールアドレス
    var emailTimer;
    $('#email').on('keydown', function () {
        if (emailTimer)
            clearTimeout(emailTimer);
        emailTimer = setTimeout(function () {
            // 入力終了
            var email = $('#form').val();
            var form = $('#form');
            if (email) {
                fetch("/register_check/email?email=" + email)
                    .then(function (res) { return res.json(); })
                    .then(function (result) {
                    if (result.success) {
                        feedback(form, result.success, "<strong>" + email + "</stong>\u306F\u5229\u7528\u53EF\u80FD\u3067\u3059");
                    }
                    else {
                        feedback(form, result.success, "<strong>" + email + "</strong>\u306F\u65E2\u306B\u5229\u7528\u3055\u308C\u3066\u3044\u308B\u304B\u4E0D\u6B63\u306A\u5F62\u5F0F\u3067\u3059");
                    }
                });
            }
            else {
                resetFeedback(form);
            }
        }, 500);
    });
    // パスワード
    var passTimer;
    $('#password').on('keydown', function () {
        if (passTimer)
            clearTimeout(passTimer);
        passTimer = setTimeout(function () {
            var _a;
            // 入力終了
            var password = (_a = $('#password').val()) === null || _a === void 0 ? void 0 : _a.toString();
            var form = $('#password');
            if (password) {
                if (password.length < 8) {
                    feedback(form, false, 'パスワードは8文字以上である必要があります');
                }
                else if (password.length > 72) {
                    feedback(form, false, 'パスワードは72文字以下である必要があります');
                }
                else if (password.match(/[A-Z]/) === null) {
                    feedback(form, false, 'パスワードは大文字を1文字以上含んでいる必要があります');
                }
                else if (password.match(/[0-9]/) === null) {
                    feedback(form, false, 'パスワードは数字を1文字以上含んでいる必要があります');
                }
                else {
                    feedback(form, true, '');
                }
            }
            else {
                resetFeedback(form);
            }
        }, 500);
    });
    // パスワードの確認
});

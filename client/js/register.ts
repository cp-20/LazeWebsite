$(() => {
	const feedback = (input :JQuery<Element>, success :boolean, value :string) => {
		const form = input.parent();
		if (success) {
			if (form.hasClass('invalid')) form.removeClass('invalid');
			if (!form.hasClass('valid')) form.addClass('valid');
		}else {
			if (form.hasClass('valid')) form.removeClass('valid');
			if (!form.hasClass('invalid')) form.removeClass('invalid');
		}
		console.log(input.next('.feedback'));
		
		input.next('.feedback').html(value);
	};
	const resetFeedback = (input :JQuery<Element>) => {
		const form = input.parent();
		if (form.hasClass('valid')) form.removeClass('valid');
		if (form.hasClass('invalid')) form.removeClass('invalid');
		input.next('.feedback').html('');
	};
	// ユーザー名
	let idTimer :(NodeJS.Timeout | undefined);
	$('#id').on('keydown', () => {
		if (idTimer) clearTimeout(idTimer);
		idTimer = setTimeout(() => {
			// 入力終了
			const id = $('#id').val();
			const form = $('#id');
			if (id) {
				fetch(`/register_check/id?id=${id}`)
				.then(res => res.json())
				.then((result :{success: boolean}) => {
					if (result.success) {
						feedback(form, result.success, `<strong>${id}</stong>は利用可能です`);
					}else {
						feedback(form, result.success, `<strong>${id}</strong>は利用できません`);
					}
				});
			}else {
				resetFeedback(form);
			}
		}, 500);
	});
	// Eメールアドレス
	let emailTimer :(NodeJS.Timeout | undefined);
	$('#email').on('keydown', () => {
		if (emailTimer) clearTimeout(emailTimer);
		emailTimer = setTimeout(() => {
			// 入力終了
			const email = $('#form').val();
			const form = $('#form');
			if (email) {
				fetch(`/register_check/email?email=${email}`)
				.then(res => res.json())
				.then((result :{success: boolean}) => {
					if (result.success) {
						feedback(form, result.success, `<strong>${email}</stong>は利用可能です`);
					}else {
						feedback(form, result.success, `<strong>${email}</strong>は既に利用されているか不正な形式です`);
					}
				});
			}else {
				resetFeedback(form);
			}
		}, 500);
	});
	// パスワード
	let passTimer :(NodeJS.Timeout | undefined);
	$('#password').on('keydown', () => {
		if (passTimer) clearTimeout(passTimer);
		passTimer = setTimeout(() => {
			// 入力終了
			const password = $('#password').val()?.toString();
			const form = $('#password');
			if (password) {
				if (password.length < 8) {
					feedback(form, false, 'パスワードは8文字以上である必要があります');
				}else if (password.length > 72) {
					feedback(form, false, 'パスワードは72文字以下である必要があります');
				}else if (password.match(/[A-Z]/) === null) {
					feedback(form, false, 'パスワードは大文字を1文字以上含んでいる必要があります');
				}else if (password.match(/[0-9]/) === null) {
					feedback(form, false, 'パスワードは数字を1文字以上含んでいる必要があります');					
				}else {
					feedback(form, true, '');
				}
			}else {
				resetFeedback(form);
			}
		}, 500);
	});

	// パスワードの確認
});
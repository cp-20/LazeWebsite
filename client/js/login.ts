// Socket.IO
// @ts-ignore
const socket :SocketIOClient.Socket = io.connect('');

$(() => {
	// ログイン
	$('#login-field').on('submit', () => {
		const id = ($('login-id').val() || '').toString();
		const password = ($('login-password').val() || '').toString();

		if (id.indexOf('@')) {
			socket.emit('login', {
				email: id,
				password: password
			});
		}else {
			socket.emit('login', {
				id: id,
				password: password
			});
		}
	});

	// エラーを閉じる
	$('.err i').on('click', () => {
		$('.err').css('display', 'none');
	});
});

// ログイン処理終わり
socket.on('login', (result :loginResult) => {
	if (result.success) {

	}else {
		$('.err').css('display', 'block');
	}
});
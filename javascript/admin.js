const socket = io.connect('');

let originalName = '';

function executeBtnClicked()
{
    socket.emit('exec', {
        command: document.getElementById('command').value
    })
}

function logoutBtnClicked()
{
    socket.emit('adminLogout', {
        originalName: originalName
    });
}

socket.on('executed', (result) => {
    document.getElementById('output').innerHTML = result.value;
});

socket.on('originalUsername', (input) => {
    originalName = input.originalName;
})
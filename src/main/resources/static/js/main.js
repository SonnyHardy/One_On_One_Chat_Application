'use strict';

const usernamePage = document.getElementById('username-page');
const chatPage = document.getElementById('chat-page');
const usernameForm = document.getElementById('usernameForm');
const messageForm = document.getElementById('messageForm');

const messageInput = document.getElementById('message');
const connectingElement = document.getElementsByClassName('connecting');
const chatArea = document.getElementById('chat-messages');
const logout = document.getElementById('logout');

let stompClient = null;
let nickname = null;
let fullname = null;
let selectedUserId = null;

function connect(event) {
    nickname = document.getElementById('nickname').value.trim();
    fullname = document.getElementById('fullname').value.trim();
    console.log('yo ' + nickname + ' et  ' + fullname);
    if (nickname && fullname) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/websocket');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

function onConnected() {
    stompClient.subscribe(`/user/${nickname}/queue/messages`, onMessageReceived);
    stompClient.subscribe(`/user/public`, onMessageReceived);

    // register the connected user
    stompClient.send('/app/user.addUser',    // '/app' is the prefix that we configured in our WebSocketConfig
        {},
        JSON.stringify({nickName: nickname, fullName: fullname, status: 'ONLINE'})
        );
    document.getElementById('connected-user-fullname').textContent = fullname;

    // find and display the connected users
    findAndDisplayConnectedUsers().then();
}

async function findAndDisplayConnectedUsers() {
    const connectedUsersResponse = await fetch('/users');
    let connectedUsers = await connectedUsersResponse.json();
    // we want to return the list of the connected other users without the actual user
    connectedUsers = connectedUsers.filter(user => user.nickName !== nickname);

    const connectedUsersList = document.getElementById('connectedUsers');
    connectedUsersList.innerHTML = '';
    connectedUsers.forEach(user => {
        appendUserElement(user, connectedUsersList);
        if (connectedUsers.indexOf(user) < connectedUsers.length - 1) {
            // add a separator
            const separator = document.createElement('li');
            separator.classList.add('separator');
            connectedUsersList.appendChild(separator);
        }
    });
}

function appendUserElement(user, connectedUsersList) {
    const listItem = document.createElement('li');
    listItem.classList.add('user-item');
    listItem.id = user.nickName;

    const userImage = document.createElement('img');
    userImage.src = '../img/user_icon.png';
    userImage.alt = user.fullName;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.fullName;

    const receivedMsgs = document.createElement('span');
    receivedMsgs.textContent = '0';
    receivedMsgs.classList.add('nbr-msg', 'hidden');

    listItem.appendChild(userImage);
    listItem.appendChild(usernameSpan);
    listItem.appendChild(receivedMsgs);

    listItem.addEventListener('click', userItemClick);

    connectedUsersList.appendChild(listItem);
}

function userItemClick(event) {
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    messageForm.classList.remove('hidden');

    const clickdUser = event.currentTarget;    // we select all the clicked elements
    clickdUser.classList.add('active');

    selectedUserId = clickdUser.getAttribute('id');
    fetchAndDisplayUserChat().then();

    const nbrMsg = clickdUser.querySelector('.nbr-msg');
    nbrMsg.classList.add('hidden');
}

async function fetchAndDisplayUserChat() {
    const userChatResponse = await fetch(`/messages/${nickname}/${selectedUserId}`);
    const userChat = await userChatResponse.json();
    chatArea.innerHTML = '';

    userChat.forEach(chat => {
        displayMessage(chat.senderId, chat.content);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
}

function displayMessage(senderId, content) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    if (senderId === nickname) {
        messageContainer.classList.add('sender');
    }else {
        messageContainer.classList.add('receiver');
    }

    const message = document.createElement('p');
    message.textContent = content;
    messageContainer.appendChild(message);
    chatArea.appendChild(messageContainer);
}

function onError() {

}

function sendMessage(event) {
    const messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        const chatMessage = {
            senderId: nickname,
            recipientId: selectedUserId,
            content: messageContent,
            timestamp: new Date(),
        };
        stompClient.send('/app/chat', {}, JSON.stringify(chatMessage));
        displayMessage(nickname, messageContent);
    }
    chatArea.scrollTop = chatArea.scrollHeight;
    event.preventDefault();
}

async function onMessageReceived(payload) {
    await findAndDisplayConnectedUsers();
    const message = JSON.parse(payload.body);
    if (selectedUserId && selectedUserId === message.senderId) {
        displayMessage(message.senderId, message.content);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    if (selectedUserId) {
        document.getElementById(`${selectedUserId}`).classList.add('active');
    }else {
        messageForm.classList.add('hidden');
    }

    const notifiedUser = document.getElementById(`${message.senderId}`);
    if (notifiedUser && !notifiedUser.classList.contains('active')) {
        const nbrMsg = notifiedUser.querySelector('.nbr-msg');
        nbrMsg.classList.remove('hidden');
        nbrMsg.textContent = '';
    }
}

function onLogout() {
    stompClient.send('/app/user.disconnectUser', {},
        JSON.stringify({nickName: nickname, fullName: fullname, status: 'OFFLINE'})
        );
    window.location.reload();
}

usernameForm.addEventListener('submit', connect, true);

messageForm.addEventListener('submit', sendMessage, true);

logout.addEventListener('click', onLogout, true);

window.onbeforeunload = () => onLogout();
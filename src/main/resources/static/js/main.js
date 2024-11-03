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
let selectedUser = null;

function connect(event) {
    nickname = document.getElementById('nickname');
    fullname = document.getElementById('fullname');
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
        JSON.stringify({nickname: nickname, fullname: fullname, status: 'ONLINE'})
        );

    // find and display the connected users
    findAndDisplayConnectedUsers().then();
}

async function findAndDisplayConnectedUsers() {
    const connectedUsersResponse = await fetch('/users');
    let connectedUsers = await connectedUsersResponse.json();
    // we want to return the list of the connected other users without the actual user
    connectedUsers = connectedUsers.filter(user => user.nickname !== nickname);

    const connectedUsersList = document.getElementById('connectedUsers');
    connectedUsersList.innerHTML = '';
    connectedUsersList.forEach(user => {
        appendUserElement(user, connectedUsersList);
        if (connectedUsers.index(user) < connectedUsers.length - 1) {
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
    listItem.id = user.nickname;

    const userImage = document.createElement('img');
    userImage.src = '../img/user_icon.png';
    userImage.alt = user.fullname;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.fullname;

    const receivedMsgs = document.createElement('span');
    receivedMsgs.textContent = '0';
    receivedMsgs.classList.add('nbr-msg', 'hidden');

    listItem.appendChild(userImage);
    listItem.appendChild(usernameSpan);
    listItem.appendChild(receivedMsgs);

    connectedUsersList.appendChild(listItem);
}

function onError() {

}

function onMessageReceived() {

}

usernameForm.addEventListener('submit', connect, true);
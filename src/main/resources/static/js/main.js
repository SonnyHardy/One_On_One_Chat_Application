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
    stompClient.send('/app/user.addUser',    // /app is the prefix that we configured in our WebSocketConfig
        {},
        JSON.stringify({nickname: nickname, fullname: fullname, status: 'ONLINE'})
        );
}

function onError() {

}

function onMessageReceived() {

}

usernameForm.addEventListener('submit', connect, true);
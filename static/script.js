let ws;
let currentUser = "";

/* CONNECT */
function connectSocket() {

    currentUser = document.getElementById("username").value.trim();
    const password = document.getElementById("roomPassword").value.trim();

    if (!currentUser || !password) {
        alert("Enter username and password");
        return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    ws = new WebSocket(`${protocol}://${window.location.host}/ws/${currentUser}/${password}`);

    ws.onopen = () => {
        document.getElementById("statusDot").style.background = "#25d366";
        document.getElementById("statusText").innerText = "Connected";
    };

    ws.onclose = () => {
    document.getElementById("statusDot").style.background = "red";
    document.getElementById("statusText").innerText = "Disconnected";
    };

    ws.onmessage = (event) => {

        const data = JSON.parse(event.data);
        const isMe = data.sender === currentUser;

        const row = document.createElement("div");
        row.className = "row " + (isMe ? "right" : "left");

        const bubble = document.createElement("div");
        bubble.className = "bubble " + (isMe ? "me" : "other");

        // 🖼️ IMAGE MESSAGE
        if (data.type === "image") {

            bubble.innerHTML = `<div class="message">
                <div class="message-text">
                    <img src="${data.url}" class="chat-img"/>
                </div>
                <div class="time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>
            `;

        } 
        // 💬 TEXT MESSAGE
        else {
        bubble.innerHTML = `<div class="message">
            <div class="message-text">${data.message}</div>
            <div class="time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>
        `;
        }

        row.appendChild(bubble);
        document.getElementById("messages").appendChild(row);

        const msgBox = document.getElementById("messages");
        msgBox.scrollTop = msgBox.scrollHeight;
    };
}

/* SEND TEXT */
function sendMessage() {

    const input = document.getElementById("messageInput");
    const msg = input.value.trim();

    if (!msg || !ws) return;

    ws.send(JSON.stringify({
        type: "text",
        message: msg
    }));

    input.value = "";
}

/* 📸 UPLOAD IMAGE */
async function uploadImage(event) {

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    ws.send(JSON.stringify({
        type: "image",
        url: data.url
    }));
}

/* AUTO RESIZE */
document.getElementById("messageInput").addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

/* KEY CONTROLS */
document.getElementById("messageInput").addEventListener("keydown", function(e) {

    // Ctrl + Enter → newline
    if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();

        const start = this.selectionStart;
        const end = this.selectionEnd;

        this.value = this.value.substring(0, start) + "\n" + this.value.substring(end);

        this.selectionStart = this.selectionEnd = start + 1;

        autoResize();
    }

    // Enter → send
    else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

/* Auto resize while typing */
document.getElementById("messageInput").addEventListener("input", autoResize);
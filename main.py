from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import os
import uuid

app = FastAPI()

connections = []
ROOM_PASSWORD = "2325"

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def home():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")


# 📸 IMAGE UPLOAD API
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):

    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "url": f"/static/uploads/{file_name}"
    }


@app.websocket("/ws/{username}/{password}")
async def websocket_endpoint(websocket: WebSocket, username: str, password: str):

    if password != ROOM_PASSWORD:
        await websocket.close()
        return

    await websocket.accept()

    user_connection = {
        "user": username,
        "websocket": websocket
    }

    for c in connections:
        if c["user"] == username:
            await websocket.close()
            return

    connections.append(user_connection)

    try:
        while True:

            data = await websocket.receive_text()

            message = json.loads(data)

            payload = json.dumps({
                "sender": username,
                "type": message.get("type", "text"),
                "message": message.get("message"),
                "url": message.get("url")
            })

            for c in connections:
                try:
                    await c["websocket"].send_text(payload)
                except:
                    pass

    except WebSocketDisconnect:
        connections.remove(user_connection)
        print(username, "disconnected")

from fastapi import FastAPI, File, UploadFile
import whisper
import tempfile
import os
import uvicorn

from dotenv import load_dotenv
load_dotenv()

#os.environ["PATH"] += os.pathsep + r"D:\я\Progi\ffmpeg\ffmpeg-2025-06-16-git-e6fb8f373e-full_build\bin"

ffmpeg_path = os.getenv("FFMPEG_PATH", r"D:\я\Progi\ffmpeg\ffmpeg-2025-06-16-git-e6fb8f373e-full_build\bin")

# Добавляем в PATH, если ещё не добавлен
if ffmpeg_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + ffmpeg_path


#import shutil
#print(shutil.which("ffmpeg"))


from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(root_path="/voice_service")


#удалить после тестов. Распознавание не работает по http, надо https либо localhost!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = whisper.load_model("small")


@app.post("/speech_to_text")
async def speech_to_text(audio: UploadFile = File(...)):

    #print(audio)
    

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_file:
        content = await audio.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

        print(f"Saved file: {tmp_path}")
        print(f"Original filename: {audio.filename}")

    try:
        result = model.transcribe(tmp_path, language="ru")
        text = result.get("text", "")
    finally:
        os.remove(tmp_path)
        #pass

    return {"text": text}


if __name__ == "__main__":
    uvicorn.run("voice_rec_service:app", host="127.0.0.1", port=8134, reload=True)

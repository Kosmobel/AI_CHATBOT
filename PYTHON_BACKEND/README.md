
# 🧠 Educational Chatbot — Python Backend

Бэкенд-сервис проекта **Educational Chatbot**, включающий:

- **LLM-сервис** — генерация текста с использованием локальных языковых моделей (LLM) формата `.gguf` на базе `llama-cpp-python`.
- **Voice-сервис** — распознавание речи с помощью Whisper, требует установленный `ffmpeg`.

> ⚠️ Проект протестирован на Python **3.11.9**. Рекомендуется использовать именно эту версию.


---

## ⚙️ Установка зависимостей

Запустить скрипт setup.ps1. Если он не справиться - создать виртуальную среду в папке каждого сервиса и установить зависимости:

### LLM_SERVICE - ручная установка

```powershell
cd LLM_SERVICE
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Если хотите использовать **GPU (CUDA)** для ускорения LLM:

```powershell
$env:CMAKE_ARGS="-DGGML_CUDA=on -DGGML_CUDA_FORCE_CUBLAS=on -DLLAVA_BUILD=off -DCMAKE_CUDA_ARCHITECTURES=native"
$env:FORCE_CMAKE="1"
pip install llama-cpp-python --no-cache-dir --force-reinstall --upgrade
```

Если пропустить эту команду, `llama-cpp-python` будет использовать CPU (медленнее).

В зависимости от ПК, билд библиотеки может занимать до 40 минут. Можно использовать готовые бинарные колеса, подробнее см. https://pypi.org/project/llama-cpp-python/

### VOICE_SERVICE - ручная установка

```powershell
cd VOICE_SERVICE
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 📦 Зависимости

- Python 3.11.9
- `llama-cpp-python` (LLM)
- `openai-whisper`
- `ffmpeg` (требуется для Voice-сервиса)

Остальные зависимости находятся в файлах requirements.txt соответствующих сервисов.

---

## 🛠️ Установка `ffmpeg`

1. Скачайте `ffmpeg` с https://ffmpeg.org/download.html
2. Разархивируйте
3. Добавьте путь до `ffmpeg.exe` в переменную окружения `PATH`
4. Убедитесь, что он работает:

```powershell
ffmpeg -version
```

---

## 📄 Настройки .env

### 📍 LLM_SERVICE/.env

```dotenv
# Основной путь к модели
MODEL_PATH=0

# Пути к моделям (поддерживаются .gguf)
MODEL_PATH_LLAMA=D:\Lmstudio\models\LM Studio Community\Meta-Llama-3-8B-Instruct-GGUF\Meta-Llama-3-8B-Instruct-Q4_K_M.gguf
MODEL_PATH_DEEPSEEK_1=D:\Lmstudio\models\lmstudio-community\DeepSeek-R1-0528-Qwen3-8B-GGUF\DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf
MODEL_PATH_DEEPSEEK_2=D:\Lmstudio\models\bartowski\DeepSeek-R1-Distill-Qwen-32B-GGUF\DeepSeek-R1-Distill-Qwen-32B-IQ2_XXS.gguf

# Настройки окружения модели
MODEL_N_CTX=8192 # контекстное окно модели, плавает от модели к модели
MODEL_GPU_LAYERS=64 # число слоев, загруженных на GPU (только при установке с поддержкой CUDA)
MODEL_THREADS=4
```

> **Примечание:** гарантирована работа с указанными моделями, однако при корректных параметрах можно использовать **любые .gguf модели**.

---

### 🎙 VOICE_SERVICE/.env

```dotenv
# Путь до бинарника ffmpeg
FFMPEG_PATH=D:\ffmpeg\bin\ffmpeg.exe
```

---

## 🚀 Запуск


### LLM-сервис:

Просто запустить start.ps1

### Voice-сервис:

Просто запустить start.ps1

---

## ✅ Примечания

- Whisper не сможет обработать WebM/OGG/MP3 без `ffmpeg`.
- Для ускорения генерации LLM-модели рекомендуется **установка с поддержкой CUDA**.
- Все зависимости должны быть установлены до запуска серверов.
- Убедитесь, что все `.env` файлы настроены корректно.

---

## 📬 Обратная связь

Свяжитесь с разработчиком (если получится). В архиве с файлами лежит видео демонстрация, на случай, если во время установки возникнут критические трудности.

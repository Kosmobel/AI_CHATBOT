from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
import json

import asyncio

from llama_cpp import Llama



from dotenv import load_dotenv
load_dotenv()
model_path = os.getenv("MODEL_PATH_DEEPSEEK_1", r"D:\Lmstudio\models\LM Studio Community\Meta-Llama-3-8B-Instruct-GGUF\Meta-Llama-3-8B-Instruct-Q4_K_M.gguf")
backend = os.getenv("LLAMA_BACKEND", "cpu")  #по умолчанию CPU
n_ctx = int(os.getenv("MODEL_N_CTX", 8192))
n_gpu_layers = int(os.getenv("MODEL_GPU_LAYERS", 64))
n_threads = int(os.getenv("MODEL_THREADS", 4))

#print('Грузится модель: ${model_path}')


#папка для сохранения полученных JSON файлов
save_directory = "received_jsons"
os.makedirs(save_directory, exist_ok=True)

class TextMessage(BaseModel):
    role: str
    content: str


class MessagesPayload(BaseModel):
    messages: list[TextMessage]

class FilePath(BaseModel):
    path: str

class ModelHandler:
    model_path: str
    llm: Llama
    messages: list[dict[str, str]]
    metadata = None

    system_prompt = "Ты ВСЕГДА отвечаешь на том же языке, на котором говорит пользователь! Твоя цель - помогать пользователю в любых запросах. ПИШИ ВСЕГДА НА РУССКОМ."

    @property
    def pre_prompt(self):
        prefix = self.inference_params['pre_prompt_prefix']
        suffix = self.inference_params['pre_prompt_suffix']
        return f"{prefix}{self.system_prompt}{suffix}"

    def apply_pre_prompt(self):
        self.inference_params['pre_prompt'] = self.pre_prompt

    def __init__(self):
        self.model_path = model_path        
        try:
            with open("inference_config.json", "r", encoding="utf-8") as f:
                self.inference_params = json.load(f)
        except FileNotFoundError:
            self.inference_params = {
                "n_threads": 4,
                "n_predict": 512,
                "top_k": 50,
                "min_p": 0.05,
                "top_p": 0.9,
                "temp": 0.7,
                "repeat_penalty": 1.15,
                "input_prefix": "<|start_header_id|>user<|end_header_id|>\n\n",
                "input_suffix": "<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
                "antiprompt": ["<|start_header_id|>", "<|eot_id|>"],
                "seed": -1,
                "tfs_z": 1,
                "typical_p": 1,
                "repeat_last_n": 64,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0,
                "n_keep": 0,
                "logit_bias": {},
                "mirostat": 0,
                "mirostat_tau": 5,
                "mirostat_eta": 0.1,
                "memory_f16": True,
                "multiline_input": False,
                "penalize_nl": True,
                "pre_prompt_prefix": "\n",
                "pre_prompt_suffix": "\n" 
            }

        
        self.llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_threads=n_threads,
            n_gpu_layers=n_gpu_layers,
            backend=backend,
            use_mmap=True,
            use_mlock=True,
            verbose=False
        )
        # self.system_message = {
        #     "role": "system",
        #     "content": "You are an assistant who provides concise, contextually relevant, and accurate answers. If the user's message is unclear, ask for clarification instead of making assumptions. You never answer in JSON format."
        # }

        self.system_message = {
            'role': 'system',
            'content': (
                'Ты — добрый и дружелюбный ассистент, который всегда отвечает на русском языке, '
                'даже если пользователь пишет на другом языке. '
                'Твоя главная задача — помогать максимально понятно, подробно и с уважением.\n\n'
                'Отвечай с использованием корректной Markdown-разметки: '
                'используй заголовки (#, ##, ###), списки (*, -, +), цитаты (>), таблицы, '
                'и блоки кода с указанием языка для подсветки (например, ```python).\n\n'
                'Обязательно оформляй код в тройные обратные кавычки с языком, '
                'давай понятные и качественные примеры кода, помогай решать задачи программирования.\n\n'
                'Если приводишь примеры, делай их понятными и аккуратными.\n\n'
                'Будь терпеливым и дружелюбным в ответах, стремись помочь пользователю максимально эффективно.'
            )
        }
        #self.apply_pre_prompt()

    def create_app(self):
        app = FastAPI(root_path="/llm_service")
        handler = self

        @app.post("/generate")
        async def generate(payload: MessagesPayload):
            
            messages = [handler.system_message] + [
                {"role": m.role, "content": m.content} for m in payload.messages
            ]

            #инференс
            response = handler.llm.create_chat_completion(messages=messages,
                #max_tokens=1024,
                temperature=0.3,
                top_p=0.9,
                top_k=40,
                repeat_penalty=1.1,
                stream=False
            )
            assistant_response = response['choices'][0]['message']['content']

            return {"response": assistant_response}

        return app






if __name__ == "__main__":
    import uvicorn
    modelHandlerApp = ModelHandler()
    app = modelHandlerApp.create_app()
    uvicorn.run(app, host="127.0.0.1", port=8133)

    



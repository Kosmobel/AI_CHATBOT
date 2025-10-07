import axios from "axios";
import { useEffect, useState, useRef } from "react";
import useRecorder from "../RecorderHook.js"
import loadingIcon from '../assets/loading.svg';
import config from "../config.js";
// import { isDisabled } from "@testing-library/user-event/dist/utils/index.js";

function ChatForm({ messages, setMessages, selectedChat, isAssistantGenerating, scrollDown, setIsAssistantGenerating }){
    const [messageText, setMessageText] = useState("");
    const [voiceMod, setVoiceMod] = useState(false);

    const canvasRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);

    


    const handleSubmit = async (event) => {
        event.preventDefault();
        scrollDown();
        setIsAssistantGenerating(true);

        //console.log("Form selected chat: ", selectedChat);
        if(selectedChat.chat_id !== 0){
            try {
                const messageTextTemp = messageText.trim();
                if(!messageTextTemp) throw new Error("MT input");

                //Вместо id=0 лучше сделать Date.Now(), чтобы не было
                //конфликта key prop

                /*
                const message = {
                    message: messageText,
                    message_id: Date.now(),
                    message_time: String(new Date()),
                    role: "user"
                };*/
                const message = {
                    id: Date.now() % 1000000000,
                    message: messageText,
                    message_time: String(new Date()),
                    role: "user"
                };
                setMessages([...messages, message]);

                const response = await axios.put(`${config.API_FULL_URL}/user/chats/messages`, 
                    {
                        chat_id: selectedChat.chat_id,
                        message: messageText,
                        role: "user"
                    },
                    {
                        withCredentials: true
                    });
                setMessageText("");
            }
            catch(e){
                console.log(e);
                //ЗАПЛАТКА
                if(e.response && e.response.status ===  401){
                        //если пользователь провел на сайте дольше времени жизни access токена
                        const response = await axios.post(`${config.API_FULL_URL}/refresh_access`, {}, {
                            withCredentials: true
                        });
                    }
            }
        }
    }
    useEffect(() => {
        console.log("Messages: ", messages);
    }, [messages]);

    const handleSend = async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if(!isAssistantGenerating){
                handleSubmit(e);
            }
        }
    }


    
    const onStopCallback = async (chunks, stream) => {
        //если юзер колупает кнопку отмены и микрофона в порыве ярости/паники/безумия
        //if(!voiceMod) return;

        console.log("Chunks sizes:", chunks.map(c => c.size));


        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        console.log("Blob size:", audioBlob.size, "type:", audioBlob.type);

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        setIsLoading(true);

        try {
            stream.getTracks().forEach((track) => track.stop());

            const start = performance.now();

            const response = await axios.post(`${config.API_FULL_URL}/user/speech-to-text`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });

            // await new Promise(resolve => setTimeout(resolve, 5000));
            // const response = {data: {text: "test"}}

            const end = performance.now();
            const duration = (end - start).toFixed(2);

            console.log("Распознанный текст:", response.data.text);
            console.log(`Время обработки запроса: ${duration} мс`);


            setMessageText(response.data.text);

            setVoiceMod(false);
            setIsLoading(false);
            
        }
        catch (error) {
            console.error("Ошибка при отправке аудио:", error);
        }
        finally {
            setIsLoading(false);

            //debug [вспомнить зачем я это сделал]
            setVoiceMod(false);
        }
    };

    const { startRecording, stopRecording, cancelRecording } = useRecorder(voiceMod, canvasRef, onStopCallback);

    const handleStopRecording = async (event) => {
        stopRecording();
        //setVoiceMod(false);
    }

    const handleStartRecording = async (event) => {
        startRecording();
        setVoiceMod(true);
    }

    const handleCancelRecording = async () => {
        cancelRecording();
        setVoiceMod(false);
        setIsLoading(false)
    }

    useEffect(() => {
        console.log("isLoading: ", isLoading);
    }, [isLoading]);
    
    useEffect(() => {
        console.log("voiceMod: ", voiceMod);
    }, [voiceMod]);


    return <div className="chat-form-block">
        <form className="chat-form" onSubmit={event => handleSubmit(event)}>
            
            <div className="form-wrap">
                {
                    voiceMod ? (
                        <canvas ref={canvasRef} className="voice-visual" width={500} height={120} />
                    ) : (
                        <textarea value={messageText} placeholder="Спросите что-нибудь. Например, 'Какая погода на марсе?'" onChange={event => setMessageText(event.target.value)} onKeyDown={handleSend} maxLength={5000}>

                        </textarea>
                    )
                }
                <div className="buttons-wrap">
                    {
                        voiceMod ? (
                            <>
                                <button type="button" value="✅" className="util-btn" onClick={handleStopRecording}>
                                    {isLoading ? <img src={loadingIcon} /> : "✓"}                                    
                                </button>
                                <input type="button" value="❌" className="util-btn" onClick={event => handleCancelRecording()}/>
                            </>
                         ) : (
                            <>
                                <input type="submit" value="🚀" className={`msg-send ${isAssistantGenerating  ? ' disabled' : ''}`} disabled={isAssistantGenerating} />
                                <input type="button" value="🎤" className={`util-btn ${isAssistantGenerating ? ' disabled' : ''}`} onClick={event => handleStartRecording()} disabled={isAssistantGenerating} />
                            </>
                         )
                    }
                </div>
                
            </div>
        </form>
    </div>
}

export default ChatForm;

//🚀↑ - крутая ракета. Отсылка на chatGPT

/*
СУПЕРВАЖНО

если в пустой чат написать сообщение и масштаб маленький, что появляется прокрутка
то при прокрутке триггерится подгрузка, а поскольку lasId временный (большой) - 
подгружаются дубли сообщений. РЕШЕНИЕ: сделать return id после отправки сообщения в чат
ИЛИ
сделать какую-то заплатку

#после вывода сообщения об ошибке в случае недоступности сервера и нажатии на отправку при пустом поле ввода кнопки навсегда выключаются

07.10.2025 20:45

#сделать централизованный отлов исключений для запросов (падает если посменять буль авторизации)

08.10.2025 10:23

#добавить какую-то проверку при вводе постороннего id в route url

08.10.2025 10:30

*/

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import ChatForm from "./ChatForm";
import LogoutBlock from "./LogoutBlock";
import React from 'react';

import axios from "axios";

import config from "../config";

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

//формат времени с минутами и часами
function formatDate(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

//для моделей с размышлением (автоскрытие блока размышлений)
//заменяет теги <think> на <div>
function wrapThinkBlocks(rawMessage) {
  return rawMessage.replace(/<think>([\s\S]*?)<\/think>/g, (_, content) => {
    return `<div class="think-block">${content}</div>\n`;
  });
}






function ChatContent({chats, selectedChat, hidePanel, setHidePanel}){
    const [messages, setMessages] = useState([]);
    const [lastId, setLastId] = useState(0);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [scroll, setScroll] = useState(null);

    const chatContentRef = useRef(null);

    const prevScrollHeightRef = useRef(null);

    const [copied, setCopied] = useState(false);

    const [isAssistantGenerating, setIsAssistantGenerating] = useState(false);


    //пересмотреть. Сокет-стейт либо не нужен, либо все операции сделать только через него. Сейчас стейт все равно не используется, идет работа с инстансом. Пусть пока будет на всякий случай
    const [socket, setSocket] = useState(null);
    useEffect(() => {
        const ws = new WebSocket(`${config.WS_URL}`);
        //console.log('ws://localhost:3001');
        //console.log(`${config.WS_URL}`);

        ws.onopen = () => {
            //console.log('Соединение открыто');
        };

        ws.onmessage = (event) => {
            //проверяем, является ли сообщение валидным JSON
            let data;

            try {
              data = JSON.parse(event.data);
              //console.log('Сообщение от сервера:', data);
            }

            catch (e) {
              console.error("Ошибка при парсинге данных:", e);

            //   if (event.data === 'Добро пожаловать в WebSocket сервер!') {
            //     console.log('Сервер отправил приветствие, игнорируем его');
            //     return;
            //   }

              return;
            }
          
            /*
            if (data.role === "assistant") {
              const message = {
                message: data.message,
                message_id: 0,
                message_time: String(new Date()),
                role: "assistant"
              };
              setMessages(prevMessages => [...prevMessages, message]);
            }*/

            
            if (data.role === "assistant") {
                if (data.isGenerating) {
                    //чтобы отключить форму
                    //setIsAssistantGenerating(true);
                    //добавление временного сообщения
                    const tempMessage = {
                        message: data.message,
                        id: data.id,
                        message_time: new Date().toISOString(),
                        role: "assistant",
                        isGenerating: true
                    };
                    setTimeout(() => {
                        setMessages(prev => [...prev, tempMessage]);
                    }, 350);
                }
                else if (!data.isGenerating) {
                    setIsAssistantGenerating(false);
                    //console.log("Temp msg replaced with: ", data.message);
                    //замена временного сообщения
                    //Вынести в debounce хук, чтобы контролировать централизовано
                    setTimeout(() => {
                        setMessages(prev => prev.map(msg => 
                            msg.isGenerating === true ? {
                            ...msg,
                            message: data.message,
                            message_time: String(new Date()),
                            isGenerating: false
                        } : msg
                    ));
                    }, 350);
                    //setMessages(prev => prev.map(msg => msg));
                }
            }

            
          };

        ws.onerror = (error) => {
            console.error('WebSocket ошибка:', error);
        };

        ws.onclose = () => {
            //console.log('Соединение закрыто');
        };

        setSocket(ws);
        return () => {
            ws.close();
        };
    }, []);


    const scrollDown = () => {
        if (chatContentRef.current) {
           chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    }

    useEffect(() => {
        if(isFirstLoad) {
            //Чтобы не 
            scrollDown();
            setIsFirstLoad(false);
        }
        
      }, [isFirstLoad, messages]);

    useEffect(() => {
        const initMessages = async () => {
            try {
                //console.log("LastId: ", lastId);
                const response = await axios.get(`${config.API_FULL_URL}/user/chats/messages`, {
                    params: {last_id: 0, chat_id: selectedChat.chat_id},
                    withCredentials: true
                  });
                const { messages } = response.data;
                //console.log("Messages (init): ", messages);
                setMessages(messages);
                setIsFirstLoad(true);
                //setLastId(messages.length > 0 ? Math.min(...messages.map(item => item.id)) : 0);
            }

            //сделать централизованный хук для запросов, чтобы не плодить мусор (СУПЕРВАЖНО!!!!!!)
            catch(e){
                //ЗАПЛАТКА
                if(e.response) {
                    if(e.response.status ===  401){
                        //если пользователь провел на сайте дольше времени жизни access токена
                        const response = await axios.post(`${config.API_FULL_URL}/refresh_access`, {}, {
                            withCredentials: true
                        });
                    }
                    console.error(e);
                }
            }
        }
        initMessages();
        //console.log("Messages: ", messages);
    }, [selectedChat]);


    /*
    useEffect(() => {
        const chat = chats.find(item => item.chat_id === selectedChat);
        setMessages(chat ? chat.messages : []);
    }, [chats, selectedChat]);
    */
    const handleScroll = () => {
        if (chatContentRef.current) {
            setScroll(chatContentRef.current.scrollTop);
        }
    }

    useEffect(() => {
        //console.log("Scroll: ", scroll);
        //console.log("LastId: ", lastId);
        prevScrollHeightRef.current = chatContentRef.current.scrollHeight;

        if(scroll === 0){
            const loadMoreMessages = async () => {
                try {
                    //console.log("LastId: ", lastId);
                    const response = await axios.get(`${config.API_FULL_URL}/user/chats/messages`, {
                        params: {last_id: lastId, chat_id: selectedChat.chat_id},
                        withCredentials: true
                      });
                    const new_messages = response.data.messages;
                    //console.log("Messages (pagination): ", messages);

                    //ДОДЕЛАТЬ - уже даже не помню, что...
                    setMessages(prevMessages => {
                        const all_messages = [...new_messages, ...prevMessages];
                        const uniqueMessages = all_messages.filter((value, index, self) =>
                            index === self.findIndex((t) => t.id === value.id)
                        );
                        return uniqueMessages;
                    });
                    //setIsFirstLoad(true);
                    //setLastId(messages.length > 0 ? Math.min(...messages.map(item => item.id)) : 0);
                }
    
                catch(e){
                    console.error(e);
                }
            }
            loadMoreMessages();
        }

        
    }, [scroll]);

    //и почему я вообще не сделал это раньше????????..........???????????????
    useEffect(() => {
        setLastId(messages.length > 0 ? Math.min(...messages.map(item => item.id)) : 0);
    }, [messages]);

    //синхронно после обновления DOM, чтобы избежать моргания
    useLayoutEffect(() => {
        if (!chatContentRef.current) return;
    
        const prevScrollHeight = prevScrollHeightRef.current;
        const newScrollHeight = chatContentRef.current.scrollHeight;
    
        chatContentRef.current.scrollTop += newScrollHeight - prevScrollHeight;
    }, [messages]);



    //почистить компонент от хайлайтера, вынести в отдельную функцию
    return <div className="chat-content-wrap">
        <div className="chat-header">
            <LogoutBlock hidePanel={hidePanel} setHidePanel={setHidePanel} />
        </div>
        <div className="chat-content" ref={chatContentRef} onScroll={handleScroll}>
            <div className="chat-messages-wrap">
                {messages.map(item => (
                <div key={item.id} className={'message-block ' + item.role + "-message"}>
                    {/* <p className="message-role">Role: {item.role === 'user' ? '👤' : '🤖'}</p> */}
                    {/* <p className="message-content">{item.message}</p> */}

                    <div className="message-content">
                        {item.role === 'assistant' ? 
                        <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            
                            code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');

                            if (!inline && match) {
                                return (
                                    <div className="code-wrap" style={{ position: 'relative' }}>
                                        <button className="copy-code-btn"
                                        onClick={() => {
                                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 1000);
                                        }}
                                        >
                                            {copied ? 'Скопировано' : 'Копировать'}
                                        </button>

                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    </div>
                                );
                            }

                            return (
                                <code className={className} {...props}>
                                {children}
                                </code>
                            );
                            },
                        }}
                        >
                            {wrapThinkBlocks(item.message)}
                        </ReactMarkdown>
                        : 
                        <p>{item.message}</p>
                        }
                    </div>
                    <p className="message-date">{formatDate(item.message_time)}</p>
                </div>
            ))}
            </div>
        </div>
        <ChatForm messages={messages} setMessages={setMessages} selectedChat={selectedChat} isAssistantGenerating={isAssistantGenerating} scrollDown={scrollDown} setIsAssistantGenerating={setIsAssistantGenerating} />
    </div>
}

export default ChatContent;
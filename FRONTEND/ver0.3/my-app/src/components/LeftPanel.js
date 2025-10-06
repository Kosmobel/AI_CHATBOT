import { useEffect, useState, useRef, useLayoutEffect } from "react";
import axios from "axios";

import { useNavigate } from "react-router-dom";


import config from "../config";
import sidebar from '../assets/sidebar.svg';

function formatDate(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0'); //двузначный день
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

function LeftPanel({ chats, setChats, selectedChat, setSelectedChat, hidePanel, setHidePanel, chatIdURL }){

    const navigate = useNavigate();

    const [lastId, setLastId] = useState(0);
    const [newChatAdded, setNewChatAdded] = useState(false);

    //просто для скролла
    const [scrollTop, setScrollTop] = useState(null);

    //для пагинации
    const [scrollBottom, setScrollBottom] = useState(null);
    const [noChatsLoaded, setNoChatsLoaded] = useState(false);

    const leftPanelRef = useRef(null);
    const prevScrollHeightRef = useRef(null);
    const initialized = useRef(false);

    const [searchValue, setSearchValue] = useState("");

    

    const initChats = async () => {
        try {
          const response = await axios.get(`${config.API_FULL_URL}/user/chats/meta`, {
            params: {last_id: 0},
            withCredentials: true
          });
          
          //console.log("ChatsInit response: ", response.data);

          const new_chats = response.data.chats;
          if(new_chats.length == 0) {
              console.log("Seems like user has no chats!");
              setNoChatsLoaded(true);
          }
          
          setChats([...new_chats]);
          //console.log("Response data chats: ", response.data.chats);
          
        }
        catch(e){
          console.error("LeftPanel init error: ", e.response.data.error);
        }
      }

    //Для инициализации чатов
    useEffect(() => {
        // const initChats = async () => {
        //   try {
        //     const response = await axios.get('http://localhost:3001/api/user/chats/meta', {
        //       params: {last_id: 0},
        //       withCredentials: true
        //     });
            
        //     console.log("ChatsInit response: ", response.data);

        //     const new_chats = response.data.chats;
        //     if(new_chats.length == 0) {
        //         console.log("Seems like user has no chats!");
        //         setNoChatsLoaded(true);
        //     }
            
        //     setChats([...chats, ...new_chats]);
        //     console.log("Response data chats: ", response.data.chats);
            
        //   }
        //   catch(e){
        //     console.log("LeftPanel init error: ", e.response.data.error);
        //   }
        // }
        initChats();
        //console.log(chats);
      }, []);
    
      //для пагинации чатов
      useEffect(() => {
        //console.log("LastId when scroll: ", lastId);
        prevScrollHeightRef.current = leftPanelRef.current.scrollHeight;

        if(scrollBottom === 0){
            const loadMoreChats = async () => {
                try {
                    //console.log("LastId load more: ", lastId);
                    const response = await axios.get(`${config.API_FULL_URL}/user/chats/meta`, {
                        params: {last_id: lastId},
                        withCredentials: true
                      });

                    //console.log("");
                    const new_chats = response.data.chats;
                    //console.log("Chats from pagination: ", new_chats);

                    //ДОДЕЛАТЬ
                    setChats(prevChats => {
                        const all_chats = [...prevChats, ...new_chats];
                        const uniqueChats = all_chats.filter((value, index, self) =>
                            index === self.findIndex((t) => t.chat_id === value.chat_id)
                        );
                        return uniqueChats;
                    });

                }
    
                catch(e){
                    console.error(e);
                }
            }
            loadMoreChats();
        }       
    }, [scrollBottom]);

    //для корректного скрола
    useEffect(() => {

        const scrollHeight = leftPanelRef.current.scrollHeight;
        const clientHeight = leftPanelRef.current.clientHeight;

        //console.log("ScrollTop: ", scrollTop);
        //console.log("ScrollHeight: ", scrollHeight);
        //console.log("Client height: ", clientHeight);

        const scrollBottom = scrollHeight - clientHeight - scrollTop
        setScrollBottom(scrollBottom);
    }, [scrollTop]);


    useEffect(() => {
        //console.log("Setted scroll bottom to: ", scrollBottom);
    }, [scrollBottom]);

    
    useEffect(() => {
        console.log("Chats updated: ", chats);
        setLastId(chats.length > 0 ? Math.min(...chats.filter(item => !item.specific).map(item => item.chat_id)) : 0);
        //setSelectedChat(chats.length > 0 ? chats[0].chat_id : 0);

        if (!initialized.current && chats.length > 0) {
            //setSelectedChat({chat_id: chats[0].chat_id, chat_name: chats[0].chat_name});
            console.log("SetSel [chats, newChatAdded]#1");

            if(chatIdURL) {
                setSelectedChat({chat_id: Number(chatIdURL), chat_name: chats.find(c => Number(c.chat_id) === Number(chatIdURL)).chat_name});
            }
            else {
                navigate(`/app/${chats[0].chat_id}`);
            }
            
            initialized.current = true;
        }
        if(newChatAdded){
            const newSelectedChat = chats.length > 0 ? {chat_id: chats[0].chat_id, chat_name: chats[0].chat_name} : {chat_id: 0, chat_name: ""};
            console.log("SetSel [chats, newChatAdded]#2");
            setSelectedChat(prev => newSelectedChat);
            //navigate(`app/${newSelectedChat.chat_id}`);
            //ПОТЕНЦИАЛЬНЫЙ ЛИШНИЙ РЕНДЕР. ОПТИМИЗИРОВАТЬ.
            setNewChatAdded(false);
        }
        
    }, [chats, newChatAdded]);


    useEffect(() => {
        const navigateSelected = async () => {
            console.log("Selected chat (navigateSelected): ", selectedChat);
            //console.log('Chats (navigateSelected): ', chats);
            //console.log('chats.find(c => Number(c.chat_id) === Number(chatIdURL).chat_name)', chats.find(c => Number(c.chat_id) === Number(chatIdURL)).chat_name);

            if (!chats.length) {
                //чаты не еще не загружены
                return;
            }

            if(!chatIdURL) {
                console.log(`navigateSelected to ${chats[0].chat_id}`);
                navigate(`/app/${chats[0].chat_id}`);
            }

            //Чат найден в выборке (первые 30)?
            if(chats.find(c => Number(c.chat_id) === Number(selectedChat.chat_id))) {
                console.log("Chat with id ", selectedChat.chat_id, " found");
                navigate(`/app/${selectedChat.chat_id}`);
            }

            

            //не найден - либо чата нет вообще, либо он есть но старый
            else {
                try {
                    const response = await axios.get(`${config.API_FULL_URL}/user/chats/meta/${selectedChat.chat_id}`, {
                        withCredentials: true
                    });

                    const responseChats = response.data.chats;

                    //console.log("Got specific chat: ", responseChats);

                    //чат существует, но старый и не попал в выборку
                    if (chats.length !== 0 && responseChats.length !== 0) {
                        //console.log('CHAT EXISTS BUT OLD ', selectedChat.chat_id);
                        setChats(prevChats => [...prevChats, responseChats[0]]);
                    }
                    //чат в принципе не существует
                    else if(chats.length !== 0 && responseChats.length === 0) {
                        console.log('NO CHAT WITH ID ', selectedChat.chat_id);
                        navigate(`/app/${chats[0].chat_id}`);
                    }

                }
                catch(error){
                    console.error("navigateSelected error: ", error);
                }
            
            }
        }
        navigateSelected();
    }, [selectedChat]);


    //ОПАСНО - возможно зацикливание. Хотя, в целом, упасть не должно...
    //ПЕРЕСМОТРЕТЬ РЕАЛИЗАЦИЮ !IMPORTANT
    useEffect(() => {
        console.log("SetSel [chatIdURL]");
        //setSelectedChat({chat_id: Number(chatIdURL)});

        
        if(chats.length !== 0) {
            setSelectedChat({chat_id: Number(chatIdURL), chat_name: chats.find(c => Number(c.chat_id) === Number(chatIdURL)).chat_name});
        }
        else {
            setSelectedChat({chat_id: Number(chatIdURL), chat_name: 'New chat'});
        }
    }, [chatIdURL]);

 
    useEffect(() => {
        //console.log("Updated LastId: ", lastId);
    }, [lastId]);
  
    /*
    useLayoutEffect(() => {
        if (!leftPanelRef.current) return;
        if(isFirstLoad) {
            setIsFirstLoad(false);
            return;
        }
    
        const prevScrollHeight = prevScrollHeightRef.current;
        const newScrollHeight = leftPanelRef.current.scrollHeight;
    
        leftPanelRef.current.scrollTop += newScrollHeight + prevScrollHeight;
    }, [chats, isFirstLoad]);
*/

    //а вот это - для создания нового чата для только что созданного пользователя!
    useEffect(() => {
        //not realy anymore...
        //вынесено на сторону сервера
    }, [noChatsLoaded]);


    

    const handleScroll = () => {
        if (leftPanelRef.current) {
            setScrollTop(leftPanelRef.current.scrollTop);
        }
    }

    const handleAddChat = async () => {
        try {
            const response = await axios.post(`${config.API_FULL_URL}/user/chats/`, 
                {},
                {
                    withCredentials: true
                });
            const newChat = response.data;
            //console.log(newChat);
            setChats(prevChats => {
                const all_chats = [newChat, ...prevChats];
                const uniqueChats = all_chats.filter((value, index, self) =>
                    index === self.findIndex((t) => t.chat_id === value.chat_id)
                );
                return uniqueChats;
            });
            setNewChatAdded(true);
        }
        catch(e) {
            //ЗАПЛАТКА
            if(e.response.status ===  401){
                //если пользователь провел на сайте дольше времени жизни access токена
                const response = await axios.post(`${config.API_FULL_URL}/refresh_access`, {}, {
                    withCredentials: true
                });
            }
            console.error(e);
        }
    }

    const handleDelChat = async () => {
        //Нельзя удалить чат, если он последний
        if (chats.length !== 1){
            try {
                await axios.delete(`${config.API_FULL_URL}/user/chats/`,
                {
                    params: {chat_id: selectedChat.chat_id},
                    withCredentials: true
                });


                setChats(prevChats => (prevChats.filter(item => item.chat_id !== selectedChat.chat_id)));
                

                setNewChatAdded(true);


                console.log("Removed chat");
            }
            catch(e) {
                //ЗАПЛАТКА
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

    useEffect(() => {
        const loadSearch = async () => {
            if(searchValue) {
                try {
                    const response = await axios.post(`${config.API_FULL_URL}/user/chats/search`, {
                        chat_name: searchValue
                    }, {
                        withCredentials: true
                    });
                    const { chats } = response.data;
    
                    //console.log("Search got: ", chats);

                    setChats(chats);
                }
                catch(e) {
                    //ЗАПЛАТКА
                    if(e.response.status ===  401){
                        //если пользователь провел на сайте дольше времени жизни access токена
                        const response = await axios.post(`${config.API_FULL_URL}/refresh_access`, {}, {
                            withCredentials: true
                        });
                    }
                    console.error(e);
                }
            }
            //КУЧА ПОВТОРЯЮЩЕГОСЯ КОДА. ЗАТЫЧКА. ПОЖАЛУЙСТА, СДЕЛАЙ НОРМАЛЬНО!!!
            else {
                // const initChats = async () => {
                //     try {
                //       const response = await axios.get('http://localhost:3001/api/user/chats/meta', {
                //         params: {last_id: 0},
                //         withCredentials: true
                //       });
                      
                //       console.log("ChatsInit response: ", response.data);
          
                //       const new_chats = response.data.chats;
                //       if(new_chats.length == 0) {
                //           console.log("Seems like user has no chats!");
                //           setNoChatsLoaded(true);
                //       }
                      
                //       setChats([...new_chats]);
                //       console.log("Response data chats: ", response.data.chats);
                      
                //     }
                //     catch(e){
                //       console.log("LeftPanel init error: ", e.response.data.error);
                //     }
                //   }
                  initChats();
            }
            
        }
        loadSearch();
    }, [searchValue]);


    return <div className={`left-panel ${hidePanel ? 'hidden' : ''}`} onScroll={handleScroll} ref={leftPanelRef}>
    <div className="left-panel-controls">
        <button className="hide-sidebar" onClick={() => setHidePanel(prev => !prev)}>☰</button>
        <button className="add-chat" onClick={handleAddChat}>{hidePanel ? "➕" : "Добавить чат"}</button>
        {!hidePanel && (
        <>
            <button className="del-chat" onClick={handleDelChat}>{hidePanel ? "🗑️" : "Удалить чат"}</button>
            <input className="search-chat" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Поиск" />
        </>
        )}
    </div>

    {!hidePanel && (
        <div className="left-panel-content">
        {[...chats].sort((a, b) => b.chat_id - a.chat_id).map(item => (
            <div className={selectedChat.chat_id === item.chat_id ? 'chat-name chat-selected' : 'chat-name' } key={item.chat_id}
            onClick={() => {
                //console.log("SetSel onClick");
                //setSelectedChat({ chat_id: item.chat_id, chat_name: item.chat_name });
                
                if(selectedChat.chat_id !== item.chat_id) setSelectedChat({ chat_id: item.chat_id, chat_name: item.chat_name });
                //нужно ли вообще? 
                //navigate(`/app/${item.chat_id}`);
            }}>
            <p>{item.chat_name}</p>
            <p className="chat-name-date">Created: {formatDate(item.chat_time)}</p>
            </div>
        ))}
        </div>
    )}
    </div>

}

export default LeftPanel;
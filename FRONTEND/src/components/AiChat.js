import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";


import LeftPanel from "./LeftPanel.js";
import LogoutBlock from "./LogoutBlock.js";
import ChatWindow from "./ChatWindow.js";

function AiChat(){
  const { chatId } = useParams();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState({chat_id: Number(chatId), chat_name: ""});
  

  //const [hidePanel, setHidePanel] = useState(false);
  const [hidePanel, setHidePanel] = useState(() => {
    return window.innerWidth < 800;
  });
   

    return <div className="chat-main-container">

      <LeftPanel chats={chats} setChats={setChats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} hidePanel={hidePanel} setHidePanel={setHidePanel} chatIdURL={chatId}/>

      <ChatWindow chats={chats} selectedChat={selectedChat} hidePanel={hidePanel} setHidePanel={setHidePanel} />    

    </div>
  }

  export default AiChat;
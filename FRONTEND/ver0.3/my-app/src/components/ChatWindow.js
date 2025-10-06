import ChatContent from "./ChatContent";


function ChatWindow({ chats, selectedChat, hidePanel, setHidePanel }){
    return <div className="chat-content-container">
        
        <ChatContent chats={chats} selectedChat={selectedChat} hidePanel={hidePanel} setHidePanel={setHidePanel} />

    </div>
}

export default ChatWindow;
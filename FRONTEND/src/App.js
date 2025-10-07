import './styles/App.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";

import config from './config.js';


import AskRegistered from './components/AskRegistered';
import AiChat from './components/AiChat.js';


import { useEffect, useState } from "react";
import { useAuth } from './AuthContext.js';

function App() {
  const { authorized, setAuthorized, username, setUsername } = useAuth();
  const [loading, setLoading] = useState(true);


  // useEffect(() => {
  //   console.log("Authorized: ", authorized);
  // }, [authorized]);

  //проверка сессии при монтировании
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.post(`${config.API_FULL_URL}/refresh_access`, {}, {
          withCredentials: true
        });
        if(response.status === 200){
          setAuthorized(true);
          setUsername(Cookies.get('username'));
        }
      }
      catch(err) {
        if (err.response) {
          const {error} = err.response.data;
          console.error(error);
        }
        else {
          console.error(err);
        }
      }

      finally {
        //в любом случае убираем загрузочное окно
        //setLoading(false);

        //задержка
        setTimeout(() => {
          setLoading(false);
        }, 0);
      }
    };
    checkSession();
    console.log("DOTENV: ", process.env.REACT_APP_TEST); //debug

  }, [setAuthorized]);
  
  if(loading) return <div className='loading-screen'></div>

  

  return <Router>
      <div className="main-container">
        <div className="app-container">
          <Routes>
            <Route path="/app/:chatId?" element={authorized ? <AiChat /> : <Navigate to="/authorize" /> } />

            <Route path="/" element={authorized ? <Navigate to="/app" /> : <Navigate to="/authorize" /> } />

            <Route path="/authorize" element={authorized ? <Navigate to="/app" /> : <AskRegistered />} />

            <Route path="/login" element={authorized ? <Navigate to="/app" /> : <SignIn />} />

            <Route path="/register" element={authorized ? <Navigate to="/app" /> : <SignUp />} />

            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
}

export default App;

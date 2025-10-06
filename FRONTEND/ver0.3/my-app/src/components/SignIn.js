import { useState } from "react";
import { useAuth } from "../AuthContext";
import axios from "axios";
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';

import config from "../config";

function SignIn(){
  const { username, setUsername } = useAuth();
  const { authorized, setAuthorized } = useAuth();
  const [passwd, setPasswd] = useState('');
  const [responseErr, setResponseErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`${config.API_FULL_URL}/login`, {
        username: username,
        password: passwd
      }, {
        withCredentials: true
      });

      

      if(response.status === 200) {
        const { access_token } = response.data;
        //localStorage.setItem('access_token', access_token);
        setAuthorized(true);
        setUsername(username);
        Cookies.set('username', username, { expires: 7 });
        navigate("/");
        return;
      }
      
    }
    catch (err) {
      console.error(err);
      
      if (err.response) {
        const {error} = err.response.data;
        if(err.response.status === 401){
          setResponseErr("Неправильный логин или пароль");
        }
        else if(err.response.status === 400){
          //переделать
          setResponseErr("Введите логин и пароль");
        }
      }
    }
    

  }

    return <div className="registry-wrap">
    <div className="grid-item registry-form">
      <form className="SignIn-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Логин</label>
        <input name="username" required minLength="3" type="text" placeholder="username" value={username} onChange={(event)=>setUsername(event.target.value)} />
  
        <label htmlFor="passwd">Пароль</label>
        <input name="passwd" type="password" required minLength="8" placeholder="password" value={passwd} onChange={(event)=>setPasswd(event.target.value)}/>
  
        <input type="submit" value="Войти" />
        <p>{responseErr}</p>
      </form>
      <Link to="/" className="btn-back">Назад</Link>
    </div>
    
    </div>
  }

  export default SignIn;
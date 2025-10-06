import { useState } from "react";
import { useAuth } from "../AuthContext";
import axios from "axios";
import Cookies from 'js-cookie';
import { Link, useNavigate } from 'react-router-dom';
import config from "../config";


function SignUp(){
  const { username, setUsername } = useAuth();
  const { authorized, setAuthorized } = useAuth();
  const [passwd, setPasswd] = useState('');
  const [passwdRepeat, setPasswdRepeat] = useState('');

  const [responseErr, setResponseErr] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    //сверка паролей в форме
    if (passwd === passwdRepeat) {

      try {
        const response = await axios.post(`${config.API_FULL_URL}/register`, {
          username: username,
          password: passwd
        }, {
          withCredentials: true
        });

        
        //устанавливаем в контекст данные после регистрации
        if(response.status === 201) {
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          setAuthorized(true);
          setUsername(username);
          Cookies.set('username', username, { expires: 7 });
          navigate("/");
          return;
        }
        
      }

      //в целом, лучше переделать, хотя и так работает
      catch (err) {
        console.error(err);
        if(err.response) {
          if(err.response.status === 409) {
            setResponseErr('Имя пользователя уже занято!');
            console.error('Имя пользователя уже занято!');
            return;
          }
          else if(err.response.status === 400) {
            setResponseErr('Пустой логин или пароль!');
            console.error('Пустой логин или пароль!');
            return;
          }
          else {
            console.error(err.response);
            console.error('Статус запроса: ', err.response.status);
          }
        }
      }
      
    }
    else {
      setResponseErr('Пароли не совпадают!');
      console.error('Пароли не совпадают!');
    }
  }
    return <div className="registry-wrap">
        <div className="grid-item registry-form">
          <form className="SignUp-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Логин</label>
            <input name="username" minLength="3" type="text" required placeholder="username" value={username} onChange={(event)=>setUsername(event.target.value)} />
      
            <label htmlFor="passwd">Пароль</label>
            <input name="passwd" type="password" required minLength="8" placeholder="password" value={passwd} onChange={(event)=>setPasswd(event.target.value)}/>
      
            <label htmlFor="passwd_repeat">Повторите пароль</label>
            <input name="passwd_repeat" type="password" required minLength="8" placeholder="password" onChange={(event)=>setPasswdRepeat(event.target.value)}/>
      
            <input type="submit" value="Зарегистрироваться" />
            <p>{responseErr}</p>
          </form>
          <Link to="/" className="btn-back">Назад</Link>
        </div>
      </div>
  }

  export default SignUp;
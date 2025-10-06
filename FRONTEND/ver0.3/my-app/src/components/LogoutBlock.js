import { useAuth } from '../AuthContext.js';
import axios from 'axios';
import Cookies from 'js-cookie';
import ThemeToggle from "./ThemeToggle";
import config from '../config.js';

function LogoutBlock({hidePanel, setHidePanel}){
    const { authorized, setAuthorized, username, setUsername } = useAuth();

    const logout = async () => {
      Cookies.remove('username');
      const response = await axios.delete(`${config.API_FULL_URL}/logout`, {
        withCredentials: true
      });
      setAuthorized(false);
    };

    return <div className="grid-item logout-block">
        <div className="logout-left">
          <p>{/*username*/}</p>
          <button className="hide-panel-external" onClick={() => setHidePanel(prev => !prev)}>☰</button>
        </div>
        
        <div className="logout-right">
          <button onClick={logout}>Выйти</button>
          <ThemeToggle />
        </div>
    </div>
}
export default LogoutBlock;
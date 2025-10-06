import { useState } from "react";
import { Link } from 'react-router-dom';


function AskRegistered({setAuthorized}) {
    return (
        <div className="registry-wrap">
            <div className="grid-item registry-form">
                <p>Вы уже зарегистрированы?</p>
                {/* Переход на страницу регистрации */}
                <Link to="/register" className="btn-back">Зарегистрироваться</Link>
                {/* Переход на страницу входа */}
                <Link to="/login" className="btn-back">Войти</Link>
            </div>
        </div>
    );
}

export default AskRegistered;
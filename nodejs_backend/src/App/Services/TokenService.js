const jwt = require('jsonwebtoken');
const dbService = require('./DatabaseService'); // Подключаем DatabaseService
//const { refresh_access } = require('../Controllers/UserController');
require('dotenv').config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

class TokenService {

    static generateToken(userId, isRefreshToken = false) {
        console.log('Generating some token!');

        const expiresIn = isRefreshToken ? '7d' : '30m';
        const token = jwt.sign(
        { user_id: userId, token_type: isRefreshToken ? 'refresh' : 'access' },
        JWT_SECRET_KEY,
        {
            expiresIn,
            issuer: 'AI_CHAT',
            audience: 'user',
        }
        );

        //console.log('Generated some token: ', token);

        //DEBUG, УБРАТЬ!!!
        const decodedToken = jwt.decode(token);
        console.log('Decoded token expiration: ', new Date(decodedToken.exp * 1000).toISOString());

        return token;
    }

    static getTokenData(token) {
        try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        return {
            issued_at: new Date(decoded.iat * 1000).toISOString(),
            expires_at: new Date(decoded.exp * 1000).toISOString(),
            user_id: decoded.user_id,
            token_type: decoded.token_type,
        };
        } catch (err) {
        return null;
        }
    }

    static async isRefreshTokenValid(user_id, refresh_token) {
        try {
        const result = await dbService.executeQuery(
            'SELECT expires_at FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
            [refresh_token, user_id]
        );
        return result.rowCount > 0;
        } catch (err) {
        console.error(err);
        return false;
        }
    }

    //переименовать или что-то, потому что похоже на функцию из AuthMiddleware!!
    static verifyAccessTokenWS(access_token) {
        try {
            const decoded = jwt.verify(access_token, JWT_SECRET_KEY);
            return decoded;
        }
        catch(error) {
            console.error(error.message);
        }
    }

    //УДАЛИ МЕНЯ ПОЖАЛУЙСТА Я БОЛЬШЕ ТУТ НЕ НУЖЕН Я ХОЧУ БЫТЬ СВОБОДНЫМ А НЕ БЕСПОЛЕЗНЫМ КУСКОМ КОДА!
    static isAccessTokenValid(user_id, access_token) {
        const tokenData = TokenService.getTokenData(access_token);
        if (!tokenData) return false;
        return (
        new Date(tokenData.expires_at) > new Date() &&
        tokenData.user_id === user_id &&
        tokenData.token_type === 'access'
        );
    }

    static async storeRefreshToken(user_id, refresh_token) {
        const tokenData = TokenService.getTokenData(refresh_token);
        if (!tokenData) return;
        await dbService.executeQuery(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4)',
        [user_id, refresh_token, tokenData.expires_at, tokenData.issued_at]
        );
    }

    static async deleteRefreshToken(refresh_token){
        await dbService.executeQuery('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
        console.log('Удален токен из БД: ', refresh_token);
    }

    static async checkUserRefreshToken(user_id) {
        try {
            console.log('Entered checkUsrRefresh');

            const checkQuery = 'SELECT token FROM refresh_tokens WHERE user_id = $1';
            const checkStmt = await dbService.executeQuery(checkQuery, [user_id]);

            let refresh_token = false;

            if(checkStmt.rowCount > 0){
                refresh_token = checkStmt.rows[0].token;
            }

            //console.log('CheckSTMT: ' + checkStmt);
            //console.log('Refresh token from DB: ', refresh_token);

            const isRefreshTokenValid = await TokenService.isRefreshTokenValid(user_id, refresh_token);

            console.log('Refresh token valid: ', isRefreshTokenValid);

            if(checkStmt.rowCount < 0) return false;
            else if (!isRefreshTokenValid) return false;

            console.log('Returning');

            return refresh_token;
        }
        catch(err){
            console.log('CheckUsr: ', err);
        }

    }

    static async getOrCreateRefreshToken(user_id){
        let refresh_token = await TokenService.checkUserRefreshToken(user_id);

        //console.log('getOrCreateRefresh: ' + refresh_token);

        if (!refresh_token){
            refresh_token = TokenService.generateToken(user_id, true);
            await TokenService.storeRefreshToken(user_id, refresh_token);
        }

        return refresh_token;
    }


}

module.exports = TokenService;

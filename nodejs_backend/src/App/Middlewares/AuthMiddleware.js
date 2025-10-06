const TokenService = require('../Services/TokenService');
const dbService = require('../Services/DatabaseService');
const HTTP_Helper = require('../Helpers/HTTP_Helper');
//const { refresh_access } = require('../Controllers/UserController');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

//const JWT_SECRET_KEY=process.env.JWT_SECRET_KEY;
const JWT_SECRET_KEY=config.JWT_SECRET_KEY;

async function verifyAccessToken(req, res, next) {
    const { access_token } = HTTP_Helper.getTokensFromCookies(req);

    //console.log("Access middleware: ", access_token);

    if (!access_token) return HTTP_Helper.sendJsonResponse(res, { error: 'Provide access token' }, 401);

    try {
        //console.log("Server time:", new Date().toISOString());

        const decoded = jwt.verify(access_token, JWT_SECRET_KEY);
        //console.log('Access token valid (verifyMiddleware): ', decoded);
        //console.log("Got req query: ", req.query);


        const expirationTime = new Date(decoded.exp * 1000);
        //console.log("Token expiration time:", expirationTime.toISOString());

        if (!decoded || !decoded.user_id) {
            return HTTP_Helper.sendJsonResponse(res, { error: 'Invalid token' }, 401);
        }

        req.user = decoded;
        next();
    } 
    catch (err) {
        console.log(err);

        if (err.name === 'TokenExpiredError') {
            //DEBUG, УБРАТЬ ТОКЕН!!!!!
            res.clearCookie('access_token', { httpOnly: true, secure: true, sameSite: 'Strict' });
            return HTTP_Helper.sendJsonResponse(res, { error: 'Token expired', token: access_token }, 401);
        }
        if (err.name === 'JsonWebTokenError') {
            return HTTP_Helper.sendJsonResponse(res, { error: 'Invalid token' }, 401);
        }

        return HTTP_Helper.sendJsonResponse(res, { error: 'Internal server error' }, 500);
    }
}


async function verifyRefreshToken(req, res, next) {
    const {access_token, refresh_token} = HTTP_Helper.getTokensFromCookies(req);
    if(!refresh_token) return HTTP_Helper.sendJsonResponse(res, {error: 'Provide refresh token'}, 401);

    try {
        const decoded = jwt.verify(refresh_token, JWT_SECRET_KEY);
        const isRefreshTokenValid = await TokenService.isRefreshTokenValid(decoded.user_id, refresh_token);

        //console.log('Refresh token valid (verifyMiddleware): ', isRefreshTokenValid);

        if(!isRefreshTokenValid) return HTTP_Helper.sendJsonResponse(res, {error: 'Invalid refresh token'}, 403);

        
        req.user = decoded;
        req.access_token = access_token;
        next();

    }
    catch (err){
        if (err.name === 'TokenExpiredError') {
            await TokenService.deleteRefreshToken(refresh_token);
            res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: 'Strict' });
            return HTTP_Helper.sendJsonResponse(res, { error: 'Token expired', token: refresh_token }, 401);
        }
        
        console.log(err);
    }

}

module.exports = { verifyAccessToken, verifyRefreshToken };
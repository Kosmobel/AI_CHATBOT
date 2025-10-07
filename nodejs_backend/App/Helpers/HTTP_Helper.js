class HTTP_Helper {
    static sendJsonResponse = (res, data, status = 200) => {
        res.status(status).json(data);
    };
    static getTokensFromCookies(req) {
        try {
            //const access_token = req.headers['authorization']?.replace('Bearer ', '') || false;
            const access_token = req.cookies.access_token || false;
            const refresh_token = req.cookies.refresh_token || false;

            //console.log("Http helper got tokens:\nAccess: ", access_token, "\nRefresh: ", refresh_token);
            return { access_token: access_token, refresh_token: refresh_token };
        }
        catch (err) {
            console.log(err);
        }
    }
}


module.exports = HTTP_Helper;
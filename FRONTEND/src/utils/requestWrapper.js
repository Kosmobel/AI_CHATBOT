import axios from "axios";
import { useEffect, useState, useRef } from "react";
import config from "../config.js";

const useRequestWrapper = (baseURL = config.API_FULL_URL) => {

    const reqTypes = {
        get: async (URL, params, withCredentials = true) => await axios.get(URL, {params: params, withCredentials: withCredentials}),
        post: async (URL, data, withCredentials = true) => await axios.post(URL, data, {withCredentials: withCredentials}),
        put: async (URL,data, withCredentials = true) => await axios.put(URL, data, {withCredentials: withCredentials}),
        patch: async (URL, data, withCredentials = true) => await axios.patch(URL, data, {withCredentials: withCredentials}),
        delete: async (URL, params, withCredentials= true) => await axios.delete(URL, {params: params, withCredentials: withCredentials}),
    }

    
    const sendRequest = async (routeURL, {data = {}, params = {}} = {},  reqType, withCredentials = true, retry = true) => {

        const req = reqTypes[reqType.toLowerCase()];
        if (!req) throw new Error(`Unknown request type: ${reqType}`);

        try {
            let response;
            if (reqType === "get" || reqType === "delete") {
                response = await req(`${baseURL}/${routeURL}`, params, withCredentials);
            }
            else {
                response = await req(`${baseURL}/${routeURL}`, data, withCredentials);
            }
            
            return response;
        }
        catch(error){
            if(error?.response?.status === 401 && retry) {
                try {
                    await reqTypes.post(`${baseURL}/refresh_access`, {}, true);
                    return await sendRequest(routeURL, { data, params }, reqType, withCredentials, false);
                }
                catch(error){
                    console.error(`RequestWrapper error in URL ${routeURL}: ${error} `);
                }
            }
            console.error(`RequestWrapper error in URL ${routeURL}: ${error} `);
            throw error;

        }

    }
        

    return { sendRequest }
}

export default useRequestWrapper;


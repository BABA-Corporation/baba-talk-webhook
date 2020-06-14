'use strict';

// const debug = require('debug')('baba-talk-webhook');
const axios = require('axios');

const apiUrl = process.env.API;

module.exports = {
    /**
     * recup du token et de l'id du user avec son email
     */
    getUserByMail: async (email) => {
        let params = {
            email: email,
            password: "P@ssword1!"
        }

        let loginUrl = apiUrl + "/api/login";

        try {
            const response = await axios.post(loginUrl, params);
            return response.data;
        } catch (error) {
            console.log("Erreur lors de la requête getUserByMail à l'API : " + error);
            return error.response.status;
        }
    },

    /**
     * recup d'un article de l'utilisateur
     */
    getArticlesByUser: async (userId, userToken) => {
        try {
            const response = await axios.get(apiUrl + "/api/private/user/" + userId + '/articles', {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.log("Erreur lors de la requête getArticlesByUser à l'API : " + error);
            return error.response.status;
        }

    }
}

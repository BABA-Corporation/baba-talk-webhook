const axios = require('axios');

module.exports = {

    /**
     * recup du token et de l'id du user avec son email
     */
    getUserByMail: async (email, password, apiUrl) => {

        let params = {
            email: email,
            password: password
        }

        let loginUrl = apiUrl + "/api/login";

        try {
            const response = await axios.post(loginUrl, params);
            return response.data;
        } catch (error) {
            console.log("Erreur lors de la requête à l'API : " + error);
            return error;
        }

    }
}
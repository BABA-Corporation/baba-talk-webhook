'use strict';

const express = require('express');
const axios = require('axios');
const logger = require('morgan');
const debug = require('debug')('baba-talk-webhook');
const {WebhookClient} = require('dialogflow-fulfillment');
// TODO Affichage d'une carte textuelle avec les informations
// const {Card, Suggestion} = require('dialogflow-fulfillment');
const bodyParser = require('body-parser');
const cors = require('cors');
// const {dialogflow} = require('actions-on-google');
const api = require('./ApiService');

require('dotenv').config();

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let tmpPort = parseInt(val, 10);

    if (isNaN(tmpPort)) {
        // named pipe
        return val;
    }

    if (tmpPort >= 0) {
        // port number
        return tmpPort;
    }

    return false;
}

const port = normalizePort(process.env.PORT || 3000);

const server = express();
// const assistant = dialogflow();

process.env.DEBUG = 'dialogflow:debug';
server.set('port', port);

if (process.env.NODE_ENV !== 'development') {
    server.use(logger('combined'));
    server.set('api', `https://api.talk.baba.click`);
} else {
    server.use(logger('dev'));
    server.set('api', `http://localhost:5001`);
}

server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));
server.use(cors());

server.get('/', (req, res) => {
    res.status(200).send('BABA TALK Webhook is working.')
});

async function getArticle(agent) {
    const possibleResponse = [
        'Toute la data que tu veux frèroo !',
        'Je te sors toutes les infos mec',
        'Pas de soucis le sang de la veine'
    ];

    /*const ToSearch =
     req.body.result && req.body.result.parameters && req.body.result.parameters.nasa
     ? req.body.result.parameters.nasa
     : '';*/

    let pick = Math.floor(Math.random() * possibleResponse.length);

    let response = possibleResponse[pick];
    agent.add(response);

    const apiUrl = server.get('api');
    const user = await api.getUserByMail("jean-mich@baba.click", "P@ssword1!", apiUrl);

    return new Promise((resolve, reject) => {
        axios.get(apiUrl + "/api/private/user/" + user.userId + '/articles', {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        })
        .then(function (res) {
            const parseData = res.data;
            const articles = parseData[0]['Bitcoins,Apple,Android'];
            const article = articles[0];
            let outputMsg = 'Voici un article de jean mich : ';
            outputMsg += article.title;
            let output = agent.add(outputMsg);
            resolve(output);
        })
        .catch(function (error) {
            console.log(error);
            let output = 'Désolé, impossible de joindre l\'API';
            resolve(output);
        })
        .then(function () {
            // always executed
        });
    });
}

function WebhookProcessing(req, res) {
    const agent = new WebhookClient({request: req, response: res});
    debug(`agent set`);
    debug('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    debug('Dialogflow Request body: ' + JSON.stringify(req.body));

    let intentMap = new Map();
    intentMap.set('test', getArticle);

    agent.handleRequest(intentMap).then(r => console.log(intentMap.size));
}

server.post('/', function (req, res) {
    debug(`\n\n>>>>>>> S E R V E R   H I T <<<<<<<`);
    WebhookProcessing(req, res);
});


server.listen(server.get('port'), () => {
    debug('Webhook is running at port ' + server.get('port'));
    console.log(server.get('port'));
});

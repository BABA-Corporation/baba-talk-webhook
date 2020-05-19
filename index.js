'use strict';

const express = require('express');
const http = require('https');
const logger = require('morgan');
const debug = require('debug')('baba-talk-webhook');
const {WebhookClient} = require('dialogflow-fulfillment');
// TODO Affichage d'une carte textuelle avec les informations
// const {Card, Suggestion} = require('dialogflow-fulfillment');
const bodyParser = require('body-parser');
const cors = require('cors');
// const {dialogflow} = require('actions-on-google');

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
} else {
    server.use(logger('dev'));
}

server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));
server.use(cors());

server.get('/', (req, res) => {
    res.status(200).send('BABA TALK Webhook is working.')
});

function test(agent) {
    const possibleResponse = [
        'Toute la data que tu veux frèroo !',
        'Je te sors toutes les infos mec',
        'Pas de soucis le sang de la veine'
    ];
    const reqUrl = encodeURI(
        `https://jsonplaceholder.typicode.com/todos/1`
    );
    /**const nasaToSearch =
     req.body.result && req.body.result.parameters && req.body.result.parameters.nasa
     ? req.body.result.parameters.nasa
     : '';**/
    let pick = Math.floor(Math.random() * possibleResponse.length);

    let response = possibleResponse[pick];
    agent.add(response);

    return new Promise((resolve, reject) => {
        http.get(
            reqUrl,
            responseFromAPI => {
                let completeResponse = '';
                responseFromAPI.on('data', chunk => {
                    completeResponse += chunk
                });
                responseFromAPI.on('end', () => {
                    const parseData = JSON.parse(completeResponse);
                    debug(parseData);
                    let outputMsg = 'Voici le message que j\'obtient depuis une API externe : ';
                    outputMsg += parseData.title;
                    let output = agent.add(outputMsg);
                    resolve(output);
                });
            },
            error => {
                let output = 'Désolé, impossible de joindre l\'API';
                resolve(output);
            }
        );
    });
}

function WebhookProcessing(req, res) {
    const agent = new WebhookClient({request: req, response: res});
    debug(`agent set`);
    debug('Dialogflow Request headers: ' + JSON.stringify(req.headers));
    debug('Dialogflow Request body: ' + JSON.stringify(req.body));

    let intentMap = new Map();
    intentMap.set('test', test);

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

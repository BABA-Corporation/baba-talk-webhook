'use strict';

const express = require('express');
const logger = require('morgan');
const debug = require('debug')('baba-talk-webhook');
const bodyParser = require('body-parser');
const cors = require('cors');
const {dialogflow, SimpleResponse, SignIn, Suggestions, LinkOutSuggestion} = require('actions-on-google');
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

const port = normalizePort(process.env.PORT || 5002);

const server = express();
const assistant = dialogflow({
    clientId: process.env.CLIENT_ID,
    debug: false,
});
server.set('port', port);

if (process.env.NODE_ENV !== 'development') {
    server.use(logger('combined'));
} else {
    server.use(logger('dev'));
}
if (process.env.DEBUG) {
    assistant.debug = true;
}
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));
server.use(cors());

server.get('/', (req, res) => {
    res.status(200).send('BABA TALK Webhook is working.')
});

const customResponses = [
    'Toute la data que tu veux',
    'Je te sors toutes les infos',
    'Pas de soucis',
    'Je te sors les articles'
];
const randomResponse = function (name) {
    let pick = Math.floor(Math.random() * customResponses.length);
    return customResponses[pick] + " " + name;
}

const getArticles = async function (userId, userToken, theme) {
    const data = await api.getArticlesByUser(userId, userToken);
    if (theme) {
        const themeMaj = theme.toUpperCase();
        for (let topics = 0; topics < data.length; topics++) {
            if (data[topics][themeMaj]) {
                return data[topics][themeMaj];
            }
        }
        return null;
    } else {
        return data[0][Object.keys(data[0])[0]];
    }
};

assistant.intent('Start Signin', (conv) => {
    conv.ask(new SignIn('Pour obtenir les informations privées sur votre vie'));
});
assistant.intent('Get Signin', async (conv, params, signin) => {
    if (signin.status === 'OK') {
        const payload = conv.user.profile.payload;
        conv.ask(`J'ai tous les détails de votre compte, ${payload.name}. Demande moi un truc mane !`);
    } else {
        conv.ask(`Je ne pourrai pas sauvegarder vos données, mais que voulez-vous faire ?`);
    }
});

assistant.middleware(async (conv) => {
    const {email} = conv.user;
    if (!conv.data.uid && email) {
        const user = await api.getUserByMail(email);
        if (user.userId && user.token) {
            conv.data.uid = user.userId;
            conv.data.token = user.token;
            debug("User connect : " + email);
        } else {
            conv.ask(new SimpleResponse({
                speech: `Je te trouve pas ! Tu es sur d'etre inscris sur notre appli ? Tu peux t'inscrire à l'adresse talk point baba point click`,
                text: `Je te trouve pas ! Tu es sur d'etre inscris sur notre appli ?`,
            }));
            return conv.close(new LinkOutSuggestion({
                name: 'talk.baba.click',
                url: 'https://talk.baba.click/',
            }));
        }
    } else if (!email) {
        conv.ask("Tu n'es pas connecté mais voici quand meme un petit article comme je suis sympatoche");
        conv.ask("Il était une fois un article");
        return conv.ask(new Suggestions('Connecte moi !', 'Rentre chez toi'));
    }
});

const veille = async function (conv, theme, next) {
    if (conv.data.uid) {

        if (!next) {
            const {payload} = conv.user.profile;
            const name = payload ? `${payload.given_name}` : '';
            conv.data.articleNumber = 0;
            conv.ask(randomResponse(name));
            conv.data.articles = await getArticles(conv.data.uid, conv.data.token, theme);
        }

        const articles = conv.data.articles;

        if (articles) {
            const article = articles[conv.data.articleNumber];
            if (article) {
                conv.ask(`${article.title}`);
                conv.data.articleNumber++;
            } else {
                conv.ask(`OOOOH NON ! Je ne trouve pas d'article`);
                conv.data.articleNumber = 0;
            }
            //TODO Affichage d'une carte textuelle avec les informations
            return conv.ask(new Suggestions('Next', 'Stop'));
        }
        return conv.ask(`Mince ! Impossible d'obtenir les articles`);
    }
};

const veilleDetails = async function (conv) {
    if (conv.data.articleNumber) {
        const articles = conv.data.articles;

        if (articles) {
            const article = articles[conv.data.articleNumber];
            if (article) {
                conv.ask(`${article.description}`);
            } else {
                conv.ask(`Impossible d'obtenir la description de cet article`);
            }
            //TODO Affichage d'une carte textuelle avec les informations
            return conv.ask(new Suggestions('Next', 'Stop'));
        }
        return conv.ask(`Mince ! Impossible d'obtenir l'articles`);
    }
};

assistant.intent('Veille', conv => veille(conv, null, false));
assistant.intent('Veille Encore', conv => veille(conv, null, true));
assistant.intent('Veille par thème', (conv, params) => veille(conv, params.theme, false));
assistant.intent('Veille details', (conv) => veilleDetails(conv));

server.post('/fulfillment', assistant);

server.listen(server.get('port'), () => {
    debug('Webhook is running at port ' + server.get('port') + ' with ' + process.env.NODE_ENV + ' env');
});
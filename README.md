# BABA TALK Webhook

[![pipeline status](https://gitlab.com/baba-corporation/baba-talk-webhook/badges/master/pipeline.svg)](https://gitlab.com/baba-corporation/baba-talk-webhook/-/commits/master)

Installation avec Docker
---

```bash
$ docker pull registry.gitlab.com/baba-corporation/baba-talk-webhook
```

> Si vous n'avez pas Docker vous pouvez cloner le projet
> ```bash
>  $ git clone https://gitlab.com/baba-corporation/baba-talk-webhook.git
>  ```

Lancement avec Docker
---

```bash
$ docker run -p 3000:3000 -d baba-talk-webhook
```

Lancement avec Node.js
--

> Node.js version 12.16.3 recommandée

```bash
$ npm install
$ npm start
```





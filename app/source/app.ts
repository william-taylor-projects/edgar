
import * as emailValidator from 'email-validator';
import * as childProcess from 'child_process';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as commander from 'commander';
import * as emailjs from 'emailjs';
import * as express from 'express';
import * as crypto from 'crypto';
import * as vhost from 'vhost';
import * as path from 'path';
import * as cors from 'cors';
import * as fs from 'fs';

import { EdgarConfig } from './types';

commander.version('0.0.1');
commander.option('-h, --help', 'Help information');
commander.option('-l, --logs', 'Display logs');
commander.parse(process.argv);

const start = (path: string, script: string, callback?: Function) => {
    childProcess.exec(script, { cwd: path }, (err, stdout, stderr) => {
        if (err instanceof Error) {
            console.error(err);
            throw err;
        }

        if(callback) {
            callback();
        }
    });
};

const decrypt = (json: any) => {
    const parse = (key: string, text: string) => {
        const decipher = crypto.createDecipher('aes-256-ctr', key);
        let dec = decipher.update(text, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
    }

    const key = process.argv.slice(-1)[0];
    json.username = parse(key, json.username);
    json.password = parse(key, json.password);
    json.host = parse(key, json.host);
    return json;
}

const newHost = (domain: string, serve: string) => {
    router.use(vhost(`*.${domain}`, express.static(serve)));
    router.use(vhost(`${domain}`, express.static(serve)));
}

const read = (fn: string): EdgarConfig => {
    const contents = fs.readFileSync(fn);
    return JSON.parse(contents.toString());
}

const useTools = (config: EdgarConfig, router) => {
    const { server } = config;

    if(server.localhost) {
        newHost('localhost', './tools/table/');
    } else {
        newHost(server.address, './tools/ping/');
    }

    newHost(server.tableDomain, './tools/table/');
    newHost(server.pingDomain, './tools/ping/');
}

const useEmail = (router) => {
    const { username, password, host } = decrypt(config.credentials);
    const emailAccount = emailjs.server.connect({
        user: username,
        password: password,
        host: host,
        ssl: true
    });

    router.post('/send', (req, res) => {
        const { email, subject, message } = req.body;

        if (emailValidator.validate(email) && subject && message) {
            emailAccount.send({
                text: `${message} Email : ${email}`,
                from: "wi11berto@yahoo.co.uk",
                to: "wi11berto@yahoo.co.uk",
                subject: subject
            });

            res.json({ msg: "Your email has been sent.", sent: true });
        } else {
            res.json({ msg: "Invalid request", sent: false, body: req.body });
        }
    });
}

const filepath = '../config/dev.json';
const config = read(filepath);
const rootFolder = path.dirname(filepath);
const router = express();
const port = 3000;

router.use(bodyParser.json());
router.use(compression());
router.use(cors());

useTools(config, router);
useEmail(router);

router.get('/get-applications', (req, res) => {
    const config = read(filepath);
    res.json(config.applications);
});

router.get('/get-server-info', (req, res) => {
    const config = read(filepath);
    res.json(config.server);
});

config.servers.forEach(child => {
    fs.exists(child.script, okay => {
        if (okay) {
            const directory = path.dirname(child.script);          
            const filename = path.basename(child.script);  

            console.log(`${filename} -> ${child.port}`);

            start(directory, `node ${filename} ${process.argv.slice(-1)[0]} ${child.port}`);
        }
    });
});

config.domains.forEach(desc => {
    const { folder, server, domain } = desc;

    if(server && server.length > 0) {
        try {
            const extension = require(server);
            if(typeof extension === 'function') {
                extension(router);
            }
        } catch(e) {
            console.log(e);
        }
    }

    if(folder && folder.length > 0) {
        newHost(domain, `${path.join(rootFolder, folder)}`);

        router.use(vhost(`*.${domain}`, (req, res) => res.redirect(`http://${domain}`)));
        router.use(vhost(`${domain}`, (req, res) => res.redirect(`http://${domain}`)));
    }
});

router.listen(port, () => {
    console.log(`Edgar on port ${port}!, Folder: ${rootFolder}`);
});
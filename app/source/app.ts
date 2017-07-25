
import * as emailValidator from 'email-validator';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as commander from 'commander';
import * as emailjs from 'emailjs';
import * as express from 'express';
import * as winston from 'winston';
import * as crypto from 'crypto';
import * as path from 'path';
import * as cors from 'cors';
import * as fs from 'fs';

import { LOCALHOST, TABLE_PATH, PING_PATH, EMAIL_ADDRESS } from './constants';
import { EdgarConfig, EdgarFeature } from './types';
import { start, decrypt, read, newHostEntry } from './common';

const useTools: EdgarFeature = (config: EdgarConfig, router: any) => {
    const { server } = config;

    newHostEntry(router, server.localhost ? LOCALHOST : server.address, PING_PATH);
    newHostEntry(router, server.tableDomain, TABLE_PATH);
    newHostEntry(router, server.pingDomain, PING_PATH);
}

const useEmail: EdgarFeature = (config: EdgarConfig, router: any) => {
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
                from: EMAIL_ADDRESS,
                to: EMAIL_ADDRESS,
                subject: subject
            });

            res.json({ msg: "Your email has been sent.", sent: true });
        } else {
            res.json({ msg: "Invalid request", sent: false, body: req.body });
        }
    });
}

class App {
    router: any;
    config: EdgarConfig;
    port: number;
    root: string;

    constructor() {
        this.parseOptions('0.0.1');
        this.getConfig();
    }

    parseOptions(version: string): void {
        commander.version(version);
        commander.option('-c, --config <path>', 'specify config file');
        commander.parse(process.argv);

        if (!commander.config) {
            winston.info('You must specify a config file e.g --config=PATH');
            process.exit(1);
        }
    }

    getConfig(): void {
        this.root = path.dirname(commander.config);
        this.config = read(commander.config);
        this.router = express();
        this.port = 3000;
    }

    attachRoutes() {
        this.router.get('/get-applications', (req, res) => {
            const config = read(commander.config);
            res.json(config.applications);
        });

        this.router.get('/get-server-info', (req, res) => {
            const config = read(commander.config);
            res.json(config.server);
        });
    }

    attachServers() {
        this.config.servers.forEach(child => {
            const directory = path.dirname(child.script);
            const filename = path.basename(child.script);

            fs.exists(path.join(this.root, directory, filename), okay => {
                if (okay) {
                    const cmd = `node ${filename} ${process.argv.slice(-1)[0]} ${child.port}`;
                    start(path.join(this.root, directory), cmd);
                }
            });
        });
    }

    attachDomains() {
        this.config.domains.forEach(desc => {
            const { folder, server, domain } = desc;

            if (server && server.length > 0) {
                try {
                    const extension = require(path.join('../', this.root, server));

                    if (typeof extension === 'function') {
                        extension(this.router);
                    }
                } catch (e) {
                    winston.info(e);
                }
            }

            if (folder && folder.length > 0) {
                newHostEntry(this.router, domain, `${path.join(this.root, folder)}`);
                newHostEntry(this.router, domain, (req, res) => res.redirect(`http://${domain}`));
            }
        });

    }

    boot(): void {
        this.router.use(bodyParser.json());
        this.router.use(compression());
        this.router.use(cors());

        useTools(this.config, this.router);
        useEmail(this.config, this.router);

        this.attachRoutes();
        this.attachServers();
        this.attachDomains();
        this.router.listen(this.port, () => {
            winston.info(`Edgar on port ${this.port} folder is ${this.root}`);
        });
    }
}

const app = new App();
app.boot();
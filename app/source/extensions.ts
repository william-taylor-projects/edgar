
import * as emailValidator from 'email-validator';
import * as commander from 'commander';
import * as emailjs from 'emailjs';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

import { LOCALHOST, TABLE_PATH, PING_PATH, EMAIL_ADDRESS } from './constants';
import { start, decrypt, read, newHostEntry } from './common';
import { EdgarConfig, EdgarExtension } from './types';

export const includeServers: EdgarExtension = (config: EdgarConfig, router: any, root: string) => {
    config.servers.forEach(child => {
        const directory = path.dirname(child.script);
        const filename = path.basename(child.script);

        fs.exists(path.join(root, directory, filename), okay => {
            if (okay) {
                const cmd = `node ${filename} ${process.argv.slice(-1)[0]} ${child.port}`;
                start(path.join(root, directory), cmd);
            }
        });
    });
}

export const includeDomains: EdgarExtension = (config: EdgarConfig, router: any, root: string) => {
    config.domains.forEach(desc => {
        const { folder, server, domain } = desc;

        if (server && server.length > 0) {
            try {
                const extension = require(path.join('../', root, server));

                if (typeof extension === 'function') {
                    extension(router);
                }
            } catch (e) {
                winston.info(e);
            }
        }

        if (folder && folder.length > 0) {
            newHostEntry(router, domain, `${path.join(root, folder)}`);
            newHostEntry(router, domain, (req, res) => res.redirect(`http://${domain}`));
        }
    });

}

export const includeTools: EdgarExtension = (config: EdgarConfig, router: any, root: string) => {
    const { server } = config;

    router.get('/get-applications', (req, res) => {
        const config = read(commander.config);
        res.json(config.applications);
    });

    router.get('/get-server-info', (req, res) => {
        const config = read(commander.config);
        res.json(config.server);
    });

    if (server.localhost) {
        winston.info('Localhost flag enabled, this should only been done in dev environments');
        newHostEntry(router, LOCALHOST, PING_PATH);
    }

    newHostEntry(router, server.tableDomain, TABLE_PATH);
    newHostEntry(router, server.pingDomain, PING_PATH);
    newHostEntry(router, server.address, PING_PATH);
}

export const includeEmail: EdgarExtension = (config: EdgarConfig, router: any, root: string) => {
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

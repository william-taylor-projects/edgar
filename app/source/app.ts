
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
import { EdgarConfig, EdgarExtension } from './types';
import { start, decrypt, read, newHostEntry } from './common';
import * as ext from './extensions';

class Bootstrap {
    router: express.Application;
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

    boot(): void {
        this.router.use(bodyParser.json());
        this.router.use(compression());
        this.router.use(cors());
        this.includeExtensions();
        this.router.listen(this.port, () => {
            winston.info(`Edgar on port ${this.port} folder is ${this.root}`);
        });
    }

    includeExtensions(): void {
        ext.includeDomains(this.config, this.router, this.root);
        ext.includeServers(this.config, this.router, this.root);
        ext.includeEmail(this.config, this.router, this.root);
        ext.includeTools(this.config, this.router, this.root);
    }
}

const app = new Bootstrap();
app.boot();
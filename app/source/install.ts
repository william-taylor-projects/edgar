
import { read, start } from './common';
import * as commander from 'commander';
import * as path from 'path';
import * as fs from 'fs';

commander.version('0.0.1');
commander.option('-c, --config <path>', 'specify config file');
commander.parse(process.argv);

const filepath = commander.config || '../config/dev/dev.json';
const rootFolder = path.dirname(filepath);
const { servers } = read(filepath);

servers.forEach(child => {
    const cwd = path.join(rootFolder, path.dirname(child.script));
    const fn = path.basename(child.script);

    fs.exists(path.join(cwd, fn), okay => {
        if (okay) {
            console.log(`npm install at ${cwd}`);
            start(cwd, `sudo npm install`);
        }
    });
});
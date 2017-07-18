
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
    const directory = path.dirname(child.script);
    const filename = path.basename(child.script);
    const fullpath = path.join(rootFolder, directory);

    fs.exists(path.join(rootFolder, directory, filename), okay => {
        if (okay) {
            let cwd = path.join(rootFolder, directory);
            console.log(`npm install at ${cwd}`);
            start(directory, `sudo npm install`);
        }
    });
});
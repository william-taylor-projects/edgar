
import * as child_process from 'child_process';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as program from 'commander';
import * as express from 'express';
import * as crypto from 'crypto';
import * as vhost from 'vhost';
import * as cors from 'cors';
import * as fs from 'fs';

program.version('0.0.1');
program.option('-h, --help', 'Help information');
program.option('-l, --logs', 'Display logs');
program.parse(process.argv);

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

const read = (fn: string) => {
    const contents = fs.readFileSync(fn); 
    return JSON.parse(contents.toString());  
}

const config = read('../config/dev.json');
const router = express();
const port = 3000;

router.use(bodyParser.json());
router.use(compression());
router.use(cors());

router.get('/get-applications', (req, res) => {
    res.json(config.applications);
});

router.get('/get-server-info', (req, res) => {
    res.json(config.server);
});

router.listen(port, () => {
    console.log(`Edgar on port ${port}!`);
});
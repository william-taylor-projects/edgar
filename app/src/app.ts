
import * as emailValidator from 'email-validator';
import * as childProcess from 'child_process';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as commander from 'commander';
import * as emailjs from 'emailjs';
import * as express from 'express';
import * as crypto from 'crypto';
import * as vhost from 'vhost';
import * as cors from 'cors';
import * as fs from 'fs';

commander.version('0.0.1');
commander.option('-h, --help', 'Help information');
commander.option('-l, --logs', 'Display logs');
commander.parse(process.argv);

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

interface EdgarConfig {
    credentials: Object[];
    applications: Object[];
    server: Object;
}

const read = (fn: string) : EdgarConfig => {
    const contents = fs.readFileSync(fn); 
    return JSON.parse(contents.toString());  
}

const config = read('../config/dev.json');
const router = express();
const port = 3000;

const { username, password, host } = decrypt(config.credentials);
const emailServer = emailjs.server.connect({ 
    user: username, 
    password: password, 
    host: host, 
    ssl: true 
});

router.use(bodyParser.json());
router.use(compression());
router.use(cors());

router.get('/get-applications', (req, res) => {
    res.json(config.applications);
});

router.get('/get-server-info', (req, res) => {
    res.json(config.server);
});

router.post('/send', (req, res) => {
    const { email, subject, message } = req.body;

    if (emailValidator.validate(email) && subject && message) {
        const msg = {
            text: `${message} Email : ${email}`,
            from: "wi11berto@yahoo.co.uk",
            to: "wi11berto@yahoo.co.uk",
            subject: subject
        };

        emailServer.send(msg);

        res.json({ msg: "Your email has been sent.", sent: true });
    } else {
        res.json({ msg: "Invalid request", sent: false, body: req.body });
    }
});

router.listen(port, () => {
    console.log(`Edgar on port ${port}!`);
});
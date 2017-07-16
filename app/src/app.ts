
import * as program from 'commander';
import * as express from 'express';

program.version('0.0.1');
program.option('-h, --help', 'Help information');
program.option('-l, --logs', 'Display logs');
program.parse(process.argv);

const router = express();
const port = 3000;

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.listen(port, () => {
    if(program.logs) {
        console.log(`Edgar on port ${port}!`);
    }
});
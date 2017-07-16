
import * as express from 'express';

const router = express();
const port = 3000;

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.listen(port, () => {
    console.log(`Edgar on port ${port}!`);
});
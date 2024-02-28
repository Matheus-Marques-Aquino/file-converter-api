const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const fileCoversion = require('./routes/file-conversion');

dotenv.config();

process.on('uncaughtException', (err) => { 
    console.error('Unhandled Exception:', err); 
});
  
const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/file-conversion', fileCoversion);

const port = process.env.PORT || 3051;
app.listen(port, () => { 
    console.log(`Servidor rodando na porta ${port}`); 
});

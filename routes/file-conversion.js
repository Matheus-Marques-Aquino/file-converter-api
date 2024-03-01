const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
const axios = require("axios");
const FormData = require('form-data');

const { exec } = require('child_process');

const path = require('path');

const fs = require('fs');

dotenv.config();

//var userId = mongo.generateUserId();
//var client = mongo.getClient(userId);
//
//await mongo.connect(userId);
//if (client){
//    await mongo.disconnect(userId);
//   await mongo.connect(userId);
//}else{
//    await mongo.connect(userId);
//}
//
//const RequestQueue = await mongo.getCollection(userId, 'RequestQueue');
//
//
//
//mongo.disconnect(userId);
const validExtensions = [ 
    "pdf", 
    "docx", 
    "doc", 
    "odt", 
    "xlsx", 
    "xls", 
    "ods", 
    "pptx", 
    "ppt", 
    "odp", 
    "rtf", 
    "txt", 
    "html" 
];

function generateRandomHash() {
    let hash = '';
        
    for (let i = 0; i < 1; i++){ 
        hash += Math.random(0).toString(36).slice(-10); 
    }

    return hash.toUpperCase();
}

async function cloneFile(filePath, copyPath) {
    return await new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {        
            if (err) {
                console.error('Erro ao ler o arquivo original:', err);
                reject(false);
                return;
            }

            fs.writeFile(copyPath, data, (err) => {
                if (err) {
                    console.error('Erro ao escrever o arquivo duplicado:', err);
                    reject(false);
                    return;
                }
                
                resolve(true);
                console.log('Arquivo duplicado com sucesso.');
            });
        }); 
    });
}

router.post('/send-file', async (req, res) => {
    const formData = new FormData();

    var fileName = 'documento_editado.docx';

    var error = false;
    var result = null;

    var convertTo = 'pdf';

    var filePath = path.resolve('public', fileName);
    var fileCopy = path.resolve('public', '_' + fileName);

    try{
        let success = await cloneFile(filePath, fileCopy);

        if (success){
            filePath = fileCopy;
        }
    }catch(e){
        error = e;
        console.error('Erro ao clonar arquivo:', e);
    }

    const fileStream = fs.createReadStream(filePath);

    formData.append('arquivo', fileStream);

    const regex = /(?:\\|\/)([^\\\/]+)\.([^\\\/.]+)$/;
    const match = filePath.match(regex);  

    try {
        await axios.post('http://localhost:3051/file-conversion?convertTo=' + convertTo, formData, {
            responseType: 'arraybuffer', // Isso garante que a resposta seja tratada como um buffer binário
          })
            .then((response) => {
                let { data } = { ...response };

                if (data) {
                    let filename = fileName;
                    
                    if (match != null && match[1]) {
                        filename = match[1] + '.' + convertTo;
                    }
                    
                    let _path = path.resolve('public', filename);

                    fs.writeFile(_path, data, 'binary', (err) => {
                        if (err) {
                            console.error('Erro ao salvar o arquivo:', err);
                            return;
                        }
                        console.log('Arquivo salvo com sucesso:', _path);
                    });

                    fs.unlink(fileCopy, (err) => {
                        if (err) { 
                            console.error('Erro ao excluir o arquivo:', err); 
                        }
                    });

                    //console.log('Arquivo salvo com sucesso:', _path);                    
                } else {
                    console.error('Resposta vazia ou sem dados de arquivo.');
                }
            })
            .catch((err) => {
                error = err;

                if (error && error.response) {
                    error = error.response;
                }

                if (error && error.data) {
                    error = error.data;
                }   

                console.error('Erro ao enviar arquivo:', error);
            });        
    } catch (err) {
        error = err;
        console.error('Erro ao enviar arquivo:', err);
    }

    if (error) {
        return res.status(400).json({ error });
    }

    return res.status(200).json({ error: false });
});

router.post("/", async (req, res) => {
    const files = { ...req.files };
    const query = { ...req.query };

    var { convertTo } = query;

    if (!files || !files.arquivo) {
        return res.status(400).json({
            error: true,
            message: 'File not found.'
        });
    }

    if (!convertTo || typeof convertTo != 'string') {
        return res.status(400).json({
            error: true,
            message: 'Invalid extension to convert.'
        });
    }

    convertTo = convertTo.toLowerCase().trim();

    if (!validExtensions.includes(convertTo) ) {
        return res.status(400).json({
            error: true,
            message: 'Invalid extension to convert.'
        });
    }

    var error = null;
    var uploadedFile = { ...files.arquivo };
    

    var randomHash = generateRandomHash() + '_';
    var fileName = randomHash + uploadedFile.name;
    
    var filePath = null;

    try {
        filePath = path.resolve('public', fileName);
        rootFile = path.resolve('public', fileName);
        
        await new Promise(async (resolve, reject) => {
            await uploadedFile.mv(filePath, async (err) => {
                if (err) {
                    console.error('Error while saving file:', err);

                    error = {
                        status: 500,
                        message: 'Internal server error while saving file.'
                    };

                    reject(error);
                    return;
                }

                console.log('File uploaded successfully.', filePath)
                resolve(filePath);
            });
        });

    }catch(err){
        console.error('Error while processing request:', err);

        error = {
            status: 500,
            message: 'Internal server error.'
        };
    }

    if (error) {
        return res.status(error.status || 400).json({
            error: true,
            message: error.message || 'Internal server error.'
        });
    }

    var outPath = path.resolve('public');   

    const command = `soffice --headless --convert-to ${convertTo} "${filePath}" --outdir "${outPath}"`;

    try {
        await new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    error = err;
                    console.error(`Erro ao converter o documento:`, error);

                    reject(error);
                    return;
                }
                                
                console.log(`Documento convertido com sucesso:`, stdout);
            
                if (stderr) {
                    console.log(`Mensagens de stderr:`, stderr);
                }
                                
                resolve(stdout);
            });
        });
    }catch (e) {
        error = e;
        console.error(`Erro ao converter o documento:`, error);
    }

    if (error) {
        return res.status(400).json({ error });
    }

    const regex = /(?:\\|\/)([^\\\/]+)\.([^\\\/.]+)$/;
    const match = filePath.match(regex);  

    try {
        if (match) {
            fileName = match[1] + '.' + convertTo;
            outPath = path.resolve('public', fileName);
        }else{
            error = {
                status: 400,
                message: 'Error while converting file.'
            };

            return;
        }

        if (typeof fileName == 'string') {
            fileName = fileName.slice(11);
        }

        res.sendFile(outPath, (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo:', err);
                
                res.status(500).send({
                    error: true, 
                    message: 'Error while sending converted file.'
                });
            } else {
                try {
                    fs.unlink(filePath, (err) => {
                        if (err) { console.error('Erro ao excluir o arquivo:', err); }
                    });

                    fs.unlink(outPath, (err) => {
                        if (err) { console.error('Erro ao excluir o arquivo:', err); }
                    });
                }catch(e){
                    error = e;
                    console.error('Erro desconhecido:', e);
                }

                console.log('File send successfully.', outPath);
            }
        });
    }catch(e){
        error = e;
        console.error('Erro ao enviar o arquivo:', e);
    }

    if (error) {
        return res.status(error.status || 400).json({ 
            error: true, 
            message: error.message || 'Error while converting file.'
        });
    }
});

router.post("/test-route", async (req, res) => {
    var error = null;

    const filePath = path.resolve('public', 'documento_editado.docx');

    const url = 'http://localhost:3051/file-conversion';    

    try {
        const fileBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

        var payload = {
            fileBase64: fileBase64,
            fileName: 'documento_editado.docx',
            convertTo: 'pdf'
        };

        await axios.post(url, payload)
            .then((response) => {
                let { data } = { ...response };
                console.log('Data:', data);

                let {
                    fileBase64,
                    fileName
                } = data;
                
                try {
                    const randomHash = '_' + generateRandomHash() + '_';

                    const decoded = Buffer.from(fileBase64, 'base64');    

                    const filePath = path.resolve('public', randomHash + fileName);
            
                    if (!filePath) {
                        console.error('Erro ao salvar o arquivo!');
                        return;
                    }
            
                    fs.writeFileSync(filePath, decoded);        
                } catch(e) {
                    error = e;
                    console.error('Erro ao receber o arquivo:', e);
                }
            })
            .catch((err) => {
                error = err;

                if (error && error.response) {
                    error = error.response;
                }

                if (error && error.data) {
                    error = error.data;
                }

                console.error('Erro ao enviar o arquivo:', error);
            });
    } catch (error) {
        console.error('Erro ao enviar o arquivo:', error);
    }

    if (error) {   
        return res.status(400).json({ error });
    }

    return res.status(200).json({ message: 'Arquivo enviado com sucesso!' });
});

router.post("/docx-to-pdf", async (req, res) => {
    const docxPath = path.resolve('public', 'documento_editado.docx');
    const outputDir = path.resolve('public');   

    const command = `soffice --convert-to pdf "${docxPath}" --outdir "${outputDir}"`;

    var error = null;

    try {
        await new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    error = err;
                    console.error(`Erro ao converter o documento:`, error);

                    reject(error);
                    return;
                }
                                
                console.log(`Documento convertido com sucesso:`, stdout);
            
                if (stderr) {
                    console.log(`Mensagens de stderr:`, stderr);
                }
                                
                resolve(stdout);
            });
        });
    }catch (e) {
        error = e;
        console.error(`Erro ao converter o documento:`, error);
    }

    if (error) {
        return res.status(400).json({error});
    }

    return res.status(200).json({message: "Documento convertido com sucesso"});
});

module.exports = router;
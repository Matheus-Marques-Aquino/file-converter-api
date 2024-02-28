const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
const axios = require("axios");

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

router.post("/", async (req, res) => {
    const body = { ...req.body };
    var error = null;

    var {
        fileBase64,
        fileName,
        convertTo
    } = body;

    if (typeof convertTo == 'string') {
        convertTo = convertTo.toLowerCase().trim();
    }

    if ( !convertTo || !validExtensions.includes(convertTo) ) {
        return res.status(400).json({ error: "Extensão de conversão inválida!" });
    }

    var randomHash = generateRandomHash() + '_';
    var filePath = null;

    try {
        const decoded = Buffer.from(fileBase64, 'base64');    
        filePath = path.resolve('public', randomHash + fileName);

        if (!filePath) {
            error = 'Erro ao salvar o arquivo!';
            return;
        }

        fs.writeFileSync(filePath, decoded);        
    } catch(e) {
        error = e;
        console.error('Erro ao receber o arquivo:', e);
    }

    if (error) {        
        return res.status(400).json({ error });
    }

    var outPath = path.resolve('public');   

    const command = `soffice --convert-to ${convertTo} "${filePath}" --outdir "${outPath}"`;

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
            error = 'Erro ao obter o nome do arquivo convertido!';
            return;
        }
        
        fileBase64 = fs.readFileSync(outPath, { encoding: 'base64' });
        fs.unlinkSync(outPath);
        fs.unlinkSync(filePath);

        if (typeof fileName == 'string') {
            fileName = fileName.slice(11);
        }
    }catch(e){
        error = e;
        console.error('Erro ao enviar o arquivo:', e);
    }

    if (error) {
        return res.status(400).json({ error });
    }

    return res.status(200).json({
        fileBase64,
        fileName
    });
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
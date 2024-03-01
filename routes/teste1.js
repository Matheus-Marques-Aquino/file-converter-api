const express = require('express');
const fs = require('fs');
const app = express();

// Rota para lidar com a solicitação e enviar o arquivo como resposta
app.get('/download', (req, res) => {
    const filePath = 'caminho/do/seu/arquivo';
    
    // Verifica se o arquivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('O arquivo não existe:', err);
            return res.status(404).send('Arquivo não encontrado');
        }
        
        // Envia o arquivo como resposta
        res.sendFile(filePath);
    });
});

// Inicie o servidor na porta desejada
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor está ouvindo na porta ${port}`);
});
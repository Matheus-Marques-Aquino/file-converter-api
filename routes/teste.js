const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

// Middleware para processar o upload de arquivos
app.use(fileUpload());

// Rota para lidar com o upload de arquivos
app.post('/upload', (req, res) => {
    try {
        // Verifica se há um arquivo na solicitação
        if (!req.files || !req.files.arquivo) {
            return res.status(400).send('Nenhum arquivo foi enviado.');
        }

        // Salva o arquivo recebido
        const uploadedFile = req.files.arquivo;
        const filePath = 'caminho/para/salvar/arquivo/recebido';
        uploadedFile.mv(filePath, async (err) => {
            if (err) {
                console.error('Erro ao salvar o arquivo:', err);
                return res.status(500).send('Erro interno ao salvar o arquivo.');
            }

            // Aqui você pode realizar operações adicionais com o arquivo, se necessário

            // Envie uma resposta de sucesso
            res.send('Arquivo enviado com sucesso.');
        });
    } catch (error) {
        console.error('Erro durante o processamento da solicitação:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Inicia o servidor na porta desejada
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor está ouvindo na porta ${port}`);
});

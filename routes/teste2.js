const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Função para enviar arquivo usando Axios
async function enviarArquivo() {
    const formData = new FormData();
    const fileStream = fs.createReadStream('caminho/do/seu/arquivo');

    // Adicionando o arquivo ao formulário de dados
    formData.append('arquivo', fileStream);

    try {
        const response = await axios.post('URL_DA_SUA_API', formData, {
            headers: {
                ...formData.getHeaders(), // Definindo cabeçalhos necessários para multipart/form-data
                // Se necessário, adicione outros cabeçalhos aqui
            },
        });

        console.log('Resposta:', response.data);
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
    }
}

// Chamando a função para enviar o arquivo
enviarArquivo();

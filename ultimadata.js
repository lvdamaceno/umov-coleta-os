import fs from 'fs/promises';
import path from 'path';

// Função para obter o ano e mês atuais no formato "aaaamm"
function obterAnoEMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}${mes}`;
}

// Função para ler e pegar a última linha de um arquivo
async function pegarUltimaLinhaDoArquivo(filePath) {
  try {
    const conteudo = await fs.readFile(filePath, 'utf8');
    const linhas = conteudo.trim().split('\n');
    return linhas.pop(); // Retorna a última linha não vazia
  } catch (erro) {
    console.error(`Erro ao ler o arquivo "${filePath}":`, erro.message);
    return null;
  }
}

// Função para listar arquivos e pegar a última linha do arquivo correspondente ao ano e mês atuais
async function listarArquivoPorAnoMes(pasta) {
  try {
    const anoMesAtual = obterAnoEMesAtual();
    const arquivos = await fs.readdir(pasta);

    const arquivoCorrespondente = arquivos.find(arquivo => arquivo === `datas${anoMesAtual}.csv`);

    if (arquivoCorrespondente) {
      const filePath = path.join(pasta, arquivoCorrespondente);
      return await pegarUltimaLinhaDoArquivo(filePath);
    } else {
      console.log(`Nenhum arquivo correspondente encontrado para ${anoMesAtual}.`);
      return null;
    }
  } catch (erro) {
    console.error('Erro ao listar ou ler arquivos na pasta:', erro.message);
    return null;
  }
}

// Função para obter a primeira data no formato dd/mm/aaaa de um texto
function obterPrimeiraData(texto) {
  const regexData = /\b(\d{2}\/\d{2}\/\d{4})\b/;
  const resultado = texto.match(regexData);
  return resultado ? resultado[1] : null;
}

// Função principal que processa o arquivo e retorna a primeira data da última linha
async function processarArquivoComData(pasta) {
  const ultimaLinha = await listarArquivoPorAnoMes(pasta);

  if (ultimaLinha) {
    const primeiraData = obterPrimeiraData(ultimaLinha);
    return primeiraData || null; // Retorna a data ou null se não houver data
  }
  return null; // Retorna null se não houver linha
}

// Caminho para a pasta onde estão os arquivos
const directoryPath = path.join(process.cwd(), 'logs/datas');

// Exemplo de uso
processarArquivoComData(directoryPath).then(data => {
  console.log(data); // Aqui você pode tratar o valor da data como desejar
});

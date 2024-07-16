import axios from 'axios';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// ============================================
// CONFIGURAÇÕES
// ============================================

const url = process.env.SNK_URL;
const endpoint_query = process.env.SNK_ENDPOINT_QUERY;

const headers = {
  password: process.env.PASSWORD,
  username: process.env.USERNAME,
  appkey: process.env.APPKEY,
  token: process.env.TOKEN,
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

// Função para retornar a data de hoje em dd/mm/aaaa
function today() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Os meses começam do 0
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

// Função para tratar a data enviada, se for nulo usa a data de ontem
function formatDate(inputDate) {
  if (!inputDate) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    console.log(`Enviado Ordens do dia ${day}/${month}/${year}`);
    return `${day}/${month}/${year}`;
  }
  console.log(`Enviado Ordens do dia ${inputDate}`);
  return inputDate;
}

// Função para tratar erros de requisição
function handleRequestError(error, context) {
  if (error.response) {
    console.error(`${context}: Recusada:`, error.response.data);
    console.error('Status do erro:', error.response.status);
  } else if (error.request) {
    console.error('Nenhuma resposta recebida:', error.request);
  } else {
    console.error('Erro ao configurar a requisição:', error.message);
  }
}

// Função para criar o nome dos arquivos de log
function getMonthYear(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
  const year = date.getFullYear();
  return `${year}${month}`;
}

// Função para registrar datas em CSV
function logDateToCSV(date) {
  const logFilePath = path.join(process.cwd(), `logs/datas/datas${getMonthYear()}.csv`);
  const fileExists = fs.existsSync(logFilePath);
  if (!fileExists) {
    fs.writeFileSync(logFilePath, 'Registro de envio de Ordens de Serviço\n');
  }
  fs.appendFileSync(logFilePath, `OS's do dia ${date} enviadas em ${today()}\n`);
}

// Função para registrar ordens de serviço em CSV
function logOsToCSV(text) {
  const logFilePath = path.join(process.cwd(), `logs/notas/notas${getMonthYear()}.csv`);
  const fileExists = fs.existsSync(logFilePath);
  if (!fileExists) {
    fs.writeFileSync(logFilePath, 'Registro das Ordens de Serviço enviadas\n');
  }
  fs.appendFileSync(logFilePath, `${text}\n`);
}

// ============================================
// FUNÇÕES DE ENVIO
// ============================================

// Função para realizar o login e obter o token
async function token() {
  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.bearerToken;
    console.log('Conexão com Sankhya autorizada');
    return token;
  } catch (error) {
    handleRequestError(error, 'Conexão com Sankhya');
  }
}

// Função para enviar as notas para o UMOV
async function postMontagens(nunota) {
  const url = `${process.env.APIPASS_SEND_TO_UMOV}${nunota}`;
  const log = `Ordem de serviço ${nunota} enviada em ${today()}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      console.log(log);
      logOsToCSV(log);
    } else {
      console.error('Erro na requisição:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error);
  }
}

// Função que monta o body da requisição
function options(auth, date) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth}`,
    },
    body: JSON.stringify(requestBody(date)),
  };
}

// Função que cria o body da requisição
function requestBody(date) {
  return {
    serviceName: 'DbExplorerSP.executeQuery',
    requestBody: {
      sql: `SELECT sankhya.CC_UMOV_COLETA_OS('${date}') AS MontagensJSON`,
    },
  };
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

// Função principal para autenticação e envio de OS para UMOV
async function sentOsToUmov(date) {
  logDateToCSV(date);
  try {
    const authToken = await token();
    const response = await fetch(endpoint_query, options(authToken, date));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    for (const row of rows) {
      const baseArray = row[0].split(',');
      for (const element of baseArray) {
        await postMontagens(element);
      }
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// ============================================
// CHAMADA DA FUNÇÃO PRINCIPAL
// ============================================

// No parâmetro, uma função se ficar vazia assume a data do dia anterior, se não a data que for informada no formato dd/mm/aaaa
sentOsToUmov(formatDate());
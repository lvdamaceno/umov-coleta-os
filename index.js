import axios from 'axios';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// URL para a requisição de login
const url = process.env.SNK_URL;

// Headers da requisição
const headers = {
  password: process.env.PASSWORD,
  username: process.env.USERNAME,
  appkey: process.env.APPKEY,
  token: process.env.TOKEN,
};

// Função para realizar o login
async function token() {
  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.bearerToken;
    console.log(`Conexão com Sankhya autorizada`);
    return token;
  } catch (error) {
    handleRequestError(error, 'Conexão com Sankhya');
  }
}

// Função para enviar as notas para o UMOV
async function postMontagens(nunota) {
  const url = `${process.env.APIPASS_SEND_TO_UMOV}${nunota}`;
  const log = `Ordem de serviço ${nunota} enviada em ${today()}`
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
      // console.log('Resposta ApiPass:', data);
      console.log(log)
      logOsToCSV(log)
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
      'Authorization': `Bearer ${auth}`
    },
    body: JSON.stringify(requestBody(date)),
  };
}

// Função que cria o body da requisição
function requestBody(date) {
  return {
    serviceName: "DbExplorerSP.executeQuery",
    requestBody: {
      sql: `SELECT sankhya.CC_UMOV_COLETA_OS('${date}') AS MontagensJSON`,
    },
  };
}

// Funçao para retornar a data de hoje em dd/mm/aaaa
function today() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Os meses começam do 0
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate

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
    console.log(`Enviado Ordens do dia ${day}/${month}/${year}`)
    return `${day}/${month}/${year}`;
  }
  console.log(`Enviado Ordens do dia ${inputDate}`)
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

// Funcao que cria o nome dos arquivos de log
function getMonthYear(date = new Date()) {
  date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
  const year = date.getFullYear();
  return `${year}${month}`;
}

function logDateToCSV(date) {
  const logFilePath = path.join(process.cwd(), `logs/datas/datas${getMonthYear(formatDate)}.csv`);
  const fileExists = fs.existsSync(logFilePath);
  if (!fileExists) {
    fs.writeFileSync(logFilePath, 'Registro de envio de Ordens de Serviço\n');
  }
  fs.appendFileSync(logFilePath, `OS's do dia ${date} enviadas em ${today()}\n`);
}

function logOsToCSV(text) {
  const logFilePath = path.join(process.cwd(), `logs/notas/notas${getMonthYear(formatDate)}.csv`);
  const fileExists = fs.existsSync(logFilePath);
  if (!fileExists) {
    fs.writeFileSync(logFilePath, 'Registro das Ordens de Serviço enviadas\n');
  }
  fs.appendFileSync(logFilePath, `${text}\n`);
}

// URL para endpoint de query
const endpoint_query = process.env.SNK_ENDPOINT_QUERY;

// Autenticação e envio de OS para Umov
const authentication = await token();

async function sentOsToUmov(date) {
  logDateToCSV(date)
  try {
    const response = await fetch(endpoint_query, options(authentication, date));
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(async row => {
      const baseArray = row[0].split(',');
      for (let element of baseArray) {
        await postMontagens(element);
      }
    });
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// Chamada da função principal
// no parametro uma função se ficar vazia assume a data do dia anterior, se não a data que for informada no formato dd/mm/aaaa
sentOsToUmov(formatDate('14/02/2024'));
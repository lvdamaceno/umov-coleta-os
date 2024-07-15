import axios from 'axios';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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
    console.log('Conexão com Sankhya: Autorizada');
    return token;
  } catch (error) {
    handleRequestError(error, 'Conexão com Sankhya');
  }
}

// Função para enviar as notas para o UMOV
async function postMontagens(nunota) {
  const url = `${process.env.APIPASS_SEND_TO_UMOV}${nunota}`;
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
      console.log('Resposta Umov:', data);
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

// Função para tratar a data enviada, se for nulo usa a data de ontem
function yesterday(inputDate) {
  if (!inputDate) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    return `${day}/${month}/${year}`;
  }
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

// URL para endpoint de query
const endpoint_query = process.env.SNK_ENDPOINT_QUERY;

// Autenticação e envio de OS para Umov
const authentication = await token();

async function sentOsToUmov(date) {
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

// Chamada da função com data específica
sentOsToUmov(yesterday('23/01/2024'));

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// URL para a requisição de login
const url = process.env.SNK_URL;

// Headers da requisição
const headers = {
  'password': process.env.PASSWORD,
  'username': process.env.USERNAME,
  'appkey': process.env.APPKEY,
  'token': process.env.TOKEN
};

// Função para realizar o login
export async function token() {
  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.bearerToken;
    console.log('Conexão com Sankhya: Autorizada');
    return token;
  } catch (error) {
    if (error.response) {
      console.error('Conexão com Sankhya: Recusada:', error.response.data);
      console.error('Status do erro:', error.response.status);
    } else if (error.request) {
      console.error('Nenhuma resposta recebida:', error.request);
    } else {
      console.error('Erro ao configurar a requisição:', error.message);
    }
  }
}

// Função para enviar as notas para o UMOV
export async function postMontagens(nunota) {
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
export function options(auth, date) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth}`
    },
    body: JSON.stringify(requestBody(date))
  }
  return options
}


function requestBody(date) {
  const requestBody = {
    serviceName: "DbExplorerSP.executeQuery",
    requestBody: {
      sql: `SELECT sankhya.CC_UMOV_COLETA_OS('${date}') AS MontagensJSON`
    }
  };
  return requestBody
}

export function yesterday(inputDate) {
  if (!inputDate) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const year = yesterday.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate
  } else {
    return inputDate
  }
}

// Função para tratar a data enviada, se for nulo usa a data de ontem
export function getDate(inputDate) {
  let date;
  if (!inputDate) {
    date = new Date();
    date.setDate(date.getDate() - 1);
  } else {
    date = new Date(inputDate);
  }
  return date;
}
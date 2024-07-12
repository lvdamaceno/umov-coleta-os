import fetch from 'node-fetch';
import { token, requestBody } from './functions.js'
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SNK_ENDPOINT_QUERY
const postUrl = process.env.APIPASS_SEND_TO_UMOV
const authentication = await token();
const data_nota = '06/01/2023'

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authentication}`
  },
  body: JSON.stringify(requestBody(data_nota))
}

async function postMontagens(nunota) {
  const url = `${postUrl}${nunota}`;

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Adicione outros headers, se necessário
    },
  };
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      console.log('Dados recebidos:', data);
    } else {
      console.error('Erro na requisição:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error);
  }

}

async function fetchData() {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    const { responseBody: { rows } } = data;

    rows.forEach(async row => {
      const base_array = [row[0].split(',')]
      const array = base_array[0]
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        postMontagens(element)
      }
    });
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

fetchData();
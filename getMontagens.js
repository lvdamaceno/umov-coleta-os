import fetch from 'node-fetch';
import { token, requestBody, postMontagens } from './functions.js'
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SNK_ENDPOINT_QUERY
const authentication = await token();
const data_nota = '10/01/2023'

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authentication}`
  },
  body: JSON.stringify(requestBody(data_nota))
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
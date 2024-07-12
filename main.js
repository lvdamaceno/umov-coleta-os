import fetch from 'node-fetch';
import { token, options, postMontagens, yesterday } from './functions.js'
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SNK_ENDPOINT_QUERY
const authentication = await token();

async function sentOsToUmov(date) {
  try {
    const response = await fetch(url, options(authentication, date));
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

sentOsToUmov(yesterday());
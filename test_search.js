import { sources } from './src/sources/index.js';
import fetch from 'node-fetch';

global.fetch = fetch; // mock fetch if needed

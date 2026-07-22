import { sources } from './src/sources';

const azora = sources['azorafly'];
if (azora) {
  azora.search('Return of the Mount Hua').then(res => {
    console.log(res);
  });
}

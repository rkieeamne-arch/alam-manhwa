import { proxiedFetch } from './src/sources/fetch';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://eta.animerco.org/seasons/tensei-shitara-slime-datta-ken-season-4/';
  console.log('Fetching:', url);
  try {
    const res = await proxiedFetch(url);
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    const $ = cheerio.load(html);
    
    // Log some basic elements
    console.log('Title:', $('title').text());
    
    // Look for links to episodes, or general links
    const links: {text: string, href: string, parentClass: string}[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      const parentClass = $(el).parent().attr('class') || '';
      if (href) {
        links.push({ text, href, parentClass });
      }
    });
    
    console.log('Total links found:', links.length);
    console.log('Sample links:', links.slice(0, 30));
    
    // Specifically search for elements with "episode" or similar
    const filtered = links.filter(l => 
      l.href.includes('episode') || 
      l.href.includes('ep-') || 
      l.text.includes('الحلقة') || 
      l.text.includes('حلقة') ||
      l.href.includes('seasons')
    );
    console.log('Filtered episode/season links:', filtered);
    
    // Check some structure
    console.log('Let us inspect elements with class containing "episode" or "episodio" or "item":');
    $('*[class*="episode"], *[class*="episod"], *[class*="item"], *[id*="episode"]').each((_, el: any) => {
      console.log('Tag:', el.tagName || el.name, 'Class:', $(el).attr('class'), 'Id:', $(el).attr('id'), 'Text:', $(el).text().trim().slice(0, 50));
    });

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();

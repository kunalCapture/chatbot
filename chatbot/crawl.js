// import cheerio from 'cheerio';

  
export const crawlWebsite = async (website) => {

    try {
        const response  = await fetch(website);
        const text = await response.text();
        return text;
    
        // Process the extracted data (e.g., save to a file or database)
    
        // Find links to other web pages and call the crawl function recursively
        // Example: crawl('https://example.com/some-page');
      } catch (error) {
        console.error(`Failed to crawl "${url}": ${error.message}`);
      }
}

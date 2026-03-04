const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');

Actor.main(async () => {
  const input = await Actor.getInput();
  const { destinations, checkIn, checkOut, maxHotels = 20 } = input;
  
  console.log('Starting Booking.com scraper...');
  console.log('Destinations:', destinations);
  console.log('Check-in:', checkIn);
  console.log('Check-out:', checkOut);
  console.log('Max hotels:', maxHotels);
  
  const results = [];
  const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL']
  });
  
  for (const destination of destinations) {
    if (results.length >= maxHotels) break;
    
    try {
      const checkInParam = checkIn ? `&checkin=${checkIn}` : '';
      const checkOutParam = checkOut ? `&checkout=${checkOut}` : '';
      const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}${checkInParam}${checkOutParam}&group_adults=2&no_rooms=1&group_children=0`;
      
      const response = await axios.get(searchUrl, {
        proxy: proxyConfiguration.createProxyUrl(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      const $ = cheerio.load(response.data);
      const hotels = $('[data-testid="property-card"]');
      
      hotels.each((i, el) => {
        if (results.length >= maxHotels) return false;
        
        const name = $(el).find('[data-testid="title"]').text().trim() || '';
        const ratingText = $(el).find('[data-testid="review-score"]').text().trim() || '';
        const rating = parseFloat(ratingText.match(/([0-9.]+)/)?.[0]) || 0;
        const reviewCount = parseInt($(el).find('[data-testid="review-count"]').text().replace(/[^0-9]/g, '')) || 0;
        const price = $(el).find('[data-testid="price-and-discounted-price"]').text().trim() || 
                     $(el).find('.prco-valign-middle-helper').text().trim() || '';
        const location = $(el).find('[data-testid="address"]').text().trim() || '';
        const stars = $(el).find('[data-testid="rating-stars"] svg').length || 
                     $(el).find('.bui-rating').attr('aria-label')?.match(/(\d+)/)?.[0] || '';
        const url = $(el).find('a[data-testid="title-link"]').attr('href') || '';
        const freeCancellation = $(el).find('[data-testid="cancellation-policy"]').text().toLowerCase().includes('free cancellation');
        
        results.push({
          name,
          rating,
          reviewCount,
          price,
          location,
          stars,
          url: url.startsWith('http') ? url : `https://www.booking.com${url}`,
          freeCancellation,
          destination,
          checkIn,
          checkOut
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Error scraping destination "${destination}":`, error.message);
    }
  }
  
  await Actor.pushData(results);
  console.log('Scraping completed. Total results:', results.length);
});
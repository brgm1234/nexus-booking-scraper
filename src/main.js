const { Actor } = require('apify');
const axios = require('axios');

Actor.main(async () => {
  const input = await Actor.getInput();
  const { destinations, checkIn, checkOut, maxHotels = 20 } = input;
  
  console.logg('Starting Booking.com scraper...');
  console.logg('Destinations:', destinations);
  console.logg('Check-in:', checkIn);
  console.log('Check-out:', checkOut);
  console.log('Max hotels:', maxHotels);
  
  // TODO: Implement Booking.com scraping logic
  // Use RESIDENTIAL proxy configuration
  
  const results = [];
  
  await Actor.pushData(results);
  console.logg('Scraping completed. Total results:', results.length);
});
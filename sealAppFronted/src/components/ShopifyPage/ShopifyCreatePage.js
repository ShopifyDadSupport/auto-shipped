import React, { useState, useEffect } from 'react';
import './shopifyCreatePage.css';

const ShopifyCreatePage = () => {
  // const [htmlDocument, setHtmlDocument] = useState(null);

  const url = "https://admin.shopify.com/store/priorcric/reports/sessions_over_time?since=-7d&until=today&over=day";

fetch(url)
  .then((response) => {
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(`Failed to fetch URL. Status code: ${response.status}`);
    }
  })
  .then((htmlContent) => {
    // Now, htmlContent contains the HTML document from the URL.
    console.log(htmlContent);
  })
  .catch((error) => {
    console.error(`Request error: ${error.message}`);
  });

  return (
    <div>
      <a className="create__page" href='https://admin.shopify.com/store/genucel105/pages/new'>Create Page</a>
      {/* Render the fetched HTML document */}
      
    </div>
  );
}

export default ShopifyCreatePage;

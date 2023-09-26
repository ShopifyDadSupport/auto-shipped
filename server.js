const crypto = require("crypto");
const nonce = require("nonce")();
const request = require("request-promise");
const querystring = require("querystring");
const databaseData = require("./db/demo_db_connection");
const sendSubscriptionEmail = require('./sendSubscriptionEmail');
const mysql = require("mysql");
const axios = require("axios");
const cookie = require("cookie");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
var cron = require("node-cron");
const fs = require("fs");
const storeOrderId = './storeOrderId';
// const path = require('path');
// const multer = require('multer');
var cors = require("cors");
const { json } = require("express");
dotenv.config();
const bodyParser = require("body-parser");
const { captureRejectionSymbol } = require("events");
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.options("*", cors());

const staticPath = path.join(__dirname, "build");
app.use(express.static(staticPath));
const apiKey = SHOPIFY_API_KEY;

//const upload = multer({ dest: 'uploads/' });
const apisecret = SHOPIFY_API_SECRET;

const scopes =
  "read_orders,write_orders,read_products,write_products,read_customers,write_customers,read_shipping,write_shipping ,read_themes,write_themes";

const forwardingaddress = "https://3e77-183-82-162-242.ngrok-free.app";

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.get("/shopify", (req, res) => {
  // Shop Name
  const shop = req.query.shop;
  if (shop) {
    const state = nonce();
    //  redirect
    const redirectURL = forwardingaddress + "/shopify/callback";
    // Install
    const shopifyURL =
      "https://" +
      shop +
      "/admin/oauth/authorize?client_id=" +
      apiKey +
      "&scope=" +
      scopes +
      "&state=" +
      state +
      "&redirect_uri=" +
      redirectURL;

    res.cookie("state", state);
    res.redirect(shopifyURL);
  } else {
    return res.status(400).send('Missing "Shop Name" parameter!! please add');
  }
});
app.get("/shopify/callback", (req, res) => {
  const { shop, hmac, code, shopState } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).shopState;
  if (shopState !== stateCookie) {
    return res.status(400).send("request origin cannot be found");
  }
  if (shop && hmac && code) {
    const Map = Object.assign({}, req.query);
    delete Map["hmac"];
    const message = querystring.stringify(Map);
    const generatehmac = crypto
      .createHmac("sha256", apisecret)
      .update(message)
      .digest("hex");
    // console.log(generatehmac)
    if (generatehmac !== hmac) {
      return res.status(403).send("validation failed");
    }
    const accessTokenRequestUrl =
      "https://" + shop + "/admin/oauth/access_token";
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apisecret,
      code,
    };

    request
      .post(accessTokenRequestUrl, { json: accessTokenPayload })

      .then((accessTokenResponse) => {
        const accessToken = accessTokenResponse.access_token;

        const apiRequestURL = "https://" + shop + "/admin/products.json";

        const apiRequestHeaders = {
          "X-Shopify-Access-Token": accessToken,
        };

        request
          .get(apiRequestURL, { headers: apiRequestHeaders })

          .then((apiResponse) => {
            GetAccessToken(accessToken, shop);
            console.log("accessToken:", accessToken);
            res.redirect("/?shop=" + shop);
          })
          .catch((error) => {
            res.status(error.statusCode).send(error.error.error_description);
          });
      })
      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
      });
  } else {
    return res.status(400).send("required parameter missing");
  }
});

function GetAccessToken(access_token_value, shop_domain) {
  console.log("accessToken:", access_token_value);

  const envFilePath = path.join(__dirname, ".env");
  const newVariables = {
    accessToken: access_token_value,
  };
  fs.readFile(envFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading .env file:", err);
      return;
    }
    const envVariables = {};
    data.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVariables[key] = value;
      }
    });
    const mergedVariables = { ...envVariables, ...newVariables };
    const updatedEnvContent = Object.keys(mergedVariables)
      .map((key) => `${key}=${mergedVariables[key]}`)
      .join("\n");
    fs.writeFile(envFilePath, updatedEnvContent, "utf-8", (err) => {
      if (err) {
        console.error("Error writing .env file:", err);
        return;
      }
      console.log(".env file updated successfully.");
    });
  });
}

// var request = require('request');

// Check if the script tag already exists
function checkScriptTagExistence(existingScriptTags, desiredSrc) {
  return existingScriptTags.some(function (scriptTag) {
    return scriptTag.src === desiredSrc;
  });
}

var optionsGet = {
  'method': 'GET',
  'url': 'https://genucel105.myshopify.com/admin/api/2023-04/script_tags.json',
  'headers': {
    'x-shopify-access-token': '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'
  }
};

request(optionsGet, function (error, response) {
  if (error) throw new Error(error);
  var existingScriptTags = JSON.parse(response.body).script_tags;
  var desiredSrc = 'https://shopify.unimedcrm.com/ChamonixShopifyAuthontication/pageScripttag.js';

  if (!checkScriptTagExistence(existingScriptTags, desiredSrc)) {
    var optionsPost = {
      'method': 'POST',
      'url': 'https://genucel105.myshopify.com/admin/api/2023-04/script_tags.json',
      'headers': {
        'x-shopify-access-token': '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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "script_tag": {
          "src": desiredSrc,
          "event": "onload",
          "display_scope": "all"
        }
      })
    };

    request(optionsPost, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
  } else {
    console.log('Script tag already exists.');
  }
})
app.post("/scriptrender/toggle", async (req, res) => {
  console.log("scriptrender........");
  const isChecked = req.body.isChecked;
  console.log("Received new value:", isChecked);

  if (isChecked === true) {
    console.log("working fine.......");
    const shopifyAccessToken = "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";
    const shopifyStoreUrl = "https://genucel105.myshopify.com";
    const apiVersion = "2023-01";
    const src = "https://shopify.unimedcrm.com/ChamonixShopifyAuthontication/sealAppScripttag.js";
    const event = "onload";
    const displayScope = "all";

    const scriptTagId_value = [];

    // Check if a script tag with the same src already exists
    const checkIfScriptTagExists = async () => {
      const options = {
        method: "GET",
        url: `${shopifyStoreUrl}/admin/api/${apiVersion}/script_tags.json`,
        headers: {
          "x-shopify-access-token": shopifyAccessToken,
        },
      };

      try {
        const response = await request(options);
        const scriptTags = JSON.parse(response).script_tags;
        const matchingScriptTag = scriptTags.find((tag) => tag.src === src);

        if (matchingScriptTag && isChecked === true) {
          updateScriptTag(matchingScriptTag.id);
        } else {
          createScriptTag();
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Create a new script tag
    const createScriptTag = async () => {
      const options = {
        method: "POST",
        url: `${shopifyStoreUrl}/admin/api/${apiVersion}/script_tags.json`,
        headers: {
          "x-shopify-access-token": shopifyAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script_tag: {
            src,
            event,
            display_scope: displayScope,
          },
        }),
      };

      try {
        const response = await request(options);
        const parsedResponse = JSON.parse(response);
        const scriptTagId = parsedResponse.script_tag.id;
        console.log("New Script Tag ID:", scriptTagId);
      } catch (error) {
        console.error(error);
      }
    };

    // Update an existing script tag
    const updateScriptTag = async (scriptId) => {
      const options = {
        method: "PUT",
        url: `${shopifyStoreUrl}/admin/api/${apiVersion}/script_tags/${scriptId}.json`,
        headers: {
          "x-shopify-access-token": shopifyAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script_tag: {
            src,
            event,
            display_scope: displayScope,
          },
        }),
      };

      try {
        const response = await request(options);
        const parsedResponse = JSON.parse(response);
        const updatedScriptTagId = parsedResponse.script_tag.id;
        console.log("Updated Script Tag ID:", updatedScriptTagId);
      } catch (error) {
        console.error(error);
      }
    };

    // Example usage
    await checkIfScriptTagExists();

  } else {

    console.log("skjdhsjdhjgdhshggb......")
    //   const shopifyAccessToken = "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";
    //   // const shopifyStoreUrl = 'https://genucel105.myshopify.com';
    //   const apiVersion = "2023-01";
    //   const src = "https://shopify.unimedcrm.com/ChamonixShopifyAuthontication/sealAppScripttag.js";
    //   const event = "onload";
    //   const displayScope = "all";
    //   const options = {
    //     method: "GET",
    //     url: `https://genucel105.myshopify.com/admin/api/${apiVersion}/script_tags.json`,
    //     headers: {
    //       "x-shopify-access-token": shopifyAccessToken,
    //     },
    //   };

    //   try {
    //     const response = await request(options);
    //     const scriptTags = JSON.parse(response).script_tags;
    //     const matchingScriptTag = scriptTags.find((tag) => tag.src === src);
    //     console.log("matchingScriptTag.id:-", matchingScriptTag.id);
    //     try {
    //       const options = {
    //         method: "DELETE",
    //         url: `https://genucel105.myshopify.com/admin/api/${apiVersion}/script_tags/${matchingScriptTag.id}.json`,
    //         headers: {
    //           "x-shopify-access-token": shopifyAccessToken,
    //         },
    //       };
    //       const response = await request(options);
    //       console.log(response.body);
    //     } catch (error) {
    //       console.error(error);
    //     }
    //   } catch (error) {
    //     console.error(error);
    //   }
  }
});

// Endpoint to handle the Shopify webhook
// var storeAllOrderDate = [];
app.post("/webhooks/orders/create", (req, res) => {
  console.log("working fine");
  var firstItemTitle, firstItemPrice, firstItemQuantity, firstItemSKU, firstVariantTitle, first_vendor, firstItemPropertyValue;
  try {
    const orderData = req.body;
    const lineItems = orderData.line_items;
    // const lineItems = orderData.line_items;
    var subscription_order_name = orderData.name;
    if (orderData.note_attributes && orderData.note_attributes.length > 0) {
      var reshipped_note_attributes_name = orderData.note_attributes[0].name;
      console.log("Note attributes name:", reshipped_note_attributes_name);
    } else {
      console.log("No note attributes found.");
    }
    var item_data_arr = [];
    lineItems.forEach((item, index) => {
      if (item.properties && item.properties.length > 0) {
        item.properties.forEach((property) => {
          console.log("Property:", property.name, "-", property.value);
          var obj_item = {
            Title: item.title,
            Price: item.price,
            Quantity: item.quantity,
            SKU: item.sku,
            item_variant_title: item.variant_title,
            item_vendor: item.vendor,
            property_value: property.value,
          };
          item_data_arr.push(obj_item);
        });
      }

      console.log("\n");
    });
    if (item_data_arr.length > 0) {
      firstItemTitle = item_data_arr[0].Title; // 'Blue razz'
      firstItemPrice = item_data_arr[0].Price; // '100.00'
      firstItemQuantity = item_data_arr[0].Quantity; // 1
      firstItemSKU = item_data_arr[0].SKU; // '1005'
      firstVariantTitle = item_data_arr[0].item_variant_title;
      first_vendor = item_data_arr[0].item_vendor;
      firstItemPropertyValue = item_data_arr[0].property_value;
      console.log(
        "djsjkhdjkashdjk:",
        firstItemTitle,
        firstItemPrice,
        firstItemQuantity,
        firstItemSKU,
        firstVariantTitle,
        first_vendor,
        firstItemPropertyValue
      );
    } else {
      console.log("one time purchase.......... ");
    }
    // Extracting customer information
    const customer = orderData.customer;
    var Customer_Email = customer.email;
    var Customer_First_Name = customer.first_name;
    var Customer_Last_Name = customer.last_name;
    // Extracting billing address
    const billingAddress = orderData.billing_address;
    var Billing_First_Name = billingAddress.first_name;
    var Billing_Last_Name = billingAddress.last_name;
    var billingAddress_address1 = billingAddress.address1;
    var billingAddress_city = billingAddress.city;
    var billingAddress_province = billingAddress.province;
    var billingAddress_country = billingAddress.country;
    var billingAddress_zip = billingAddress.zip;

    console.log("Billing First Name:", billingAddress.first_name);
    console.log("Billing Last Name:", billingAddress.last_name);
    console.log("Billing Address:", billingAddress.address1);
    console.log("Billing City:", billingAddress.city);
    console.log("Billing Province:", billingAddress.province);
    console.log("Billing Country:", billingAddress.country);
    console.log("Billing Zip:", billingAddress.zip);

    // Extracting shipping address
    const shippingAddress = orderData.shipping_address;
    var shippingAddress_first_name = shippingAddress.first_name;
    var shippingAddress_last_name = shippingAddress.last_name;
    var shippingAddress_address1 = shippingAddress.address1;
    var shippingAddress_city = shippingAddress.city;
    var shippingAddress_province = shippingAddress.province;
    var shippingAddress_country = shippingAddress.country;

    var shippingAddress_zip = shippingAddress.zip;
    console.log("Shipping First Name:", shippingAddress.first_name);
    console.log("Shipping Last Name:", shippingAddress.last_name);
    console.log("Shipping Address:", shippingAddress.address1);
    console.log("Shipping City:", shippingAddress.city);
    console.log("Shipping Province:", shippingAddress.province);
    console.log("Shipping Country:", shippingAddress.country);
    console.log("Shipping Zip:", shippingAddress.zip);

    // Extracting order details

    var orderData_email = orderData.email;
    var orderData_currency = orderData.currency;
    var orderData_financial_status = orderData.financial_status;
    var orderData_order_status_url = orderData.order_status_url;
    var orderData_total_price = orderData.total_price;
    var orderData_total_tax = orderData.total_tax;
    var orderData_total_discounts = orderData.total_discounts;
    var orderData_total_line_items_price = orderData.total_line_items_price;
    console.log("Email:", orderData.email);
    console.log("Currency:", orderData.currency);
    console.log("Financial Status:", orderData.financial_status);
    console.log("Total Price:", orderData.total_price);
    console.log("Total Tax:", orderData.total_tax);
    console.log("Total Discounts:", orderData.total_discounts);
    console.log("Total Line Items Price:", orderData.total_line_items_price);

    // Extracting total shipping price
    const totalShippingPrice = orderData.total_shipping_price_set.shop_money;
    console.log(
      "Total Shipping Price:",
      totalShippingPrice.amount,
      totalShippingPrice.currency_code
    );
    var totalShippingPrice_amount = totalShippingPrice.amount;
    var totalShippingPrice_currency_code = totalShippingPrice.currency_code;
    // Extracting total discounts set
    const totalDiscountsSet = orderData.total_discounts_set.shop_money;
    console.log(
      "Total Discounts Set:",
      totalDiscountsSet.amount,
      totalDiscountsSet.currency_code
    );
    var totalDiscountsSet_amount = totalDiscountsSet.amount;
    var totalDiscountsSet_currency_code = totalDiscountsSet.currency_code;
    // Extracting total line items price set
    const totalLineItemsPriceSet =
      orderData.total_line_items_price_set.shop_money;
    console.log(
      "Total Line Items Price Set:",
      totalLineItemsPriceSet.amount,
      totalLineItemsPriceSet.currency_code
    );

    var totalLineItemsPriceSet_amount = totalLineItemsPriceSet.amount;

    var totalLineItemsPriceSet_currency_code =
      totalLineItemsPriceSet.currency_code;

    // Extracting total price set
    const totalPriceSet = orderData.total_price_set.shop_money;
    var totalPriceSet_amount = totalPriceSet.amount;
    var totalPriceSet_currency_code = totalPriceSet.currency_code;
    console.log(
      "Total Price Set:",
      totalPriceSet.amount,
      totalPriceSet.currency_code
    );
    if (lineItems && Array.isArray(lineItems)) {
      lineItems.forEach((lineItem) => {
        const lineItemProperties = lineItem.properties;
        lineItemProperties.forEach((property) => {
          const propertyName = property.name;
          const propertyValue = property.value;
          const numberOnly = parseInt(propertyValue.match(/\d+/)[0], 10);
          var timestamp = orderData.created_at;
          var OrderId = orderData.id;
          const getOnlyoriginalDate = timestamp.substring(0, 10);
          const numberOfDaysToAdd = numberOnly;
          const originalDate = timestamp;
          const dateObject = new Date(originalDate);
          dateObject.setDate(dateObject.getDate() + numberOfDaysToAdd);
          const updatedDate = dateObject.toISOString().slice(0, 10);

          // Extract hours and minutes from the date
          const hours = String(dateObject.getHours()).padStart(2, "0");
          const minutes = String(dateObject.getMinutes()).padStart(2, "0");

          // Form the formatted time string
          const ampm = hours >= 12 ? "PM" : "AM";
          const hours12 = hours % 12 || 12; // Convert to 12-hour format

          const formattedTime = `${hours12}:${minutes
            .toString()
            .padStart(2, "0")} ${ampm}`;

          const date_with_time = `${getOnlyoriginalDate} ${formattedTime}`;
          const getOrderIDwithCreateOrderDate = {
            createOrder: updatedDate,
            OrderId: OrderId,
          };
          console.log("updatedDateupdatedDateupdatedDate::", date_with_time);
          const createOrderDate = updatedDate;
          const orderId = OrderId;
          if (propertyName === "Subscription interval") {
            if (reshipped_note_attributes_name == "Reshipped order") {
              console.log("this is Reshipped order data");
            } else {
              const insertQuery =
                "INSERT INTO subscriptionorder(subscription_order_name, subscription_customer_name, subscription_customer_email, create_order_date, subscription_order_id, Next_Shipment_Date, subscription_interval_days, subscription_total_price, Status, subscription_product__title, subscription_product_Quantity, subscription_product__price, subscriptionshipping_address_first_name, subscriptionshipping_shippingAddress_last_name, subscriptionshipping_shippingAddress_address1, subscriptionshippingAddress_city, subscriptionshippingAddress_zip, subscriptionshippingAddress_country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
              const status = "Active";
              databaseData.query(
                insertQuery,
                [
                  subscription_order_name,
                  Customer_First_Name,
                  Customer_Email,
                  date_with_time,
                  orderId,
                  updatedDate,
                  propertyValue,
                  orderData_total_price,
                  status,
                  firstItemTitle,
                  firstItemQuantity,
                  firstItemPrice,
                  shippingAddress_first_name,
                  shippingAddress_last_name,
                  shippingAddress_address1,
                  shippingAddress_city,
                  shippingAddress_zip,
                  shippingAddress_country
                ],
                (err, result) => {
                  if (err) {
                    console.error("Error inserting data:", err);
                    return;
                  }
                  console.log("Data inserted successfully!");
                  console.log("Inserted ID:", result.insertId);
                  //  sendSubscriptionEmail.callSealSubscription(Customer_Email,orderId);
                  //  callme();
                }
              );
            }
          }
        });
      });
    } else {
      console.log("lineItems is null or not an array.");
    }
    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.sendStatus(500);
  }
});

function createOrder(orderId) {
  console.log("Order ID =", orderId);
  var request = require("request");
  var options = {
    method: "GET",
    url: `https://genucel105.myshopify.com/admin/api/2022-10/orders/${orderId}.json`,
    headers: {
      "x-shopify-access-token": "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",
    },
  };
  request(options, function (error, response) {
    if (error) {
      console.error("Error retrieving order data:", error);
      res.sendStatus(500);
      return;
    }

    try {
      const responseData = JSON.parse(response.body);
      const lineItems = responseData.order.line_items;
      console.log("line items data:", lineItems);
      var item_data_arr = [];
      lineItems.forEach((item, index) => {
        if (item.properties && item.properties.length > 0) {
          item.properties.forEach((property) => {
            console.log("Property:", property.name, "-", property.value);
            var obj_item = {
              Title: item.title,
              Price: item.price,
              Quantity: item.quantity,
              SKU: item.sku,
              item_variant_title: item.variant_title,
              item_vendor: item.vendor,
              property_value: property.value,
            };
            item_data_arr.push(obj_item);
          });
        }

        console.log("\n");
      });

      const firstItemTitle = item_data_arr[0].Title;
      const firstItemPrice = item_data_arr[0].Price;
      const firstItemQuantity = item_data_arr[0].Quantity;
      const firstItemSKU = item_data_arr[0].SKU;
      const firstVariantTitle = item_data_arr[0].item_variant_title;
      const first_vendor = item_data_arr[0].item_vendor;
      const firstItemPropertyValue = item_data_arr[0].property_value;
      console.log(
        "djsjkhdjkashdjk:",
        firstItemTitle,
        firstItemPrice,
        firstItemQuantity,
        firstItemSKU,
        firstVariantTitle,
        first_vendor,
        firstItemPropertyValue
      );

      // Extracting customer information
      const customer = responseData.order.customer;
      var Customer_Email = customer.email;
      var Customer_First_Name = customer.first_name;
      var Customer_Last_Name = customer.last_name;
      // Extracting billing address
      const billingAddress = responseData.order.billing_address;
      var Billing_First_Name = billingAddress.first_name;
      var Billing_Last_Name = billingAddress.last_name;
      var billingAddress_address1 = billingAddress.address1;
      var billingAddress_city = billingAddress.city;
      var billingAddress_province = billingAddress.province;
      var billingAddress_country = billingAddress.country;
      var billingAddress_zip = billingAddress.zip;

      console.log("Billing First Name:", billingAddress.first_name);
      console.log("Billing Last Name:", billingAddress.last_name);
      console.log("Billing Address:", billingAddress.address1);
      console.log("Billing City:", billingAddress.city);
      console.log("Billing Province:", billingAddress.province);
      console.log("Billing Country:", billingAddress.country);
      console.log("Billing Zip:", billingAddress.zip);

      // Extracting shipping address
      const shippingAddress = responseData.order.shipping_address;
      var shippingAddress_first_name = shippingAddress.first_name;
      var shippingAddress_last_name = shippingAddress.last_name;
      var shippingAddress_address1 = shippingAddress.address1;
      var shippingAddress_city = shippingAddress.city;
      var shippingAddress_province = shippingAddress.province;
      var shippingAddress_country = shippingAddress.country;
      var shippingAddress_zip = shippingAddress.zip;

      console.log("Shipping First Name:", shippingAddress.first_name);
      console.log("Shipping Last Name:", shippingAddress.last_name);
      console.log("Shipping Address:", shippingAddress.address1);
      console.log("Shipping City:", shippingAddress.city);
      console.log("Shipping Province:", shippingAddress.province);
      console.log("Shipping Country:", shippingAddress.country);
      console.log("Shipping Zip:", shippingAddress.zip);

      // Extracting order details
      var orderData_email = responseData.order.email;
      var orderData_currency = responseData.order.currency;
      var orderData_financial_status = responseData.order.financial_status;
      var orderData_total_price = responseData.order.total_price;
      var orderData_total_tax = responseData.order.total_tax;
      var orderData_total_discounts = responseData.order.total_discounts;
      var orderData_total_line_items_price =
        responseData.order.total_line_items_price;

      console.log("Email:", responseData.order.email);
      console.log("Currency:", responseData.order.currency);
      console.log("Financial Status:", responseData.order.financial_status);
      console.log("Total Price:", responseData.order.total_price);
      console.log("Total Tax:", responseData.order.total_tax);
      console.log("Total Discounts:", responseData.order.total_discounts);
      console.log(
        "Total Line Items Price:",
        responseData.order.total_line_items_price
      );

      // Extracting total shipping price
      const totalShippingPrice =
        responseData.order.total_shipping_price_set.shop_money;
      console.log(
        "Total Shipping Price:",
        totalShippingPrice.amount,
        totalShippingPrice.currency_code
      );
      var totalShippingPrice_amount = totalShippingPrice.amount;
      var totalShippingPrice_currency_code = totalShippingPrice.currency_code;

      // Extracting total discounts set
      const totalDiscountsSet =
        responseData.order.total_discounts_set.shop_money;
      console.log(
        "Total Discounts Set:",
        totalDiscountsSet.amount,
        totalDiscountsSet.currency_code
      );
      var totalDiscountsSet_amount = totalDiscountsSet.amount;
      var totalDiscountsSet_currency_code = totalDiscountsSet.currency_code;

      // Extracting total line items price set
      const totalLineItemsPriceSet =
        responseData.order.total_line_items_price_set.shop_money;
      console.log(
        "Total Line Items Price Set:",
        totalLineItemsPriceSet.amount,
        totalLineItemsPriceSet.currency_code
      );
      var totalLineItemsPriceSet_amount = totalLineItemsPriceSet.amount;
      var totalLineItemsPriceSet_currency_code =
        totalLineItemsPriceSet.currency_code;

      // Extracting total price set
      const totalPriceSet = responseData.order.total_price_set.shop_money;
      var totalPriceSet_amount = totalPriceSet.amount;
      var totalPriceSet_currency_code = totalPriceSet.currency_code;
      console.log(
        "Total Price Set:",
        totalPriceSet.amount,
        totalPriceSet.currency_code
      );

      createRecurringOrder(
        firstItemTitle,
        firstItemPrice,
        firstItemQuantity,
        firstItemSKU,
        firstVariantTitle,
        first_vendor,
        firstItemPropertyValue,
        Customer_Email,
        Customer_First_Name,
        Customer_Last_Name,
        Billing_First_Name,
        Billing_Last_Name,
        billingAddress_address1,
        billingAddress_city,
        billingAddress_province,
        billingAddress_country,
        billingAddress_zip,
        shippingAddress_first_name,
        shippingAddress_last_name,
        shippingAddress_address1,
        shippingAddress_city,
        shippingAddress_province,
        shippingAddress_country,
        shippingAddress_zip,
        orderData_email,
        orderData_currency,
        orderData_financial_status,
        orderData_total_price,
        orderData_total_tax,
        orderData_total_discounts,
        orderData_total_line_items_price,
        totalShippingPrice_amount,
        totalShippingPrice_currency_code,
        totalDiscountsSet_amount,
        totalDiscountsSet_currency_code,
        totalLineItemsPriceSet_amount,
        totalLineItemsPriceSet_currency_code,
        totalPriceSet_amount,
        totalPriceSet_currency_code
      );

      // res.sendStatus(200);
      // res.sendStatus(500);
    } catch (error) {
      console.error("Error processing webhook:", error);
      // res.sendStatus(500);
    }
  });
  function createRecurringOrder(
    firstItemTitle,
    firstItemPrice,
    firstItemQuantity,
    firstItemSKU,
    firstVariantTitle,
    first_vendor,
    firstItemPropertyValue,
    Customer_Email,
    Customer_First_Name,
    Customer_Last_Name,
    Billing_First_Name,
    Billing_Last_Name,
    billingAddress_address1,
    billingAddress_city,
    billingAddress_province,
    billingAddress_country,
    billingAddress_zip,
    shippingAddress_first_name,
    shippingAddress_last_name,
    shippingAddress_address1,
    shippingAddress_city,
    shippingAddress_province,
    shippingAddress_country,
    shippingAddress_zip,
    orderData_email,
    orderData_currency,
    orderData_financial_status,
    orderData_total_price,
    orderData_total_tax,
    orderData_total_discounts,
    orderData_total_line_items_price,
    totalShippingPrice_amount,
    totalShippingPrice_currency_code,
    totalDiscountsSet_amount,
    totalDiscountsSet_currency_code,
    totalLineItemsPriceSet_amount,
    totalLineItemsPriceSet_currency_code,
    totalPriceSet_amount,
    totalPriceSet_currency_code
  ) {
    // Your logic to create the order goes here
    const request = require("request-promise");
    var options = {
      method: "POST",
      url: "https://ecc126651bc4692bf22cdbeafaa10f7b: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@genucel105.myshopify.com/admin/api/2023-07/orders.json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: {
          line_items: [
            {
              title: firstItemTitle,
              price: firstItemPrice,
              quantity: firstItemQuantity,
              sku: firstItemSKU,
              variant_title: firstVariantTitle,
              vendor: first_vendor,
              properties: [
                {
                  name: "Subscription interval",
                  value: firstItemPropertyValue,
                },
              ],
            },
          ],
          customer: {
            email: Customer_Email,
            first_name: Customer_First_Name,
            last_name: Customer_Last_Name,
          },
          billing_address: {
            first_name: Billing_First_Name,
            last_name: Billing_Last_Name,
            address1: billingAddress_address1,
            city: billingAddress_city,
            province: billingAddress_province,
            country: billingAddress_country,
            zip: billingAddress_zip,
          },
          shipping_address: {
            first_name: shippingAddress_first_name,
            last_name: shippingAddress_last_name,
            address1: shippingAddress_address1,
            city: shippingAddress_city,
            province: shippingAddress_province,
            country: shippingAddress_country,
            zip: shippingAddress_zip,
          },
          email: orderData_email,
          currency: orderData_currency,
          financial_status: orderData_financial_status,
          total_price: orderData_total_price,
          total_tax: orderData_total_tax,
          total_discounts: orderData_total_discounts,
          total_line_items_price: orderData_total_line_items_price,
          total_shipping_price_set: {
            shop_money: {
              amount: totalShippingPrice_amount,
              currency_code: totalShippingPrice_currency_code,
            },
            presentment_money: {
              amount: totalShippingPrice_amount,
              currency_code: totalShippingPrice_currency_code,
            },
          },
          total_discounts_set: {
            shop_money: {
              amount: totalDiscountsSet_amount,
              currency_code: totalDiscountsSet_currency_code,
            },
            presentment_money: {
              amount: totalDiscountsSet_amount,
              currency_code: totalDiscountsSet_currency_code,
            },
          },
          total_line_items_price_set: {
            shop_money: {
              amount: totalLineItemsPriceSet_amount,
              currency_code: totalLineItemsPriceSet_currency_code,
            },
            presentment_money: {
              amount: totalLineItemsPriceSet_amount,
              currency_code: totalLineItemsPriceSet_currency_code,
            },
          },
          total_price_set: {
            shop_money: {
              amount: totalPriceSet_amount,
              currency_code: totalPriceSet_currency_code,
            },
            presentment_money: {
              amount: totalPriceSet_amount,
              currency_code: totalPriceSet_currency_code,
            },
          },
          note_attributes: [
            {
              name: "Reshipped order",
              value: `Reshipped interval:${firstItemPropertyValue}`,
            },
          ],
        },
      }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      // console.log("data", response.body);
      const responseData = JSON.parse(response.body);
      const lineItems = responseData.order.line_items;
      console.log("line items data:", lineItems);

      if (lineItems && Array.isArray(lineItems)) {
        lineItems.forEach((lineItem) => {
          const lineItemProperties = lineItem.properties;
          lineItemProperties.forEach((property) => {
            const propertyName = property.name;
            const propertyValue = property.value;
            const numberOnly = parseInt(propertyValue.match(/\d+/)[0], 10);
            var timestamp = responseData.order.created_at;
            var reship_OrderId = responseData.order.id;
            const originalDate = timestamp.substring(0, 10);
            const numberOfDaysToAdd = numberOnly;
            // Convert the original date string to a Date object
            const dateObject = new Date(originalDate);
            dateObject.setDate(dateObject.getDate() + numberOfDaysToAdd);
            const updatedDate = dateObject.toISOString().slice(0, 10);
            // const getOrderIDwithCreateOrderDate = {
            //   'createOrder': updatedDate,
            //   'OrderId': OrderId
            // };
            console.log("updatedDateupdatedDateupdatedDate::", updatedDate);
            // storeAllOrderDate.push(getOrderIDwithCreateOrderDate);
            // console.log("storeAllOrderDatestoreAllOrderDate::", storeAllOrderDate);
            const createOrderDate = updatedDate;
            // const orderId = OrderId;
            const updateQuery =
              "UPDATE subscriptionorder SET create_order_date = ?, Next_Shipment_Date = ? WHERE subscription_order_id = ?";

            databaseData.query(
              updateQuery,
              [originalDate, updatedDate, orderId],
              (err, result) => {
                if (err) {
                  console.error("Error updating data:", err);
                  return;
                }

                console.log("Data updated successfully!");
                console.log("Affected rows:", result.affectedRows);
              }
            );
            const insertQuery =
              "INSERT INTO reshipped_order (subscription_order_id, reshipped_order_id, reshipped_create_date) VALUES (?, ?, ?)";
            const subscriptionOrderId = orderId; // Subscription Order ID
            const reshippedOrderIds = reship_OrderId; // Comma-separated list of reshipped_order_ids
            const reshippedCreate_Date = createOrderDate;

            databaseData.query(
              insertQuery,
              [subscriptionOrderId, reshippedOrderIds, reshippedCreate_Date],
              (err, result) => {
                if (err) {
                  console.error("Error inserting data:", err);
                  return;
                }
                console.log("Data inserted successfully!");
                console.log("Inserted ID:", result.insertId);
              }
            );
          });
        });
      } else {
        console.log("lineItems is null or not an array.");
      }
    });

    // console.log('Recurring Order created:', orderData);

  }
}

// const Customer_Email="xyz@gmail.com",subscription_order_name = "7686";
app.get("/subscription/order", (req, res) => {
  const query = 'SELECT * FROM subscriptionorder where Status = "Active"';
  databaseData.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    } else {
      res.json(results); // Send fetched data as JSON response
    }
  });
});

app.post("/subscription/order/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const cancellationDateTime = req.body.cancellationDateTime;
  const status = "Cancelled";
  const updateQuery =
    "UPDATE subscriptionorder SET Status = ?, subscription_cancel_date = ? WHERE subscription_order_id = ?";
  databaseData.query(updateQuery, [status, cancellationDateTime, orderId], (err, result) => {
    if (err) {
      console.error("Error updating data:", err);
      return;
    }
    console.log("Data updated successfully!");
    console.log("Affected rows:", result.affectedRows);
    res.status(200).json({ message: "cancelled" });
  });
});

app.get("/subscription/cancelledorder", (req, res) => {
  const query = 'SELECT * FROM subscriptionorder where Status = "Cancelled"';
  databaseData.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    } else {
      res.json(results); // Send fetched data as JSON response
    }
  });
});
// Define a global variable to temporarily store the store_name
// let tempStoreName = '';

// POST route to add interval days
app.post('/add/addIntervalDays', (req, res) => {
  console.log("working addIntervalDays.........", req.body);

  const add_interval_days = req.body.tag;
  const store_name = req.body.url;
  const newData = {
    store_name: store_name,
  };

  // Read existing JSON file
  let existingData = [];
  try {
    const rawData = fs.readFileSync('storeData.json');
    existingData = JSON.parse(rawData);
  } catch (error) {
    console.log('No existing data found.');
  }

  // Check if the new data is unique based on store_name
  const isUnique = existingData.every(item => item.store_name !== newData.store_name);

  if (isUnique) {
    // Add the new data to the existing array
    existingData.push(newData);

    // Write the updated array back to the JSON file
    fs.writeFile('storeData.json', JSON.stringify(existingData, null, 2), 'utf-8', err => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('Data has been added to storeData.json');
      }
    });
  } else {
    console.log('Data is not unique.');
  }
  // Store the value in the global variable
  const insertQuery =
    "INSERT INTO subscriptionintervaldays (subscription_interval_days, subscription_current_store_name) VALUES (?, ?)";
  databaseData.query(
    insertQuery,
    [add_interval_days, store_name],
    (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        return;
      }
      console.log("Data inserted successfully!");
      console.log("Inserted ID:", result.insertId);
    });
  res.status(200).json({ message: add_interval_days, url: store_name });
});

// GET route to retrieve interval days based on store_name
app.get('/getadd/addIntervalDays', (req, res) => {
  const storeDataName = require('./storeData.json');
  const hostDataName = storeDataName[0].store_name;
  console.log("asdlhasuoidUODUOASHDUOGDYI;GASDYGASYULDGYUASGYSGDYIGDYI;ASGDYIASDOUSGYIS", storeDataName[0].store_name)
  // const selectQuery =
    // "SELECT subscription_interval_days FROM subscriptionintervaldays WHERE subscription_current_store_name = ?";
  //   databaseData.query(selectQuery, [hostDataName], (err, results) => {
  //     if (err) {
  //       console.error("Error fetching data:", err);
  //       res.status(500).json({ error: "Error fetching data" });
  //       return;
  //     }
  //     const intervalDays = results.map(result => result.subscription_interval_days);
  //     res.status(200).json({ subscription_interval_days: intervalDays });
  //   });
  // });
    const selectQuery =
    "SELECT subscription_interval_days FROM subscriptionintervaldays";
  databaseData.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Error fetching data" });
      return;
    }
    const intervalDays = results.map(result => result.subscription_interval_days);
    res.status(200).json({ subscription_interval_days: intervalDays });
  });
});


app.post('/remove/addIntervaldays', (req, res) => {
  const remove_interval_days = req.body.tag;
  const remove_store_name = req.body.url;
  // console.log("working on it this rout................", remove_interval_days, remove_store_name);
  // const selectDeleteQuery = `DELETE FROM subscriptionintervaldays WHERE subscription_interval_days ='${remove_interval_days}' AND subscription_current_store_name = '${remove_store_name}'`;
  // databaseData.query(selectDeleteQuery, (err, results) => {
  //   if (err) {
  //     console.error('Error executing DELETE query:', err);
  //     return;
  //   }
  //   console.log('Deleted rows:', results.affectedRows);
  //   res.status(200).json({ message: remove_interval_days, url: remove_store_name });
  // });
  console.log("working on it this rout................", remove_interval_days, remove_store_name);
  const selectDeleteQuery = `DELETE FROM subscriptionintervaldays WHERE subscription_interval_days ='${remove_interval_days}'`;
  databaseData.query(selectDeleteQuery, (err, results) => {
    if (err) {
      console.error('Error executing DELETE query:', err);
      return;
    }
    console.log('Deleted rows:', results.affectedRows);
    res.status(200).json({ message: remove_interval_days, url: remove_store_name });
  });
})



app.post("/subscriptionPortal/order/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const subscription_order_id = req.body.subscription_order_id;
  const newData = {
    orderIdvalue: subscription_order_id,
  };

  const dataFilePath = path.join(__dirname, 'storeOrderId.json');

  fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error("Error writing file:", err);
      res.status(500).send("Error writing data");
    } else {
      console.log("Data saved successfully");
      res.status(200).send("Data saved successfully");
    }
  });

});


app.get('/subscriptionPortal/order', (req, res) => {
  fs.readFile('storeOrderId.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('Error reading file');
    } else {
      const subscription_order_id = JSON.parse(data).orderIdvalue;
      console.log("subscription order id :- ", subscription_order_id);
      const query = `SELECT * FROM subscriptionorder WHERE subscription_order_id = '${subscription_order_id}'`;

      databaseData.query(query, (error, results) => {
        if (error) {
          console.error('Error fetching data:', error);
          res.status(500).send('Error fetching data');
        } else {
          res.json(results); // Send fetched data as JSON response
        }
      });
    }
  });

})

app.post("/resendSubscriptionEmail/order/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const orderEmail = req.body.subscription_email_id;
  const subscription_order_id = req.body.subscription_order_id;
  console.log("orderId and orderEmail:", orderId, orderEmail);
  // const newData = {
  //   orderIdvalue: subscription_order_id,
  // };

  // const dataFilePath = path.join(__dirname, 'storeOrderId.json');

  // fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), (err) => {
  //   if (err) {
  //     console.error("Error writing file:", err);
  //     res.status(500).send("Error writing data");
  //   } else {
  //     console.log("Data saved successfully");
  //     res.status(200).send("Data saved successfully");
  //   }
  // });
  const nodemailer = require('nodemailer');
  const email = "saddam@priorware.com";
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'webdeveloper@unimedint.com',
      pass: 'usadhsdasaoribpl'
    }
  });

  // Define the email options
  const mailOptions = {
    from: 'webdeveloper@unimedint.com',
    to: orderEmail,
    subject: 'Test Email',
    text: 'This is a test email from Node.js',
    html: `<table style="width:100%;border-spacing:0;border-collapse:collapse">
<tbody><tr>
  <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;padding-bottom:40px;border-width:0">
    <center>
      <table class="m_1614253222095114876container" style="width:560px;text-align:left;border-spacing:0;border-collapse:collapse;margin:0 auto">
        <tbody><tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif">
            
          <h2 style="font-weight:normal;font-size:24px;margin:0 0 10px">Seal Subscription</h2>
          <p style="color:#777;line-height:150%;font-size:16px;margin:0">Follow this link to cancel or update your subscriptiion order at <a href="https://hswholesale.net" style="font-size:16px;text-decoration:none;color:#8b1d40" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://hswholesale.net;source=gmail&amp;ust=1686513959341000&amp;usg=AOvVaw24pG4sQNQnDRZdKzGSCldM">hswholesale.net.</p>
          <table style="width:100%;border-spacing:0;border-collapse:collapse;margin-top:20px">
<tbody><tr>
  <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;line-height:0em">&nbsp;</td>
</tr>
<tr>
  <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif">
    <table class="m_1614253222095114876button m_1614253222095114876main-action-cell" style="border-spacing:0;border-collapse:collapse;float:left;margin-right:15px">
      <tbody><tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;border-radius:4px" align="center" bgcolor="#8b1d40"><a pppp onclick = "uniqueSubscription(event);" href=https://hswholesale.net/pages/portalsubscription?${orderId} class="m_1614253222095114876button__text" style="font-size:16px;text-decoration:none;display:block;color:#fff;padding:20px 25px" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://hswholesale.net/account/reset/6698695721144/a5492a64cd07417ecc5ac430b69fd0aa-1686419748&amp;source=gmail&amp;ust=1686513959341000&amp;usg=AOvVaw05ZLrm7dmCjQCRYyXYvS9-">Seal Subscription ppp</a></td>
      </tr>
    </tbody>
    </table>
  <table class="m_1614253222095114876secondary-action-cell" style="border-spacing:0;border-collapse:collapse;margin-top:19px">
    <tbody><tr>
      <td style="font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Roboto&quot;,&quot;Oxygen&quot;,&quot;Ubuntu&quot;,&quot;Cantarell&quot;,&quot;Fira Sans&quot;,&quot;Droid Sans&quot;,&quot;Helvetica Neue&quot;,sans-serif;border-radius:4px" align="center">or <a href="https://hswholesale.net" style="font-size:16px;text-decoration:none;color:#8b1d40" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://hswholesale.net&amp;source=gmail&amp;ust=1686513959341000&amp;usg=AOvVaw24pG4sQNQnDRZdKzGSCldM">Visit our store</a>
</td>
    </tr>
  </tbody>
  </table>
  </td>
</tr>
</tbody>
</table>
          </td>
        </tr>
      </tbody>
      </table>
    </center>
  </td>
</tr>
</tbody>
<script>function uniqueSubscription(e){
    e.preventDefault();
    console.log("working fine")
}</script>
</table>`
  };
  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log('Error occurred:');
      console.log(error.message);
    } else {
      // res.send({ message: "Successful... check email!" });
      console.log('Email sent successfully!');
      res.send({ message: "Successfull... check email!" });
      console.log('Message ID: ' + info.messageId);
    }
  });
});
function scheduleDailySynOrder() {
  const now = new Date();
  const targetTime = new Date(now);

  console.log("time:-", targetTime);

  targetTime.setHours(13, 57, 0, 0);
  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  const timeDifference = targetTime - now;
  setTimeout(() => {
    const query =
      'SELECT Next_Shipment_Date, subscription_order_id FROM subscriptionorder WHERE Status = "Active"';
    let datesArray;
    databaseData.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return;
      }
      // const datesArray = storeAllOrderDate;
      datesArray = results.map((row) => {
        // Convert row.Next_Shipment_Date to a Date object if it's not already
        const nextShipmentDate = new Date(row.Next_Shipment_Date);

        return {
          createOrder: nextShipmentDate.toISOString().slice(0, 10),
          OrderId: row.subscription_order_id,
        };
      });


      const currentDate = new Date().toISOString().slice(0, 10);
      let consecutiveMatches = 0;

      for (const dateData of datesArray) {
        console.log("time:.dslakjdhsakdhjkashgdhashgdahgdhgsa-", currentDate);
        if (dateData.createOrder === currentDate) {
          consecutiveMatches++;
          console.log("scheduleDailySynOrder working........");
          createOrder(dateData.OrderId); // Call createOrder with the OrderId
        } else {
          console.log("scheduleDailySynOrder not working........");
        }
      }
      if (consecutiveMatches > 0) {
        console.log(`Matched date ${consecutiveMatches} time(s) continuously.`);
      } else {
        console.log(
          "Current date does not match or the matches are not consecutive."
        );
      }
      // Process the formatted results
      console.log("Formatted Results:", datesArray);
    });
    scheduleDailySynOrder();
  }, timeDifference);
}
scheduleDailySynOrder();

databaseData.connect(function (err) {
  if (err) throw err;
  console.log(
    "Connected! my sql  to node js ................................."
  );
});
// var totalVisitors__temp = [];
// app.post('/send/visiter/data', (req, res) => {
//   const totalVisitors = parseInt(req.body.totalVisitors, 10);
//   const totalSessions = parseInt(req.body.totalSessions, 10);
//   const currentUrl = req.body.currentUrl;

//   console.log(totalSessions, totalVisitors, currentUrl)
//   /*================================================ commemnt local code =========================================== */

//   // totalVisitors__temp.push(totalVisitors);
//   // const sum_totalVisitors = totalVisitors__temp.reduce((acc, currentValue) => acc + parseInt(currentValue), 0);
//   // console.log("Sum of the totalVisitors__temp:", sum_totalVisitors);
//   // console.log("sdkjasgdhgasjdhjj", totalVisitors, totalSessions, "totalVisitors__temp=", totalVisitors__temp);
//   // const query = 'SELECT COUNT(*) AS row_count FROM websitesession';

//   // // Execute the query
//   // databaseData.query(query, function (error, results, fields) {
//   //   if (error) throw error;
//   //   // Get the row count from the result
//   //   const rowCount = results[0].row_count;
//   //   if (rowCount === 0) {
//   //     const insertQuery = "INSERT INTO websitesession (id, totalVisitor,totalSession) VALUES (?, ?, ?)";
//   //     databaseData.query(insertQuery, [101, totalVisitors, totalSessions], (err, result) => {
//   //       if (err) {
//   //         console.error("Error inserting data:", err);
//   //         return;
//   //       }
//   //       console.log("Data inserted successfully!");
//   //       console.log("Inserted ID:", result.insertId);
//   //     });
//   //   } else if (totalVisitors && totalSessions) {
//   //     const updateQuery = 'UPDATE websitesession SET totalVisitor = ?, totalSession = totalSession + ? WHERE id = ?';
//   //     //const updateQuery = 'UPDATE websitesession SET totalVisitor = totalVisitor + ? WHERE id = ?';
//   //     // Execute the query
//   //     databaseData.query(updateQuery, [sum_totalVisitors, totalSessions, 101], (err, result) => {
//   //       if (err) throw err;
//   //       console.log("Rows updated totalVisitors and totalSession:", result.affectedRows);
//   //     })
//   //   }

//   //   console.log("Row count:", rowCount);
//   // });


//   /*================================================ commemnt local code =========================================== */
//   // var options = {
//   //   'method': 'POST',
//   //   'url': 'https://api.unimedcrm.com/WebApi/V2/WShopify_Visitor_Log.asmx/AddVisitor',
//   //   'headers': {
//   //     'Content-Type': 'application/json'
//   //   },
//   //   body: JSON.stringify({
//   //     "AddVisitor": {
//   //       "Visitor": totalVisitors,
//   //       "Session": totalSessions,
//   //       "SaleSource": currentUrl
//   //     },
//   //     "requestContainer": {
//   //       "TestMode": "false",
//   //       "AccessToken": "Unimed",
//   //       "Hashkey": "X396xNwnY8"
//   //     }
//   //   })
//   // };
// });
  app.post('/send/portal/data', (req, res) => {
    const receivedData = req.body
     const subscription_order_id = receivedData.subscription_order_id;
     const selecte_value = receivedData.selecte_value;
     const data_seal_quantity = receivedData.data_seal_quantity;
     const data_seal_email = receivedData.data_seal_email;
     const shipping_first_name = receivedData.shipping_first_name;
     const shipping_last_name = receivedData.shipping_last_name;
     const shipping_address1 = receivedData.shipping_address1;
     const shipping_address2 = receivedData.shipping_address2;
     const shipping_zip = receivedData.shipping_zip;
     const shopping_phone = receivedData.shopping_phone;
     const shipping_company = receivedData.shipping_company; 
     const  discount_code = receivedData.discount_code;

  
    console.log('Received data:', subscription_order_id,selecte_value,data_seal_quantity,data_seal_email,shipping_first_name,shipping_last_name,shipping_address1,shipping_address2,shipping_zip,shopping_phone,shipping_company,discount_code);
    // Process the receivedData here as needed
    const updateQuery =
      "UPDATE subscriptionorder SET subscription_interval_days = ?, subscription_customer_email = ?, subscription_product_Quantity = ?, subscriptionshipping_address_first_name = ?, subscriptionshipping_shippingAddress_last_name = ?, subscriptionshipping_shippingAddress_address1 = ?, subscriptionshippingAddress_zip = ? WHERE subscription_order_id = ?";

    databaseData.query(
      updateQuery,
      [selecte_value, data_seal_email, data_seal_quantity, shipping_first_name, shipping_last_name, shipping_address1, shipping_zip, subscription_order_id],
      (err, result) => {
        if (err) {
          console.error("Error updating data:", err);
          return;
        }

        console.log("Data updated successfully!");
        console.log("Affected rows:", result.affectedRows);
      }
    );
    // Send a response back to the client
    res.send('Data received successfully!');
});

  // request(options, function (error, response) {
  //   if (error) throw new Error(error);
  //   console.log(response.body);
  // });

app.listen(7709, () => {
  console.log("running on port 7707");
});
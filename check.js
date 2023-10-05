// fetch('https://sealapp-6ptb.onrender.com/getadd/addIntervalDays')
// .then(response => response.json())
// .then(data => console.log(data.subscription_interval_days))
// .catch(error => console.error('Error fetching data:', error));var subscription_order_name = "#1024";

// Define the number of times you want to increment
// let counter = 0;

// function processValue(value) {
//     if (value === "#1024" && counter === 0) {
//         counter++;
//         return "#1024";
//     } else if (value === "#1024" && counter === 1) {
//         counter++;
//         return "#1025";
//     } else {
//         return value;
//     }
// }

// // Example usage:
// let firstValue = processValue("#1024"); // This will return "#1024"
// let secondValue = processValue("#1024"); // This will return "#1025"

// console.log(firstValue); // Output: "#1024"
// console.log(secondValue); // Output: "#1025"

// function incrementValue(inputValue) {
//     let numberPart = parseInt(inputValue.slice(1));
//     numberPart++;
//     return "#" + numberPart;
// }

// let value1 = "#1024";
// let updatedValue1 = incrementValue(value1);
// console.log(updatedValue1);  // Output: "#1025"

// let value2 = "#1025";
// let updatedValue2 = incrementValue(value2);
// console.log(updatedValue2);  // Output: "#1026"

// let counter = 0;
// var subscription_order_name = "#1024";
// function processValue(value) {
//     if (value === subscription_order_name && counter === 0) {
//         counter++;
//         return subscription_order_name;
//     } else if (value === subscription_order_name && counter === 1) {
//         counter++;
//         return subscription_order_name;
//     } else {
//         return value;
//     }
// }

// // Example usage:
// let firstValue = processValue("#1024"); // This will return "#1024"
// let secondValue = processValue("#1024"); // This will return "#1025"

// console.log(firstValue); // Output: "#1024"
// console.log(secondValue); // Output: "#1025"

// for (let i = 1; i <= 11; i++) {
//     let concatenatedValue = i + 1000;
//     console.log(i + ' to ' + concatenatedValue);
// }

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let fiftyCharToken = '';

for (let i = 0; i < 50; i++) {
  const randomIndex = Math.floor(Math.random() * characters.length);
  fiftyCharToken += characters.charAt(randomIndex);
}

console.log(fiftyCharToken);
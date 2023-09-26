fetch('https://sealapp-6ptb.onrender.com/getadd/addIntervalDays')
.then(response => response.json())
.then(data => console.log(data.subscription_interval_days))
.catch(error => console.error('Error fetching data:', error));
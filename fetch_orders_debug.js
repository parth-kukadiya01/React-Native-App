const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://sv.riolls.com/api/v1/orders', {
            // Need token here.. wait.
        });
        console.log(JSON.stringify(res.data.data.orders[0].items, null, 2));
    } catch(e) {
        console.error(e.message);
    }
}
test();

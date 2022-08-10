const express = require('express');
const app = express();
const fs = require('fs');
const PORT = 4000;

//New imports
const http = require('http').Server(app);
const cors = require('cors');

//Gets the JSON file and parse the file into JavaScript object
const rawData = fs.readFileSync('data.json');
const productData = JSON.parse(rawData);

app.use(cors());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

//Add this before the app.get() block
socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);
    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
    });
    socket.on('addProduct', (data) => {
        productData['products'].push(data);
        const stringData = JSON.stringify(productData, null, 2);
        fs.writeFile('data.json', stringData, (err) => {
            console.error(err);
        });
        //Sends back the data after adding a new product
        socket.broadcast.emit('addProductResponse', data);
    });
    socket.on('bidProduct', (data) => {
        //Function call
        findProduct(
            data.name,
            productData['products'],
            data.last_bidder,
            data.amount
        );
        //Sends back the data after placing a bid
        socket.broadcast.emit('bidProductResponse', data);
    });

});

app.get('/api', (req, res) => {
    res.json(productData);
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

function findProduct(nameKey, productsArray, last_bidder, new_price) {
    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].name === nameKey) {
            productsArray[i].last_bidder = last_bidder;
            productsArray[i].price = new_price;
        }
    }
    const stringData = JSON.stringify(productData, null, 2);
    fs.writeFile('data.json', stringData, (err) => {
        console.error(err);
    });
}

const express = require('express');
const app = express();
const ejs = require('ejs');
const redis = require('redis');

let client;
(async () => {
    client = redis.createClient();
  
    client.on("error", (error) => console.error(`Error : ${error}`));
  
    await client.connect();
})();


async function getAllUsers() {
    console.log("inside the Promise");

    // const value = await client.get('abc');
    // console.log("Value = : " + value);


    try {
        const keys = await client.keys('*', (err, keys) =>{
            if (err) throw err;
        });

        const users = {};
        if (keys.length === 0) {
            console.log('No users found in Redis');
            return users;
        }else
        {
            console.log("Keys : " + keys)
        }

        const userData = await client.mGet(keys, (err, userData)=>{
            if(err) throw err;
        })
        console.log('Users found in Redis:', userData);
        return userData;

    } catch (error) {
        console.error('Error fetching users from Redis:', error);
        throw error;
    }
}

// Define routes
app.get('/users', async (req, res) => {

    try {
        const users = await getAllUsers();
        const currentDate = new Date();
        var expiryTime = 15000;

        const data ={};
        for (const [key, value] of Object.entries(users)) {
            console.log(`Key: ${key}, Value: ${value}`);
            const differenceInseconds = new Date().getTime() - new Date(value).getTime();

            if (differenceInseconds > expiryTime) { // 15 minutes in milliseconds
                data[key] = "Offline"
                console.log('The time diff bw login is :' + differenceInseconds);
            } else {
                data[key] = "Online"
                console.log('The time diff bw login is :' + differenceInseconds);
            }

        }

        // Render the users.ejs template with user data
        ejs.renderFile('Views/index.ejs', { data }, (err, html) => {
            if (err) {
                console.error('Error rendering template:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.send(html);
            }
        });
    } catch (err) {
        console.error('Error retrieving users:', err);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const currentTime = new Date().toISOString();
    try {
        await client.set(userId, currentTime) 
        res.send("success")
    } catch(err) {
        res.send("error")
    }
});

// Start the server and listen on port 3000
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});

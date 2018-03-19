const express = require('express');
const hbs = require('hbs');
const PORT = process.env.PORT || 3000;
var app = express();

//make express's view engine utilize the 'hbs module'
app.set('view engine', 'hbs');

//make is so that I don't have to configure for every html page. Anything within the Public folder is visible
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('home.hbs', {
        pageTitle: 'Home Page',
        currentYear: new Date().getFullYear(),
        welcomeMessage: 'Welcome to the home Page!'
    });
});

app.get('/about', (req, res) => {
    //render any pages within views folder (Express checks views by default)
    res.render('about.hbs', {
        pageTitle: 'About Page',
        currentYear: new Date().getFullYear()
    });
});

app.get('/bad', (req, res) => {
    res.send({
        errorMessage: 'Unable to handle request',
        commonSense: 'Why would you navigate to a page that bad in its name?!'
    });
});

app.listen(PORT, () => {
    console.log('Server is listening on port: 3000');
});
const express = require('express');
const hbs = require('hbs');
const PORT = process.env.PORT || 3000;
var app = express();

var db = require('./db');

//make express's view engine utilize the 'hbs module'
app.set('view engine', 'hbs');



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
    var ref = db.db.ref('/person');
    console.log('created ref object');
    ref.once('value', (snapshot) => {
        console.log('inside snapshot creation');
        res.send({
            errorMessage: 'Unable to handle request',
            commonSense: snapshot.val()
        });
    }, function (error) {
        console.log(error);
    });
    
});

//make is so that I don't have to configure for every html page. Anything within the Public folder is visible
app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
    console.log('Server is listening on port: 3000');
});

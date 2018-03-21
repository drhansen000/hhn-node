const express = require('express');
const hbs = require('hbs');
const PORT = process.env.PORT || 3000;
var app = express();

var db = require('./db');

//make express's view engine utilize the 'hbs module'
app.set('view engine', 'hbs');

/*
* Firebase has no reverse Snapshot function and inserts automatically in order (unless otherwise specified).
* This function gets the data from most recent to oldest
*/
var reverseSnapshot = (list) => {
    var reverseSnapshotList = new Array();
    list.forEach((childSnapshot) => {
        reverseSnapshotList.push(childSnapshot);
    });
    return reverseSnapshotList.reverse();
};

var getCurrentDate = () => {
    var currentDate;
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate() - 1; //it was a day ahead for some reason
    var year = dateObj.getUTCFullYear();
    if (day < 10) {
        day = `0${day}`;
    }
    if (month < 10) {
        month = `0${month}`;
    }
    return (currentDate = year + "-" + month + "-" + day);
}

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('./views/home.hbs', {
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

/*
* These endpoints are to view the information
*/
app.get('/get-past-appointments', (req, res) => {
    var pastAppRef = db.db.ref(`/appointment/${req.query.uid}`).orderByChild('date');
    pastAppRef.once('value', (snapshot) => {
        var filteredPastApp = new Array();
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().date < getCurrentDate()) {
                filteredPastApp.push(childSnapshot);
            }
        });

        filteredPastApp = reverseSnapshot(filteredPastApp);
        res.send(filteredPastApp);
    }).catch((e) => {
        console.log(e);
    });
});

app.get('/get-product-history', (req, res) => {
    var productHistoryRef = db.db.ref(`/purchase_history/${req.query.uid}`);
    productHistoryRef.once('value', (snapshot) => {
        var filteredPurchaseHistory = reverseSnapshot(snapshot);
        res.send(filteredPurchaseHistory);
    }).catch((e) => {
        console.log(e);
    });
});

app.get('/get-future-appointments', (req, res) => {
    var futureAppRef = db.db.ref(`/appointment/${req.query.uid}`).orderByChild('date');
    futureAppRef.once('value', (snapshot) => {
        var filteredFutureApp = new Array();
        
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().date >= getCurrentDate()) {
                filteredFutureApp.push(childSnapshot);
            }
        });
        res.send(filteredFutureApp);
    }).catch((e) => {
        console.log(e);
    });
});

app.get('/manager-get-clients', (req, res) => {
    var clientRef = db.db.ref('/person');
    clientRef.once('value', (snapshot) => {
        res.send(snapshot)
    }).catch((e) => {
        console.log(e);
    });
});

app.get('/manager-get-appointments', (req, res) => {
    var appRef = db.db.ref('/appointment');
    appRef.once('value', (snapshot) => {
        res.send(snapshot)
    }).catch((e) => {
        console.log(e);
    });
});

/*
* These endpoints are to insert information
*/
app.get('/confirm-purchase', (req, res) => {
    var purchaseRef = db.db.ref(`/purchase_history/${req.query.uid}`).push({
        picture: `${req.query.picture}`,
        product: `${req.query.product}`
    });
    res.send({ status: 'ok' });
});

app.get('/create-person', (req, res) => {
    var personRef = db.db.ref(`/person/${req.query.uid}`);
    personRef.set({
        name:  `${req.query.name}`,
        email: `${req.query.email}`,
        phone: `${req.query.phone}`
    });
    res.send({ status: 'ok' });
});

app.get('/create-appointment', (req, res) => {
    var appRef = db.db.ref(`/appointment/${req.query.uid}`).push({
        date:    `${req.query.date}`,
        info:    `${req.query.info}`,
        service: `${req.query.service}`,
        time:    `${req.query.time}`
    });
    res.send({ status: 'ok' });
});

/*
* These endpoints are to update information. As of now, they actually overwrite the whole
* object, but since they're small, the user won't notice any performance decrease.
*/
app.get('/update-appointment', (req, res) => {
    var appRef = db.db.ref(`/appointment/${req.query.uid}/${req.query.tokenId}`);
    appRef.set({
        date:    `${req.query.date}`,
        info:    `${req.query.info}`,
        service: `${req.query.service}`,
        time:    `${req.query.time}`
    });
    res.send({ status: 'ok' });
});

app.get('/manager-update-client', (req, res) => {
    var personRef = db.db.ref(`/person/${req.query.uid}`);
    personRef.set({
        name:  `${req.query.name}`,
        email: `${req.query.email}`,
        phone: `${req.query.phone}`
    });
    res.send({status: 'ok'});
});

/*
* This endpoint is to remove information
*/
app.get('/remove-appointment', (req, res) => {
    db.db.ref(`/appointment/${req.query.uid}/${req.query.tokenId}`).remove();
    res.send({ status: 'ok' });
});

//make is so that I don't have to configure for every html page. Anything within the Public folder is visible
//app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
    console.log('Server is listening on port: 3000');
});

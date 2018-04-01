const express = require('express');
var hbs = require('express-handlebars');
var session = require('express-session');
const firebase = require('firebase');
const bodyParser = require('body-parser');
var app = express();

var db = require('./db');

const PORT = process.env.PORT || 3000;

//make express's view engine utilize the 'hbs module'

app.engine('hbs', hbs({
    extname: 'hbs',
    partialsDir: [
        //  path to your partials
        __dirname + '/views/partials',
    ]
}));
app.set('view engine', 'hbs');
app.use(bodyParser.json());


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

var loggedIn = (res, template) => {
    var user = firebase.auth().currentUser;
    if (user) {
        res.render(template, { loggedIn: true });
    } else {
        res.render(template, { loggedIn: false });
    }
};

app.get(['/', '/services'], (req, res) => {
    loggedIn(res, 'offer.hbs');
});

app.get('/products', (req, res) => {
    loggedIn(res, 'products.hbs');
});

app.get('/create-account', (req, res) => {
    loggedIn(res, 'createAccount.hbs');
});

app.get(['/create-appointment', '/update-appointment'], (req, res) => {
    loggedIn(res, 'createAppointment.hbs');
});

app.get('/login', (req, res) => {
    loggedIn(res, 'login.hbs');
});
app.get('/purchases', (req, res) => {
    loggedIn(res, 'purchases.hbs');
});

app.get('/appointments', (req, res) => {
    loggedIn(res, 'appointments.hbs');
});

app.get('/cart', (req, res) => {
    loggedIn(res, 'cart.hbs');
});

app.get(['/manager', '/manager-appointments'], (req, res) => {
    var user = firebase.auth().currentUser;
    if (user && user.uid === 'h3XW3CguVARR6YfG1xBWSXbaduS2') {
        console.log('Manage Appointments:  Manager logged in');
        res.render('managerAppointments.hbs', { loggedIn: true });
    } else {
        console.log('Manage Appointments: Manager not logged in');
        res.send({ status: 'Not Authorized!' });
    }
});

app.get('/manager-clients', (req, res) => {
    var user = firebase.auth().currentUser;
    if (user && user.uid === 'h3XW3CguVARR6YfG1xBWSXbaduS2') {
        console.log('Manage Clients: Manager logged in');
        res.render('managerClients.hbs', { loggedIn: true });
    } else {
        console.log('Manage Clients: Manager not logged in');
        res.send({ status: 'Not Authorized!' });
    }
});

/*
* These endpoints are to view the information
*/
app.post('/login-query', (req, res) => {
    firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
        .then(() => {
            res.status(200).send({ status: 'ok' });
        })
        .catch((error) => {
            res.send({ status: 'invalid' });
        });
});

app.get('/logout-query', (req, res) => {
    firebase.auth().signOut().then(function () {
        res.render('login.hbs');
    }, function (error) {
        console.log(error.message);
    });
});

app.get('/past-appointments-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        var pastAppRef = db.db.ref(`/appointment/${user.uid}`).orderByChild('date');
        pastAppRef.once('value', (snapshot) => {
            var filteredPastApp = new Array();
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.val().date < getCurrentDate()) {
                    filteredPastApp.push(childSnapshot);
                }
            });

            filteredPastApp = reverseSnapshot(filteredPastApp);
            res.status(200).send(filteredPastApp);
        }).catch((e) => {
            console.log(e);
        });
    }
});

app.get('/product-history-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        var productHistoryRef = db.db.ref(`/purchase_history/${user.uid}`);
        productHistoryRef.once('value', (snapshot) => {
            var filteredPurchaseHistory = reverseSnapshot(snapshot);
            res.status(200).send(filteredPurchaseHistory);
        }).catch((e) => {
            console.log(e);
        });
    }
});

app.get('/future-appointments-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        var futureAppRef = db.db.ref(`/appointment/${user.uid}`).orderByChild('date');
        futureAppRef.once('value', (snapshot) => {
            var filteredFutureApp = new Array();

            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.val().date >= getCurrentDate()) {
                    filteredFutureApp.push(childSnapshot);
                }
            });
            res.status(200).json(filteredFutureApp);
        }).catch((e) => {
            console.log(e);
        });
    }
});

app.get('/services-query', (req, res) => {
    console.log(req.query.serviceId);
    var serviceRef = db.db.ref(`/service/${req.query.serviceId}`);
    serviceRef.once('value', (snapshot) => {
        res.status(200).send(snapshot);
    }).catch((e) => {
        console.log(e);
        });
});

app.get('/manager-clients-query', (req, res) => {
    var user = firebase.auth().currentUser;
    if (user.uid === 'h3XW3CguVARR6YfG1xBWSXbaduS2') {
        console.log('Client Query: Manager logged in');
        var clientRef = db.db.ref('/person');
        clientRef.once('value', (snapshot) => {
            res.status(200).send(snapshot)
        }).catch((e) => {
            console.log(e);
            });
    } else {
        console.log('Client Query: Manager not logged in');
        res.status(401).send({ status: 'Not Authorized!' });
    }
});

app.get('/manager-appointments-query', (req, res) => {
    var user = firebase.auth().currentUser;
    if (user.uid === 'h3XW3CguVARR6YfG1xBWSXbaduS2') {
        console.log('Appointment Query: Manager logged in');
        var appRef = db.db.ref('/appointment');
        appRef.once('value', (snapshot) => {
            res.status(200).send(snapshot)
        }).catch((e) => {
            console.log(e);
        });
    } else {
        console.log('Appointment Query: Manager not logged in');
        res.status(401).send({ status: 'Not Authorized!' });
    }
});

/*
* These endpoints are to insert information
*/


app.get('/confirm-purchase-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        var purchaseRef = db.db.ref(`/purchase_history/${user.uid}`).push({
            product: `${req.query.name}`,
            price: `${req.query.price}`,
            picture: `${req.query.picture}`
        });
        res.status(200).send({ status: 'ok' });
    } else {
        res.status(200).send({ status: 'invalid' });
    }
});

app.post('/create-user-query', (req, res) => {
    var email    = req.body.email;
    var password = req.body.password;
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userRecord) => {
            res.status(200).send({ status: 'ok' });
        })
        .catch((error) => {
            res.send({ error: `${error.message}` });
        });
});

app.post('/create-person-query', (req, res) => {
    var user = firebase.auth().currentUser;
    console.log(`We're creating a person`);
    if (user) {
        var personRef = db.db.ref(`/person/${user.uid}`).set({
            name: `${req.body.name}`,
            phone: `${req.body.phone}`,
            email: `${req.body.email}`
        });
        res.status(200).send({ status: 'ok' });
    } else {
        res.status(200).send({ status: 'invalid' });
    }
});

app.post('/create-appointment-query', (req, res) => {
    var user = firebase.auth().currentUser;
    if (user) {
        console.log(req.body);
        var appRef = db.db.ref(`/appointment/${user.uid}`).push({
            date: `${req.body.date}`,
            info: `${req.body.info}`,
            service: `${req.body.service} for ${req.body.duration} min at $${req.body.cost}`,
            serviceName: `${req.body.service}`,
            time: `${req.body.time}`
        });
        res.status(200).send({ status: 'ok' });
    }
});

/*
* These endpoints are to update information. As of now, they actually overwrite the whole
* object, but since they're small, the user won't notice any performance decrease.
*/
app.get('/update-appointment-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        var appRef = db.db.ref(`/appointment/${user.uid}/${req.query.tokenId}`);
        appRef.set({
            date: `${req.query.date}`,
            info: `${req.query.info}`,
            service: `${req.query.service}`,
            time: `${req.query.time}`
        });
        res.status(200).send({ status: 'ok' });
    }
});

app.post('/manager-update-client-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user.ui === 'h3XW3CguVARR6YfG1xBWSXbaduS2') {
        var personRef = db.db.ref(`/person/${user.uid}`);
        personRef.set({
            name: `${req.query.name}`,
            email: `${req.query.email}`,
            phone: `${req.query.phone}`
        });
        res.status(200).send({ status: 'ok' });
    } else {
        res.status(401).send({ status: 'unauthorized' });
    }
});

/*
* This endpoint is to remove information
*/
app.get('/remove-appointment-query', (req, res) => {
    var user = firebase.auth().currentUser;

    if (user) {
        let ref = firebase.database().ref(`/appointment/${user.uid}`);
        ref.orderByChild('date').equalTo(req.query.serviceDate).once('value', snapshot => {
            let updates = {};
            snapshot.forEach(child => updates[child.key] = null);
            ref.update(updates);
        });
        res.render('appointments.hbs', { loggedIn: true });
    }
});

//make is so that I don't have to configure for every html page. Anything within the Public folder is visible
app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});
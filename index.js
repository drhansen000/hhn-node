const express = require('express');
var hbs = require('express-handlebars');
var session = require('express-session');
const firebase = require('firebase');
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

app.get(['/', '/offer'], (req, res) => {
    res.render('offer.hbs');
});

app.get('/products', (req, res) => {
    res.render('products.hbs');
});

app.get('/create-account', (req, res) => {
    res.render('createAccount.hbs');
});

app.get('/create-appointment', (req, res) => {
    res.render('createAppointment.hbs');
});

app.get('/login', (req, res) => {
    res.render('login.hbs');
});
app.get('/purchases', (req, res) => {
    res.render('purchases.hbs');
});

app.get('/appointments', (req, res) => {
    res.render('appointments.hbs');
});

app.get('/cart', (req, res) => {
    res.render('cart.hbs');
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
app.get('/past-appointments-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
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
                res.send(filteredPastApp);
            }).catch((e) => {
                console.log(e);
            });
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/product-history-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var productHistoryRef = db.db.ref(`/purchase_history/${user.uid}`);
            productHistoryRef.once('value', (snapshot) => {
                var filteredPurchaseHistory = reverseSnapshot(snapshot);
                res.send(filteredPurchaseHistory);
            }).catch((e) => {
                console.log(e);
            });
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/future-appointments-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var futureAppRef = db.db.ref(`/appointment/${user.uid}`).orderByChild('date');
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
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/manager-clients-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var clientRef = db.db.ref('/person');
            clientRef.once('value', (snapshot) => {
                res.send(snapshot)
            }).catch((e) => {
                console.log(e);
            });
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/manager-appointments-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var appRef = db.db.ref('/appointment');
            appRef.once('value', (snapshot) => {
                res.send(snapshot)
            }).catch((e) => {
                console.log(e);
            });
        } else {
            console.log('Not signed in!');
        }
    });
});

/*
* These endpoints are to insert information
*/
app.get('/login-query', (req, res) => {
    firebase.auth().signInWithEmailAndPassword(req.query.email, req.query.password)
        .then((result) => {
            res.send({ status: 'ok' });
        }).catch((error) => {
            res.send(error);
        });
});

app.get('/confirm-purchase-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var purchaseRef = db.db.ref(`/purchase_history/${user.uid}`).push({
                picture: `${req.query.picture}`,
                product: `${req.query.product}`
            });
            res.send({ status: 'ok' });
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/create-user-query', (req, res) => {
    var email = "trial04@example.com";
    var password = "password";
    var name = "John Doe";
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userRecord) => {
            console.log("Successfully created new user:", userRecord.displayName);

            res.send({ status : 'ok' });
        })
        .catch((error) => {
            console.log(error.message);
            res.send(error.message);
        });
});

app.get('/create-person-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var personRef = db.db.ref(`/person/${user.uid}`).set({
                name: `Steve`,
                phone: `1234`,
                email: `${user.email}`
            });
            res.send({ status: 'ok' });
        } else {
            // No user is signed in.
        }
    });
});

app.get('/create-appointment-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var appRef = db.db.ref(`/appointment/${user.uid}`).push({
                date: `${req.query.date}`,
                info: `${req.query.info}`,
                service: `${req.query.service}`,
                time: `${req.query.time}`
            });
            res.send({ status: 'ok' });
        } else {
            console.log('Not signed in!');
        }
    });
});

/*
* These endpoints are to update information. As of now, they actually overwrite the whole
* object, but since they're small, the user won't notice any performance decrease.
*/
app.get('/update-appointment-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var appRef = db.db.ref(`/appointment/${user.uid}/${req.query.tokenId}`);
            appRef.set({
                date: `${req.query.date}`,
                info: `${req.query.info}`,
                service: `${req.query.service}`,
                time: `${req.query.time}`
            });
            res.send({ status: 'ok' });
        } else {
            console.log('Not signed in!');
        }
    });
});

app.get('/manager-update-client-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var personRef = db.db.ref(`/person/${user.uid}`);
            personRef.set({
                name: `${req.query.name}`,
                email: `${req.query.email}`,
                phone: `${req.query.phone}`
            });
            res.send({ status: 'ok' });
        } else {
            console.log('Not signed in!');
        }
    });
});

/*
* This endpoint is to remove information
*/
app.get('/remove-appointment-query', (req, res) => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            db.db.ref(`/appointment/${req.query.uid}/${user.uid}`).remove();
            res.send({ status: 'ok' });
        } else {
            console.log('Not signed in!');
        }
    });
});

//make is so that I don't have to configure for every html page. Anything within the Public folder is visible
app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
    console.log('Server is listening on port: 3000');
});
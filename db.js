const admin = require('firebase-admin');

const serviceAccount = {
    type: process.env.fbType,
    project_id: process.env.fbProject_id,
    private_key_id: process.env.fbPrivate_key_id,
    private_key: JSON.parse(`"${process.env.fbPrivate_key}"`),
    client_email: process.env.fbClient_email,
    client_id: process.env.fbClient_id,
    auth_uri: process.env.fbAuth_uri,
    token_uri: process.env.fbToken_uri,
    auth_provider_x509_cert_url: process.env.fbAuth_provider_x509_cert_url,
    client_x509_cert_url: process.env.fbClient_x509_cert_url
};

var app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://hhnmobile-d003e.firebaseio.com'
});

var db = app.database();


module.exports = {
    db
};
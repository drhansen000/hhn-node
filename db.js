const firebase = require('firebase');

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBtNgj7iL2UVFE_zrPOzZV_TGvqblB7T4I",
    authDomain: "hhnmobile-d003e.firebaseapp.com",
    databaseURL: "https://hhnmobile-d003e.firebaseio.com",
    projectId: "hhnmobile-d003e",
    storageBucket: "hhnmobile-d003e.appspot.com",
    messagingSenderId: "420430877929"
  };
var app = firebase.initializeApp(config);

var db = app.database();


module.exports = {
    db
};
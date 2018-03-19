//get refs to HTML elements
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const btnEmailLogin = document.getElementById('btnEmailLogin');
const btnCreateAccount = document.getElementById('btnCreateAccount');
const btnLogout = document.getElementById('btnLogout');

//get an instance of provider object (Google Auth)
var provider = new firebase.auth.GoogleAuthProvider();

//will store logged in user information
var user;

//display the data from the db after successful login
//query movie data, only once, not in realtime since the db will seldom change and we don't need to see its updates in realtime

function appInit() {
    //get reference from movie data in db, ordered by episode_id
    var moviesRef = firebase.database().ref('movie').orderByChild('episode_id');
    console.log(moviesRef);
    //only want to get data once (pass in 'value')
    moviesRef.once('value', function (snapshot) {
        var movieData = '';
        //iterate through collection of movie nodes (collection is snapshot, each movie is a childSnapShot)
        snapshot.forEach(function (childSnapshot) {
            movieData += '<b>' + childSnapshot.val().title + '</b><br>';
            movieData += '<b>Episode: </b>' + childSnapshot.val().episode_id;
            movieData += '<p>' + childSnapshot.val().opening_crawl + '</p>';
            movieData += '<div>&nbsp;</div>';
        });
        document.getElementById('displayMovies').innerHTML = movieData;
    });

    //get reference from character data in db
    var charactersRef = firebase.database().ref('person');
    //only want to get data once (pass in 'value')
    charactersRef.once('value', function (snapshot) {
        var characterData = '';
        //iterate through collection of character nodes (collection is snapshot, each character is a childSnapShot)
        snapshot.forEach(function (childSnapshot) {
            characterData += '<b>' + childSnapshot.val().name + '</b><br>';
            characterData += '<div>&nbsp;</div>';
        });
        document.getElementById('displayCharacters').innerHTML = characterData;
    });
}

//add Google login event
btnGoogleLogin.addEventListener('click', e => {
    //this utilizes the Google Auth provider, which then returns a promise
    firebase.auth().signInWithPopup(provider).then(function (result) {
        user = result.user;
        //create and display welcome message
        const welcomeMsg = "Welcome " + user.displayName;
        document.getElementById('message').innerHTML = welcomeMsg;
        //display app data
        appInit();
        //log our user info to console
        console.log('Our logged in user: ' + JSON.stringify(user));
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Google Login Error: ' + errorCode + ' -- ' + errorMessage);
    });
});

//add create account event
btnCreateAccount.addEventListener('click', e => {
    var email = txtEmail.value;
    var password = txtPassword.value;
    //utilize Firebase's account creation
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (result) {
        //create a message after signup completion
        const signupMsg = "Account successfully created! " + result.email + " you can now login.";
        document.getElementById('message').innerHTML = signupMsg;
    });
});

//add email login event
btnEmailLogin.addEventListener('click', e => {
    var email = txtEmail.value;
    var password = txtPassword.value;
    firebase.auth().signInWithEmailAndPassword(email, password).then(function (result) {
        //user is assigned to result, instead of result.user like with Google login (slight difference)
        user = result;
        //display welcome message
        const emailLoginMsg = "Welcome " + user.email;
        document.getElementById('message').innerHTML = emailLoginMsg;
        //clear input fields
        document.getElementById('txtEmail').value = '';
        document.getElementById('txtPassword').value = '';
        //display app data
        appInit();
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Email Login Error: ' + errorCode + ' -- ' + errorMessage);
    });
});

//sign user out
btnLogout.addEventListener('click', e => {
    //need to create goodbye message before utilizing firebase.auth()
    //we use the email, because both the Google and email logins have that attribute
    const byeMsg = 'Goodbye ' + user.email;
    document.getElementById('message').innerHTML = byeMsg;
    firebase.auth().signOut().then(function () {
        user = null;
        console.log('Logout successful');
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Error: ' + errorCode + ' -- ' + errorMessage);
    });
});
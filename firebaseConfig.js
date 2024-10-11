const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
    apiKey: "AIzaSyAdFFYGSxSiNjqcFedeZuQa9X65VrZaCE4",
    authDomain: "letter-bbe65.firebaseapp.com",
    databaseURL: "https://letter-bbe65-default-rtdb.firebaseio.com",
    projectId: "letter-bbe65",
    storageBucket: "letter-bbe65.appspot.com",
    messagingSenderId: "432907081192",
    appId: "1:432907081192:web:f0170cb1b0ecc6caeb405d"
  };

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

module.exports = { database };
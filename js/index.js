const firebaseConfig = {
  apiKey: "AIzaSyBtV4ajO6P0PH3aje1J0UedJj8zSYgqy9w",
  authDomain: "focustime-a18ff.firebaseapp.com",
  projectId: "focustime-a18ff",
  storageBucket: "focustime-a18ff.appspot.com",
  messagingSenderId: "1081184659635",
  appId: "1:1081184659635:web:c62431e60888334575e8c6",
  measurementId: "G-N8T6NFR8GN",
};
//setup firebase v8 constants
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

auth.onAuthStateChanged((userInfo) => {
  if (userInfo) {
    window.location.href = "./app/";
  }
});

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
const db = firebase.firestore();
const auth = firebase.auth();

//setup listener for auth state changes, and if not on signup page, redirect to login page
auth.onAuthStateChanged((userInfo) => {
  user = userInfo;
  if (userInfo) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    // ...
    if (!window.location.pathname.includes("/app/") && !window.location.pathname.includes("/signup.html") && !window.location.pathname.includes("/login.html")) {
      window.location.href = "/FocusTime/app/";
    } else {
      // load tasks initially
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((d) => {
          console.log("setting up from db");
          casheUserDoc(d);
          makeTasksFromDoc(d);
          setupFieldsFromDoc(d);
        });
      // update tasks on change
      db.collection("users")
        .doc(user.uid)
        .onSnapshot((d) => {
          casheUserDoc(d);
          makeTasksFromDoc(d);
          setupFieldsFromDoc(d);
        });
    }
  } else {
    // User is signed out
    // ...
    if (!window.location.pathname.includes("/signup.html") && !window.location.pathname.includes("/login.html")) {
      // tell user they are not signed in, and that this page requires that they are, toast
      new Toast("Sorry, you need to be signed in to access this page!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/info-locked-icon.svg", "./signup.html");
    }
  }
});

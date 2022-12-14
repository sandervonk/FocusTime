const firebaseConfig = {
    apiKey: "AIzaSyBtV4ajO6P0PH3aje1J0UedJj8zSYgqy9w",
    authDomain: "focustime-a18ff.firebaseapp.com",
    projectId: "focustime-a18ff",
    storageBucket: "focustime-a18ff.appspot.com",
    messagingSenderId: "1081184659635",
    appId: "1:1081184659635:web:c62431e60888334575e8c6",
    measurementId: "G-N8T6NFR8GN",
  },
  baseclasses = {
    apush: "AP US History",
    calc: "AP Calc BC",
    french: "AP French Language",
    mads: "Madrigals",
    physics: "AP Physics 1",
    hamlit: "Honors American Literature",
    other: "Other",
  };
var getClassJSON = function () {
  let classDictionary = baseclasses;
  try {
    // load other keys from document
    for (let key in userDocCache.classes) {
      classDictionary[key] = userDocCache.classes[key];
    }
  } catch {
    classDictionary = baseclasses;
  }
  return classDictionary;
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
      db.collection("users").doc(user.uid).get().then(allFromDoc);
      // update tasks on change
      db.collection("users").doc(user.uid).onSnapshot(allFromDoc);
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
function allFromDoc(d) {
  casheUserDoc(d);
  try {
    makeTasksFromDoc(d);
    setupFieldsFromDoc(d);
  } catch (err) {
    console.warn("could not setup app pages from doc", err);
  }
}
//auth commons
function casheUserDoc(doc) {
  localStorage["user-data"] = JSON.stringify(doc.data());
  userDocCache = doc.data();
}
function setupFieldsFromDoc(doc) {
  if (doc.exists) {
    $("[data-auth-role='name']").text(doc.data().name.split(" ")[0]);
    userDocCache = doc.data();
    try {
      let total = 0,
        completed = 0,
        tasks = doc.data().tasks ? doc.data().tasks : [];
      for (task of doc.data().tasks) {
        total++;
        if (task.is_completed) {
          completed++;
        }
      }
      let percentage_completed = parseInt((completed * 100) / total);
      percentage_completed = isNaN(percentage_completed) ? 0 : percentage_completed;
      $('[data-role="progress-percentage"]').text(percentage_completed);
      $('[data-role="progress-bar"]').css("width", `${percentage_completed}%`);
      $('[data-role="progress-completed"]').text(completed);
      $('[data-role="progress-total"]').text(total);
    } catch (err) {
      console.error(err);
    }
  } else {
    new ErrorToast("Error", "Userdoc does not exist", 3000);
  }
}

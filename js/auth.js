"use strict";
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
    other: "Other",
  };
let local = window.localStorage["user-data"];
try {
  local = JSON.parse(local);
} catch (err) {
  console.log("error parsing local storage", err);
  local = {};
}
const do_old_complete = local && local.settings && local.settings.do_hide_complete;

var getClassJSON = function () {
  let classDictionary = baseclasses;
  try {
    // load other keys from document
    for (let key of userDocCache.classes) {
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
function doClassSelect() {
  let class_list = getClassJSON(),
    dropdown = $('[data-role="task-info-tag"]').html("<option disabled selected hidden value=''>Choose a Class</option>");
  delete class_list.other;
  class_list.other = "Other";
  for (let class_item of Object.keys(class_list)) {
    dropdown.append(`<option value="${class_item}">${class_list[class_item]}</option>`);
  }
}
function setupFieldsFromDoc(doc) {
  if (doc.exists) {
    $("[data-auth-role='name']").text(doc.data().name.split(" ")[0]);
    userDocCache = doc.data();
    try {
      let total = 0,
        completed = 0;
      for (let task of doc.data().tasks ? doc.data().tasks : []) {
        if ((task.date && !parseInt(task.date)) || (task.date && new Date(task.date).getTime() <= new Date(new Date().toLocaleDateString("en-ca")).getTime() + day_ms)) {
          total++;
          if (task.is_completed) {
            completed++;
          }
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
  doClassSelect();
}

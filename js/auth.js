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
      window.location.href = "/lahacks-six/app/";
    } else {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
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

              $('[data-role="progress-percentage"]').text(`${parseInt((completed * 100) / total)}`);
              $('[data-role="progress-bar"]').css("width", `${parseInt((completed * 100) / total)}%`);
              $('[data-role="progress-completed"]').text(completed);
              $('[data-role="progress-total"]').text(total);
            } catch (err) {
              console.error(err);
            }
          } else {
            new ErrorToast("Error", "Userdoc does not exist", 3000);
          }
        })
        .catch((error) => {
          new ErrorToast("Error", cleanError(error), 3000);
        });
    }
  } else {
    // User is signed out
    // ...
    if (!window.location.pathname.includes("/signup.html") && !window.location.pathname.includes("/login.html")) {
      // tell user they are not signed in, and that this page requires that they are, toast
      new Toast("Sorry, you need to be signed in to access this page!", "default", 3000, "//sander.vonk.one/lahacks-six/img/icon/toast/info-locked-icon.svg", "./signup.html");
    }
  }
});
$("[data-auth-role='logoutprompt']").click(function () {
  new Popup("Are you sure you want to sign out?", "default", 10000, "//sander.vonk.one/lahacks-six/img/icon/toast/info-icon.svg", [
    ["removePopup()", "Cancel", "secondary-action fullborder"],
    ["removePopup()", "Yes", "primary-action data-auth-logout"],
  ]);
});
$(document.body).on("click", "[data-auth-role='logout'], .data-auth-logout", function () {
  auth.signOut();
});

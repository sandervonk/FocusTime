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
      new Toast("Sorry, you need to be signed in to access this page!", "default", 1000, "//sander.vonk.one/lahacks-six/img/icon/toast/info-locked-icon.svg", "./signup.html");
    }
  }
});
try {
  console.log("setting up from cache");
  //makeTasksFromDoc(docFromCashe());
  setupFieldsFromDoc(docFromCashe());
} catch (err) {
  console.warn("Could not setup from cashe", err);
}
$("[data-auth-role='logoutprompt']").click(function () {
  new Popup("Are you sure you want to sign out?", "default", 10000, "//sander.vonk.one/lahacks-six/img/icon/toast/info-icon.svg", [
    ["removePopup()", "Cancel", "secondary-action fullborder"],
    ["removePopup()", "Yes", "primary-action data-auth-logout"],
  ]);
});
$(document.body).on("click", "[data-auth-role='logout'], .data-auth-logout", function () {
  localStorage.clear();
  auth.signOut();
});
function docFromCashe() {
  return {
    exists: true,
    data: function () {
      return JSON.parse(localStorage["user-data"]);
    },
  };
}
function casheUserDoc(doc) {
  localStorage["user-data"] = JSON.stringify(doc.data());
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
}
var classJSON = {
  apush: "AP US History",
  calc: "AP Calc BC",
  french: "AP French Language",
  mads: "Madrigals",
  physics: "AP Physics 1",
  hamlit: "Honors American Literature",
};
function makeTasksFromDoc(doc) {
  if (doc.exists) {
    let tasks = doc.data().tasks,
      newHTML = $(`<div data-role="tasks-list"></div>`);
    if (tasks) {
      tasks.forEach((task) => {
        $(newHTML).append(`
      <div class="task-card" data-task-json-content='${JSON.stringify(task)}'>
        <div class="task-card-content">
          <div class="task-card-widgets">
            <div class="task-card-time-widget">
              <object class="task-card-widget-icon" data="../img/icon/tasks/clock-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/clock-icon.png" /></object>
              <span class="task-card-time">${task.time} minutes</span>
            </div>
            <div class="task-card-date-widget">
              <object class="task-card-widget-icon" data="../img/icon/tasks/date-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/date-icon.png" /></object>
              <span class="task-card-time">#/##/####</span>
            </div>
          </div>
          <hr />
          <div class="task-card-info">
            <div class="task-card-title">${task.title}</div>
            <div class="task-card-tag">${Object.keys(classJSON).includes(task.tag) ? classJSON[task.tag] : task.tag}</div>
          </div>
          <div data-role="edit-card" class="task-card-action">
            <object class="task-card-action-icon edit-icon" data="../img/icon/tasks/edit-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/edit-icon.png" /></object>
            <object class="task-card-action-icon editing-icon" data="../img/icon/tasks/editing-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/editing-icon.png" /></object>
          </div>
        </div>
        <div class="task-card-swipe">
          <div class="task-card-swipe-done">
            <object class="task-card-swipe-icon" data="../img/icon/tasks/done-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/done-icon.png" /></object>
          </div>
          <div class="task-card-swipe-archive">
            <object class="task-card-swipe-icon" data="../img/icon/tasks/archive-icon.svg" type="image/svg+xml"><img src="../img/icon/tasks/archive-icon.png" /></object>
          </div>
      </div>
      `);
      });
    }
    //check that the current element does not match the new one, if it does, do not replace
    if (!$(newHTML).is($("[data-role='tasks-list']"))) {
      $("[data-role='tasks-list']").replaceWith(newHTML);
      $(".task-card-content").onSwipe(function (data) {
        if (data.right) {
          $(this).closest(".task-card").removeClass("editing");
        } else if (data.left) {
          $(this).closest(".task-card").addClass("editing");
        }
      });
    } else {
      console.log("task content matched, not replacing");
    }
  }
}

let buttonClicked = false;
// listen for auth state change
auth.onAuthStateChanged((userInfo) => {
  if (user && !buttonClicked) {
    // User is signed in, redirect to app with toast
    new Toast(
      "You are already signed in!",
      "default",
      1000,
      "./img/icon/toast/info-unlocked-icon.svg",
      "./app/"
    );
  }
});
$("#raised-close").click(() => {
  if (window && window.history && false) {
    window.history.back();
  } else if (window) {
    window.location.href = "./";
  } else {
    new ErrorToast("Error", "Unable to go back", 3000);
  }
});
// listen for enter key and simulate signup click
$(document).keypress(function (e) {
  if (e.which == 13) {
    $("#signup").click();
  }
});
$(".input-pair input").on("change input click", function () {
  //change button's disabled property depending on if all fields are completed
  if (
    $("#name-input").val() != "" &&
    $("#email-input").val() != "" &&
    $("#password-input").val() != "" &&
    $("#age-input").prop("checked") &&
    $("#terms-input").prop("checked")
  ) {
    $("#signup").removeClass("disabled");
  } else {
    $("#signup").addClass("disabled");
  }
});
$("#signup").click(() => {
  buttonClicked = true;
  //login with firebase using email and password
  const email = $("[data-auth-role='email-input']").val(),
    password = $("[data-auth-role='password-input']").val(),
    name = $("[data-auth-role='name']").val();
  if (!email.length) {
    new WarningToast("Please enter a email.", 3000);
  } else if (!password.length) {
    new WarningToast("Please enter a password.", 3000);
  } else if (!name.length) {
    new WarningToast("Please enter a name.", 3000);
  } else if (!$("[data-auth-role='age-check']").prop("checked")) {
    new WarningToast("You must be at least 13 years of age to continue", 3000);
  } else if (!$("[data-auth-role='agree-to-terms']").prop("checked")) {
    new WarningToast("You must agree to the terms of service to continue", 3000);
  }
  // Sign in with email and pass.
  else {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        user = userCredential.user;
        // ...
        //save data to userdoc
        db.collection("users")
          .doc(user.uid)
          .set(
            {
              name: name,
              email: email,
              uid: user.uid,
              created: firebase.firestore.Timestamp.now(),
              classes: {
                hist: "Social Studies",
                math: "Math",
                ele1: "Elective 1",
                ele2: "Elective 2",
                sci: "Science",
                engl: "English",
              },
            },
            { merge: true }
          )
          .then(() => {
            new Toast(
              "Account created!",
              "default",
              1000,
              "./img/icon/toast/info-unlocked-icon.svg",
              "./app/"
            );
            window.location.href = "/FocusTime/app/";
          })
          .catch((error) => {
            new ErrorToast("Error", cleanError(error), 2000);
          });
      })
      .catch((error) => {
        if (error.code == "auth/email-already-in-use") {
          //attempt to login instead
          auth
            .signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
              // Signed in
              user = userCredential.user;
              //check if userdoc exists, and if it does not, create it
              db.collection("users")
                .doc(user.uid)
                .get()
                .then((doc) => {
                  if (!doc.exists) {
                    db.collection("users")
                      .doc(user.uid)
                      .set(
                        {
                          name: name,
                          email: email,
                          uid: user.uid,
                          created: firebase.firestore.Timestamp.now(),
                        },
                        { merge: true }
                      )
                      .then(() => {
                        new Toast(
                          "Signed in and created missing userdoc",
                          "default",
                          3000,
                          "./img/icon/toast/success-icon.svg",
                          "./app/"
                        );
                      })
                      .catch((error) => {
                        new ErrorToast("Error creating missing userdoc", cleanError(error), 2000);
                      });
                  } else {
                    new Toast(
                      "Account already exists and password matched, signed in",
                      "default",
                      3000,
                      "./img/icon/toast/success-icon.svg",
                      "./app/"
                    );
                  }
                });
            })
            .catch((error) => {
              new ErrorToast(
                "Account already exists but could not log in:",
                cleanError(error),
                2000
              );
            });
        } else {
          new ErrorToast("Error creating account", cleanError(error), 2000);
        }
      });
  }
});
// workaround for swipe blocking events to inputs, disable on this page
$("#raised-content.raise-class").off();

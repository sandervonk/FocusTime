"use strict";
/** URI SEARCH TERMS **/
var params = new URLSearchParams(window.location.search),
  user,
  userDocCache = {};
if (window.history) {
  history.replaceState({}, "", window.location.href.substr(0, window.location.href.length - window.location.search.length));
}

/** TOAST **/

class Toast {
  constructor(message, type, duration, iconPath = "", action = "") {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.icon = iconPath;
    this.action = action;
    this.showToast();
  }
  showToast() {
    $(".toast").remove();
    let overlay = document.createElement("div"),
      toast = document.createElement("div");
    toast.classList.add("toast");
    overlay.classList.add("toast-overlay");
    toast.classList.add(this.type);
    if (this.icon != "") {
      toast.innerHTML += `<img src="${this.icon}" class="toast-icon" alt="Toast Popup Icon">`;
    }
    toast.innerHTML += this.message;
    if (this.action != "") {
      document.body.appendChild(overlay);
    }
    document.body.appendChild(toast);
    setTimeout(() => {
      $(toast).css({ animation: "slideOut 0.5s forwards" });
    }, this.duration);
    setTimeout(() => {
      overlay.remove();
      toast.remove();
      if (this.action != "" && this.action != "") {
        window.location.href = this.action;
      }
    }, this.duration + 500);
  }
}
class ErrorToast extends Toast {
  constructor(message, err, duration, action = "") {
    message += ": " + err;
    super(message, "default", duration, "//sander.vonk.one/lahacks-six/img/icon/toast/error-icon.svg", action);
  }
}
class WarningToast extends Toast {
  constructor(message, duration, action = "") {
    super(message, "default", duration, "//sander.vonk.one/lahacks-six/img/icon/toast/warning-icon.svg", action);
  }
}
/** POPUP **/

class Popup {
  constructor(message, type, duration, iconPath = "", action = "") {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.icon = iconPath;
    this.action = action;
    this.showPopup();
  }
  showPopup() {
    $(".popup, .popup-overlay").remove();
    let overlay = document.createElement("div"),
      toast = document.createElement("div"),
      buttons = "<div id='popup-buttons'>";
    toast.classList.add("popup");
    overlay.classList.add("popup-overlay");
    for (let classData of this.type.split(" ")) {
      toast.classList.add(classData);
    }
    for (let actionInfo of this.action) {
      buttons += `<button class="popup-button ${actionInfo[2] == undefined ? "" : " " + actionInfo[2]}" onclick="${actionInfo[0]}">${actionInfo[1]}</button>`;
    }
    buttons += "</div>";
    toast.innerHTML += (this.icon != "" ? `<div class="popup-top-bar">` : "") + "<div class='popup-text'>" + this.message + `</div>` + (this.icon != "" ? `<img src="${this.icon}" class="popup-icon" alt="Popup Icon"></div>` : "");
    toast.innerHTML += buttons;
    if (this.action != "") {
      document.body.appendChild(overlay);
    }
    document.body.appendChild(toast);
    setTimeout(() => {
      $(toast).css({ animation: "fadeout 0.5s forwards" });
      $(overlay).css({ animation: "fadeout 0.5s forwards" });
    }, this.duration);
    setTimeout(() => {
      $(toast).remove();
      $(overlay).remove();
    }, this.duration + 500);
  }
}
function removePopup() {
  $(".popup").css({ animation: "fadeout 0.5s forwards" });
  $(".popup-overlay").css({ animation: "fadeout 0.5s forwards" });
  setTimeout(() => {
    $(".popup").remove();
    $(".popup-overlay").remove();
  }, 500);
}
$(document.body).on("click", ".popup-overlay", function () {
  removePopup();
});

/** Other **/
$("[placeholdaction]").click(function () {
  new Toast("This feature hasn't been implemented yet, sorry! 🤫", "default", 1500, "//sander.vonk.one/lahacks-six/img/icon/toast/unimplemented-icon.svg");
});
function cleanError(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Invalid email";
    case "auth/user-disabled":
      return "User disabled";
    case "auth/user-not-found":
      return "User not found";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/email-already-in-use":
      return "Email already in use";
    case "auth/weak-password":
      return "Password is too weak";
    case "auth/operation-not-allowed":
      return "Operation not allowed";
    case "auth/too-many-requests":
      return "Too many requests";
    default:
      return error.message.replace("Error ", "");
  }
}
$("#raised-content.raise-class .handle, #raised-content.raise-class .handle-container").on("click touchstart mousedown", function () {
  $(this).parent("#raised-content").toggleClass("raised");
});

// jquery swipe plugin
(function ($) {
  function calculateResults(startX, startY, endX, endY, tresholdX, tresholdY) {
    var swipeDirection = { up: false, right: false, down: false, left: false };
    if (startX > endX && startX - endX >= tresholdX) swipeDirection.left = true;
    else if (startX < endX && endX - startX >= tresholdX) swipeDirection.right = true;

    if (startY < endY && endY - startY >= tresholdY) swipeDirection.down = true;
    else if (startY > endY && startY - endY >= tresholdY) swipeDirection.up = true;

    return swipeDirection;
  }
  $.fn.onSwipe = function (f, timeTreshold, tresholdX, tresholdY) {
    if (jQuery.isFunction(f)) {
      //We are only going to do our thing if the user passed a function

      if (typeof timeTreshold === "undefined" || timeTreshold === null) timeTreshold = 100; //ms

      if (typeof tresholdX === "undefined" || tresholdX === null) tresholdX = 30; //px

      if (typeof tresholdY === "undefined" || tresholdY === null) tresholdY = 30; //px

      var startX, startY; //Position when touch begins
      var endX, endY; //Position when touch ends

      var time; //Our timer variable
      var totalTime = 0; //Total time that the swipe took

      //When a touch starts on this element.
      //We can start a timer, and start getting coordinates.
      $(this).on("touchstart", function (e) {
        //Let's get our touch coordinates
        startX = e.touches[0].clientX; //This is where touchstart coordinates are stored
        startY = e.touches[0].clientY;

        time = setInterval(function () {
          //Let's see how long the swipe lasts.
          totalTime += 10;
        }, 10);
      });

      $(this).on("touchend", function (e) {
        endX = e.changedTouches[0].clientX; //This is where touchend coordinates are stored.
        endY = e.changedTouches[0].clientY;

        clearInterval(time); //Let's stop calculating time and free up resources.

        if (totalTime >= timeTreshold)
          //If swipe time is less than our treshold we won't do anything. Useful for preventing spam and accidental swipes.
          f(calculateResults(startX, startY, endX, endY, 30, 30)); //Send results to user's function

        totalTime = 0;
      });
    } else console.error("You need to pass a function in order to process swipe data.");

    return $(this);
  };
})(jQuery);
//swipes
$("#raised-content.raise-class").onSwipe(function (data) {
  if (data.down) {
    // $(this).removeClass("raised");
    $(".raise-class").removeClass("raised");
  } else if (data.up) {
    // $(this).addClass("raised");
    $(".raise-class").addClass("raised");
  }
  console.log("swipe");
});

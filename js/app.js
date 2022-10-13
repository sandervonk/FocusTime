$(".nav-item").click(function () {
  $(".nav-item").removeClass("active");
  $(this).addClass("active");
  $("#carousel").css({ left: -$(this).index() * 100 + "vw" });
  $("#carousel").attr("data-page-index", $(this).index());
  $("#content").attr("data-page", $(this).prop("id"));
  $(".carousel-page").removeClass("active");
  $("#" + $(this).prop("id")).addClass("active");
  $(".task-card").removeClass("editing");
});
$('[data-role="create-task"]').click(function () {
  //save task to userdoc db as json using firebase
  //get task data
  let task = {
    title: $('[data-role="task-info-title"]').val(),
    tag: $('[data-role="task-info-tag"]')[0].value,
    time: parseInt($('[data-role="time-radio-group"] input:checked').val()),
    date: new Date($('[data-role="task-info-date"]').val()).toISOString().split("T")[0],
  };
  if (Object.values(task).includes("")) {
    new WarningToast("Please fill out all fields", 3000);
    return;
  } else {
    // save task to firestore under userdoc
    db.collection("users")
      .doc(user.uid)
      .update({ tasks: firebase.firestore.FieldValue.arrayUnion(task) })
      .then(() => {
        $('[data-role="task-info-title"], [data-role="task-info-tag"], [data-role="task-info-date"]').val("");
        $("#time-30").prop("checked", true);
        new Toast("Task created!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/success-icon.svg");
      })
      .catch((error) => {
        new ErrorToast("Could not save task to userdoc", cleanError(error), 2000);
      });
  }
});
$("#add .card *").on("change input click", function () {
  //check if all fields are filled out
  if ($('[data-role="task-info-title"]').val() && $('[data-role="task-info-tag"]').val() && $("[name='time-allocated']:checked").length) {
    $('[data-role="create-task"]').removeClass("disabled");
  } else {
    $('[data-role="create-task"]').addClass("disabled");
  }
});
$(document.body).click(function (e) {
  if (!$(e.target).closest(".task-card.editing").length && !$(e.target).hasClass("task-card-action")) {
    $(".task-card.editing").removeClass("editing");
  }
});
$(document.body).on("click", ".task-card-date-widget", function () {
  $(".task-card").not($(this).closest(".task-card")).removeClass("editing");
  $(this)
    .closest(".task-card")
    .toggleClass("pinning")
    .animate({ scrollTop: 0 }, 750, function () {
      $(this).closest(".task-card").removeClass("pinning").children(".task-card-swipe-pin").click();
    });
});
$(document.body).on("click", ".task-card-action", function () {
  $(".task-card").not($(this).closest(".task-card")).removeClass("editing pinning");
  $(this).closest(".task-card").toggleClass("editing");
});
$(document.body).on("click", ".task-card-swipe-archive", function () {
  $(this).closest(".task-card").addClass("swipe-out");
  $(this)
    .closest(".task-card")
    .animate(
      {
        left: "-100%",
      },
      500,
      function () {
        try {
          let task = JSON.parse($(this).attr("data-task-json-content"));
          $(this).remove();
          db.collection("users")
            .doc(user.uid)
            .update({
              tasks: firebase.firestore.FieldValue.arrayRemove(task),
              archive: firebase.firestore.FieldValue.arrayUnion(task),
            })
            .then(() => {
              new Toast("Task archived!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/archive-icon.svg");
            })
            .catch((err) => {
              throw err;
            });
        } catch (err) {
          new ErrorToast("Could not archive task", cleanError(err), 2000, ".");
        }
      }
    );
});

$(document.body).on("click", ".task-card-swipe-done", function () {
  $(this).closest(".task-card").addClass("swipe-out");
  $(this)
    .closest(".task-card")
    .animate(
      {
        left: "-100%",
      },
      500,
      function () {
        try {
          let task = JSON.parse($(this).attr("data-task-json-content")),
            doneTask = JSON.parse($(this).attr("data-task-json-content"));
          doneTask.is_completed = true;
          $(this).remove();
          if (task != doneTask) {
            let docref = db.collection("users").doc(user.uid),
              batch = db.batch();
            batch.update(docref, { tasks: firebase.firestore.FieldValue.arrayRemove(task) });
            batch.update(docref, { tasks: firebase.firestore.FieldValue.arrayUnion(doneTask) });
            batch
              .commit()
              .then(() => {
                new Toast("Task marked as done!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/success-icon.svg");
              })
              .catch((err) => {
                throw err;
              });
          } else {
            console.log("Task already marked as done");
          }
        } catch (err) {
          new ErrorToast("Could not mark task as done", cleanError(err), 2000, ".");
        }
      }
    );
});
$("#card-completed").click(function () {
  // show popup to delete completed tasks with options to cancel, delete permanantly or archive
  new Popup(["Completed tasks", "Are you sure you want to delete all completed tasks?"], "default", 10000, "/FocusTime/img/icon/popup-done.svg", [
    ["removePopup();", "Cancel", "secondary-action fullborder"],
    ["", "", "popup-divider"],
    ["removePopup();", "Delete", "secondary-action blue-button DATA-clear-completed-tasks"],
    ["removePopup();", "Archive", "primary-action blue-button DATA-clear-completed-tasks DATA-save-archive"],
  ]);
});
$(document.body).on("click", "[data-role='clear-completed'], .DATA-clear-completed-tasks", function () {
  //archive all tasks from userdoc
  let save_archive = $(this).attr("data-save-archive") || $(this).hasClass("DATA-save-archive");
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      let tasks = doc.data().tasks;
      if (tasks.length > 0) {
        let archivedTasks = $.grep(tasks, function (t) {
          return t.is_completed;
        });
        let update_json = {
          tasks: firebase.firestore.FieldValue.arrayRemove(...archivedTasks),
        };
        if (save_archive) {
          update_json.archive = firebase.firestore.FieldValue.arrayUnion(...archivedTasks);
        }
        db.collection("users")
          .doc(user.uid)
          .update(update_json)
          .then(() => {
            if (save_archive) {
              new Toast("Completed tasks archived!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/archive-icon.svg");
            } else {
              new Toast("Completed tasks deleted!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/success-icon.svg");
            }
          })
          .catch((err) => {
            new ErrorToast("Could not clear completed tasks", cleanError(err), 2000, ".");
          });
      }
    });
});
$('[data-role="add-vite-card"]').click(function () {
  db.collection("users")
    .doc(user.uid)
    .update({ tasks: firebase.firestore.FieldValue.arrayUnion({ iframe_url: "/VITE/embed/task.html", iframe_bg: "#1d55a8", date: "top", is_pinned: true }) })
    .then(() => {
      new Toast("Added VITE! card!", "default", 4000, "//sander.vonk.one/VITE/img/icon/concern-icon.svg");
    })
    .catch((error) => {
      new ErrorToast("Could not save VITE! card data userdoc", cleanError(error), 2000);
    });
});
// set min and max dates on data-role="task-info-date"

$('[data-role="task-info-date"]').attr({
  min: new Date().toISOString().split("T")[0],
  max: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365).toISOString().split("T")[0],
});

/*  TASKS  */

try {
  console.log("setting up from cache");
  makeTasksFromDoc(docFromCashe());
  setupFieldsFromDoc(docFromCashe());
} catch (err) {
  console.warn("Could not setup from cashe", err);
}
$("[data-auth-role='logoutprompt']").click(function () {
  new Popup(["Sign Out", "Are you sure you want to sign out?"], "default", 10000, "", [
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

function sortByDate(a, b) {
  let a_is_raised = !a.date || a.is_pinned || a.date == "priority" || a.date == "top";
  let b_is_raised = !b.date || b.is_pinned || b.date == "priority" || b.date == "top";
  let is_lower = a_is_raised || (!b.is_raised && new Date(a.date).getTime() < new Date(b.date).getTime());
  return !is_lower ? 1 : -1;
}
function makeTasksFromDoc(doc) {
  if (doc.exists) {
    let tasks = doc.data().tasks,
      newHTML = $(`<div data-role="tasks-list"></div>`),
      has_iframe = false,
      lastDate = 0,
      this_date;
    if (tasks) {
      tasks.sort(sortByDate);
      tasks.forEach((task) => {
        if (!task.is_completed) {
          let card_content;
          if (!task.iframe_url) {
            card_content = `
            <div class="task-card-content"><div class="task-card-widgets"><div class="task-card-time-widget"><object class="task-card-widget-icon" data="../img/icon/tasks/clock-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/clock-icon.png" /></object><span class="task-card-time">${
              task.time
            } minutes</span></div><div class="task-card-date-widget"><object class="task-card-widget-icon" data="../img/icon/tasks/date-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/date-icon.png" /></object><span class="task-card-time">${task.date && task.date != "priority" ? task.date : "No Goal Date"}</span></div></div><hr /><div class="task-card-info"><div class="task-card-title">${task.title}</div><div class="task-card-tag">${
              Object.keys(getClassJSON()).includes(task.tag) ? getClassJSON()[task.tag] : task.tag
            }</div></div><div data-role="edit-card" class="task-card-action"><object class="task-card-action-icon edit-icon" data="../img/icon/tasks/edit-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/edit-icon.png" /></object><object class="task-card-action-icon editing-icon" data="../img/icon/tasks/editing-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/editing-icon.png" /></object></div></div>`;
          } else {
            has_iframe = true;
            card_content = `
            <div class="iframe-content task-card-loading task-card-content" style="background: ${task.iframe_bg ? task.iframe_bg : "ffffff"}'"><iframe title="Task Embed Content" src="${task.iframe_url}" style="border: none; border-radius: 15px; overflow:hidden; background: ${
              task.iframe_bg
            };" name="vite-task" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" height="100%" width="100%"></iframe><div data-role="edit-card" class="task-card-action"><object class="task-card-action-icon edit-icon" data="../img/icon/tasks/edit-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/edit-icon.png" /></object><object class="task-card-action-icon editing-icon" data="../img/icon/tasks/editing-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/editing-icon.png" /></object></div></div>`;
          }
          //if date different from last date, show message in console, will add header later
          this_date = getDateText(task.date);
          if (lastDate != this_date) {
            $("<div></div>", { class: "task-section-header", text: this_date, "data-date": this_date }).appendTo(newHTML);
            lastDate = this_date;
          }
          $(
            `<div class="task-card${task.iframe_url ? " task-iframe-card" : ""}">
            <div class="task-card-swipe-pin"><object class="task-card-pin-icon" data="../img/icon/tasks/pin-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/pin-icon.png" /></object></div>
            ${card_content}
            <div class="task-card-swipe">
              <div class="task-card-swipe-done"><object class="task-card-swipe-icon" data="../img/icon/tasks/done-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/done-icon.png" /></object></div>
              <div class="task-card-swipe-archive"><object class="task-card-swipe-icon" data="../img/icon/tasks/archive-icon.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/archive-icon.png" /></object></div>
            </div>`
          )
            .attr({ "data-task-json-content": JSON.stringify(task), style: task.iframe_url ? "background: " + task.iframe_bg : "" })
            .appendTo(newHTML);
        }
      });
    }
    //check that the current element does not match the new one, if it does, do not replace
    if ($(newHTML).text() != $("[data-role='tasks-list']").text()) {
      console.log("TASKSLIST: replacing");
      $("[data-role='tasks-list']").replaceWith(newHTML);
      if (has_iframe) {
        $('[data-role="vite-add-card"]').hide();
      } else {
        $('[data-role="vite-add-card"]').show();
      }
      $(".task-iframe-card iframe").on("load", function () {
        $(this).closest(".task-card").show().removeClass("task-card-loading");
      });
      try {
        $(".task-card").swipe("destroy");
        $(".task-card").swipe({
          swipeLeft: function () {
            $(".task-card").removeClass("editing").removeClass("pinning");
            $(this).addClass("editing");
          },
          swipeRight: function () {
            if ($(this).hasClass("editing")) {
              $(this).removeClass("editing");
            } else {
              $(this)
                .closest(".task-card")
                .removeClass("pinning")
                .addClass("pinning")
                .animate({ scrollTop: 0 }, 750, function () {
                  $(this).closest(".task-card").removeClass("pinning").children(".task-card-swipe-pin").click();
                });
            }
          },
        });
      } catch (err) {
        console.warn("could not setup swipe events", err);
      }
    } else {
      console.log("TASKSLIST: matched");
    }
  }
}
function getDateText(date) {
  if (!date || date == "priority") {
    return "Priority";
  } else if (date == "top") {
    return "Pinned";
  } else if (new Date().toISOString().split("T")[0] == date) {
    return "Today";
  } else {
    //format date and add th, nd, st, etc endings
    let formatted_date = new Date(date).toLocaleDateString("en-us", { weekday: "long", month: "long", day: "numeric" });
    let day = formatted_date.split(" ")[2],
      day_endings = ["th", "st", "nd", "rd"];
    let day_ending = day_endings[0];
    if (day > 3 && day < 21) {
      day_ending = day_endings[0];
    } else {
      switch (day % 10) {
        case 1:
          day_ending = day_endings[1];
          break;
        case 2:
          day_ending = day_endings[2];
          break;
        case 3:
          day_ending = day_endings[3];
          break;
      }
    }
    return formatted_date.split(" ").slice(0, 2).join(" ") + " " + day + day_ending;
  }
}

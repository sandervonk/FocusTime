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
  if ($('[data-role="task-info-title"]').val() && $('[data-role="task-info-tag"]').val() && $('[data-role="task-info-date"]').val() && $("[name='time-allocated']:checked").length) {
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
$(document.body).on("click", ".task-card-action", function () {
  $(".task-card").not($(this).closest(".task-card")).removeClass("editing");
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

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
$("#card-completed, [data-role='clear-tasks']").click(function () {
  //archive all tasks from userdoc
  db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc) => {
      let tasks = doc.data().tasks;
      if (tasks.length > 0) {
        db.collection("users")
          .doc(user.uid)

          .update({
            archive: firebase.firestore.FieldValue.arrayUnion(...tasks),
            tasks: [],
          })
          .then(() => {
            new Toast("Tasks cleared!", "default", 1000, "//sander.vonk.one/FocusTime/img/icon/toast/archive-icon.svg");
          })
          .catch((err) => {
            new ErrorToast("Could not clear tasks", cleanError(err), 2000, ".");
          });
      }
    });
});

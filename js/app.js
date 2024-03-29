const section_break = `<div class="time-section-break">Nothing Planned</div>`,
  day_ms = 24 * 60 * 60 * 1000;

if (params.has("fullpage") && params.get("fullpage") == "true") {
  $(document.body).addClass("full-width-list");
}
$(".nav-item").click(function () {
  $(".nav-item").removeClass("active");
  $(this).addClass("active");
  $("#carousel").css({ left: -$(this).index() * 100 + "vw" });
  $("#carousel").attr("data-page-index", $(this).index());
  $("#content").attr("data-page", $(this).prop("id"));
  $(".carousel-page").removeClass("active");
  $("#" + $(this).prop("id")).addClass("active");
  $(".task-card").removeClass("editing pinning");
});
// setup class dropdown

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
    task.date = $('[data-role="task-info-date"]').val();
    try {
      task.date = task.date ? new Date(task.date).toISOString().split("T")[0] : "";
    } catch (err) {
      task.date = "";
    }
    // save task to firestore under userdoc
    db.collection("users")
      .doc(user.uid)
      .update({ tasks: firebase.firestore.FieldValue.arrayUnion(task) })
      .then(() => {
        $(
          '[data-role="task-info-title"], [data-role="task-info-tag"], [data-role="task-info-date"]'
        ).val("");
        $("#time-30").prop("checked", true);
        new Toast(
          "Task created!",
          "default",
          1000,
          "//sandervonk.github.io/FocusTime/img/icon/toast/success-icon.svg"
        );
        $(".nav-item#home").click();
      })
      .catch((error) => {
        new ErrorToast("Could not save task to userdoc", cleanError(error), 2000);
      });
  }
});
$("#add .card *").on("change input click", function () {
  //check if all fields are filled out
  void ($('[data-role="task-info-title"]').val() &&
  $('[data-role="task-info-tag"]').val() &&
  $("[name='time-allocated']:checked").length
    ? $('[data-role="create-task"]').removeClass("disabled")
    : $('[data-role="create-task"]').addClass("disabled"));
});
$(document.body).click(function (e) {
  if (
    !$(e.target).closest(".task-card.editing").length &&
    !$(e.target).hasClass("task-card-action")
  ) {
    $(".task-card.editing").removeClass("editing");
  }
});
//skip here
$(document.body).on("click", ".task-card-date-widget", function () {
  $(this)
    .closest(".task-card")
    .removeClass("pinning editing")
    .addClass("pinning")
    .animate({ scrollTop: 0 }, 750, function () {
      pinTask($(this));
      $(this).removeClass("pinning");
      $(this).closest(".task-card").removeClass("pinning");
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
              new Toast(
                "Task archived!",
                "default",
                1000,
                "//sandervonk.github.io/FocusTime/img/icon/toast/archive-icon.svg"
              );
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
  $(this).closest(".task-card").addClass("completed").removeClass("editing");

  let anim_updates = do_old_complete
    ? {
        left: "-100%",
      }
    : {
        top: "0%",
      };

  $(this)
    .closest(".task-card")
    .animate(anim_updates, 500, function () {
      try {
        let task = JSON.parse($(this).attr("data-task-json-content")),
          doneTask = JSON.parse($(this).attr("data-task-json-content"));
        doneTask.is_completed = true;
        if (do_old_complete) {
          $(this).remove();
        }
        if (task != doneTask) {
          let docref = db.collection("users").doc(user.uid),
            batch = db.batch();
          batch.update(docref, { tasks: firebase.firestore.FieldValue.arrayRemove(task) });
          if (!do_old_complete) {
            batch.update(docref, { tasks: firebase.firestore.FieldValue.arrayUnion(doneTask) });
          }
          batch
            .commit()
            .then(() => {
              new Toast(
                "Task marked as done!",
                "default",
                1000,
                "//sandervonk.github.io/FocusTime/img/icon/toast/success-icon.svg"
              );
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
    });
});
$("#card-completed").click(function () {
  // show popup to delete completed tasks with options to cancel, delete permanantly or archive
  new Popup(
    ["Completed tasks", "Are you sure you want to delete all completed tasks before today?"],
    "default",
    10000,
    "/FocusTime/img/icon/popup-done.svg",
    [
      ["removePopup();", "Cancel", "secondary-action fullborder"],
      ["", "", "popup-divider"],
      ["removePopup();", "Delete", "secondary-action blue-button DATA-clear-completed-tasks"],
      [
        "removePopup();",
        "Archive",
        "primary-action blue-button DATA-clear-completed-old-tasks DATA-save-old-archive",
      ],
    ]
  );
});
$("#card-completed").on("contextmenu", function () {
  // show popup to delete completed tasks with options to cancel, delete permanantly or archive
  new Popup(
    ["Completed tasks", "Are you sure you want to delete all completed tasks?"],
    "default",
    10000,
    "/FocusTime/img/icon/popup-done.svg",
    [
      ["removePopup();", "Cancel", "secondary-action fullborder"],
      ["", "", "popup-divider"],
      ["removePopup();", "Delete", "secondary-action blue-button DATA-clear-completed-tasks"],
      [
        "removePopup();",
        "Archive",
        "primary-action blue-button DATA-clear-completed-tasks DATA-save-archive",
      ],
    ]
  );
});

$("#card-time").click(function () {
  $(document.body).toggleClass("full-width-list");
});
$(document.body).on(
  "click",
  "[data-role='clear-completed'], .DATA-clear-completed-tasks, .DATA-clear-completed-old-tasks",
  function () {
    //archive all tasks from userdoc
    let save_archive = $(this).attr("data-save-archive") || $(this).hasClass("DATA-save-archive"),
      do_old_only =
        $(this).attr("DATA-clear-completed-old-tasks") || $(this).hasClass("DATA-save-old-archive");
    db.collection("users")
      .doc(user.uid)
      .get()
      .then((doc) => {
        let tasks = doc.data().tasks;
        if (do_old_only) {
          tasks = $.grep(tasks, function (t) {
            return new Date(t.date).getTime() + day_ms < new Date().getTime();
          });
        }
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
                new Toast(
                  "Completed tasks archived!",
                  "default",
                  1000,
                  "//sandervonk.github.io/FocusTime/img/icon/toast/archive-icon.svg"
                );
              } else {
                new Toast(
                  "Completed tasks deleted!",
                  "default",
                  1000,
                  "//sandervonk.github.io/FocusTime/img/icon/toast/success-icon.svg"
                );
              }
            })
            .catch((err) => {
              new ErrorToast("Could not clear completed tasks", cleanError(err), 2000, ".");
            });
        }
      });
  }
);
$('[data-role="add-vite-card"]').click(function () {
  db.collection("users")
    .doc(user.uid)
    .update({
      tasks: firebase.firestore.FieldValue.arrayUnion({
        iframe_url: "/VITE/embed/task.html",
        iframe_bg: "#1d55a8",
        date: "top",
        is_pinned: true,
        title: "VITE! French Practice",
      }),
    })
    .then(() => {
      new Toast(
        "Added VITE! card!",
        "default",
        4000,
        "//sandervonk.github.io/VITE/img/icon/concern-icon.svg"
      );
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
$(document.body).on("click", ".session-task-card", function () {
  $(this).toggleClass("checked");
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
  let a_is_raised = !a.date || a.is_pinned || a.date == "priority" || a.date == "top",
    is_lower =
      a_is_raised || (!b.is_raised && new Date(a.date).getTime() < new Date(b.date).getTime());
  return !is_lower ? 1 : -1;
}
function pinTask(task) {
  // update task in userdoc
  try {
    (taskData = JSON.parse(task.attr("data-task-json-content"))),
      (task_is_pinned = task.hasClass("pinned"));

    // send updates as batch
    let docref = db.collection("users").doc(auth.currentUser.uid),
      batch = db.batch();
    batch.update(docref, { tasks: firebase.firestore.FieldValue.arrayRemove(taskData) });
    batch.update(docref, {
      tasks: firebase.firestore.FieldValue.arrayUnion({ ...taskData, is_pinned: !task_is_pinned }),
    });
    batch
      .commit()
      .then(() => {
        task.toggleClass("pinned");
        if (!task_is_pinned) {
          new Toast(
            "Task pinned to the top of the list",
            "default",
            3000,
            "../img/icon/toast/info-pinned-icon.svg"
          );
        } else {
          new Toast(
            "Task unpinned from the top of the list",
            "default",
            3000,
            "../img/icon/toast/info-unpinned-icon.svg"
          );
        }
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    return new ErrorToast(
      `Could not ${task.hasClass("pinned") ? "un" : ""}pin task`,
      err.toString().includes("uid")
        ? "authentication has not been established yet"
        : cleanError(err),
      2000
    );
  }
}
function makeTasksFromDoc(doc) {
  if (doc.exists) {
    let tasks = doc.data().tasks,
      newHTML = $(`<div data-role="tasks-list"></div>`),
      sessionHTML = $(`<div id="todo-container" data-role="todo-container"></div>`),
      has_iframe = false,
      lastDate = 0,
      this_date;
    if (tasks) {
      // strip special characters from task content
      tasks.forEach((task) => {
        // if it has no title, give it a default title
        if (!task.title) {
          task.title = "Untitled Task";
        }
        // replace special characters with their html entity
        task.title_clean = task.title
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
        // remove other special characters except for html entities
        task.title_clean = task.title_clean.replace(
          /[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]/g,
          ""
        );
      });
      tasks.sort(sortByDate);
      tasks.forEach((task) => {
        if (
          (!do_old_complete || (do_old_complete && !task.is_completed)) &&
          (!task.is_completed ||
            (task.date && new Date(task.date).getTime() > new Date().getTime() - day_ms))
        ) {
          let card_content;
          if (!task.iframe_url) {
            card_content = `
            <div class="task-card-content"><div class="task-card-widgets"><div class="task-card-time-widget"><object class="task-card-widget-icon" aria-label="Task Icon" data="../img/icon/tasks/clock-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/clock-icon.png" /></object><span class="task-card-time">${
              task.time
            } minutes</span></div><div class="task-card-date-widget"><object class="task-card-widget-icon" aria-label="Task Icon" data="../img/icon/tasks/date-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/date-icon.png" /></object><span class="task-card-time">${
              task.date && task.date != "priority" ? task.date : "No Goal Date"
            }</span></div></div><hr /><div class="task-card-info"><div class="task-card-title" title="${
              task.title
            }">${task.title_clean}</div><div class="task-card-tag">${
              Object.keys(getClassJSON()).includes(task.tag) ? getClassJSON()[task.tag] : task.tag
            }</div></div><div data-role="edit-card" class="task-card-action"><object class="task-card-action-icon edit-icon" aria-label="Task Icon" data="../img/icon/tasks/edit-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/edit-icon.png" /></object><object class="task-card-action-icon editing-icon" aria-label="Task Icon" data="../img/icon/tasks/editing-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/editing-icon.png" /></object></div></div>`;
          } else {
            has_iframe = true;
            card_content = `
            <div class="iframe-content task-card-loading task-card-content" style="background: ${
              task.iframe_bg ? task.iframe_bg : "ffffff"
            }'"><iframe title="Task Embed Content" src="${
              task.iframe_url
            }" style="border: none; border-radius: 15px; overflow:hidden; background: ${
              task.iframe_bg
            };" name="vite-task" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" height="100%" width="100%"></iframe><div data-role="edit-card" class="task-card-action"><object class="task-card-action-icon edit-icon" aria-label="Task Icon" data="../img/icon/tasks/edit-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/edit-icon.png" /></object><object class="task-card-action-icon editing-icon" aria-label="Task Icon" data="../img/icon/tasks/editing-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/editing-icon.png" /></object></div></div>`;
          }
          this_date = getDateText(task.date, task.is_pinned);
          if (lastDate != this_date) {
            $("<div></div>", {
              class: "task-section-header",
              text: this_date,
              "data-date": this_date,
              timestamp: task.is_pinned ? "Pinned" : task.date ? task.date : "",
            }).appendTo(newHTML);
            lastDate = this_date;
          }
          // remove title_clean attribute from task json
          delete task.title_clean;
          $(
            `<div><div class='session-task-card-title'>${
              task.title ? task.title : "No Title / iframe"
            }</div></div>`
          )
            .attr({ class: "session-task-card", "data-task-json-content": JSON.stringify(task) })
            .appendTo(sessionHTML);
          $(
            `<div class="task-card${task.iframe_url ? " task-iframe-card" : ""}${
              task.is_pinned ? " pinned" : ""
            }${task.is_completed ? " completed" : ""}">
            <div class="task-card-swipe-pin"><object class="task-card-pin-icon" aria-label="Task Icon" data="../img/icon/tasks/pin-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/pin-icon.png" /></object><object class="task-card-pin-icon alt-icon" aria-label="Task Icon" data="../img/icon/tasks/pin-icon-alt.svg" type="image/svg+xml"><img alt="icon" src="../img/icon/tasks/pin-icon-alt.png" /></object></div>
            ${card_content}
            <div class="task-card-swipe">
              <div class="task-card-swipe-done"><object class="task-card-swipe-icon" aria-label="Task Icon" data="../img/icon/tasks/done-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/done-icon.png" /></object></div>
              <div class="task-card-swipe-archive"><object class="task-card-swipe-icon" aria-label="Task Icon" data="../img/icon/tasks/archive-icon.png?was-svg" type="image/png"><img alt="icon" src="../img/icon/tasks/archive-icon.png" /></object></div>
            </div>`
          )
            .attr({
              "data-task-json-content": JSON.stringify(task),
              style: task.iframe_url ? "background: " + task.iframe_bg : "",
            })
            .appendTo(newHTML);
        }
      });
      //wrap groups of tasks by day using wrapAll() on header and following .task-cards
      newHTML.children(".task-section-header").each(function () {
        let $section_header = $(this);
        $section_header
          .nextUntil(".task-section-header")
          .addBack()
          .wrapAll(
            `<div class='task-section' data-date='${$section_header.text()}' data-timestamp='${$section_header.attr(
              "timestamp"
            )}'></div>`
          );
        // add a break before the first section if it is not pinned and not before today
      });
      let $first_section = newHTML.children(".task-section").first();
      if (
        !$first_section.attr("data-timestamp").includes("-") ||
        new Date($first_section.attr("data-timestamp")).getTime() > new Date().getTime() + day_ms
      ) {
        $first_section.before(section_break);
      }
      // between sections with a gap of 1 day, add a divider
      newHTML.children(".task-section").each(function () {
        let $section = $(this),
          $next_section = $section.next(".task-section");
        if ($next_section.length) {
          let next_date = new Date($next_section.attr("data-timestamp")).getTime(),
            this_date = new Date($section.attr("data-timestamp")).getTime();
          if (next_date - this_date > day_ms || !new Date(this_date)) {
            $section.after(section_break);
          }
        }
      });
    }
    //check that the current element does not match the new one, if it does, do not replace
    if ($(newHTML).text() != $("[data-role='tasks-list']").text()) {
      console.log("TASKSLIST: replacing");
      $("[data-role='tasks-list']").replaceWith(newHTML);
      $("[data-role='todo-container']").replaceWith(sessionHTML);
      void (has_iframe
        ? $("[data-role='vite-add-card']").hide()
        : $("[data-role='vite-add-card']").show());
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
            void ($(this).hasClass("editing")
              ? $(this).removeClass("editing")
              : $(this)
                  .closest(".task-card")
                  .removeClass("pinning")
                  .addClass("pinning")
                  .animate({ scrollTop: 0 }, 750, function () {
                    pinTask($(this));
                    $(this).removeClass("pinning");
                    $(this).closest(".task-card").removeClass("pinning");
                  }));
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
function getDateText(date, pinned = false) {
  if (!date || date == "priority") {
    return "Priority";
  } else if (date == "top" || pinned) {
    return "Pinned";
  } else if (new Date().toISOString().split("T")[0] == date) {
    return "Today";
  } else {
    //format date and add th, nd, st, etc endings
    let formatted_date = new Date(date).toLocaleDateString("en-us", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
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

$(".nav-item").click(function () {
  $(".nav-item").removeClass("active");
  $(this).addClass("active");
  $("#carousel").css({ left: -$(this).index() * 100 + "vw" });
  $("#carousel").attr("data-page-index", $(this).index());
  $("#content").attr("data-page", $(this).prop("id"));
  $(".carousel-page").removeClass("active");
  $("#" + $(this).prop("id")).addClass("active");
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
        new Toast("Task created!", "default", 1000, "//sander.vonk.one/lahacks-six/img/icon/toast/success-icon.svg", ".");
      })
      .catch((error) => {
        new ErrorToast("Could not save task to userdoc", cleanError(error), 3000);
      });
  }
});

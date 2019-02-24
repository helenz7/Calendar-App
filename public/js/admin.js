/* Admin */
"use strict"
const log = console.log;

/* ------- Variable ------- */
const user = {
  userName: "",
  name: "",
  email: "",
  events: []
};
const event = {
  title: "",
  start: "",
  end: "",
  type: "",
  description: ""
};
let eLen = 0;

/* ------- Global Element ------- */
const userTable = document.querySelector("#user_table").firstElementChild;
const eventTable = document.querySelector("#event_table").firstElementChild;

const addUserForm = document.querySelector("#add_user_form");
const usernameTextfield = document.querySelector("#username");
const nameTextfield = document.querySelector("#name");
const emailTextfield = document.querySelector("#email");

// const addEventToUser = document.querySelector("#add_event_to_user_form");
const success = document.querySelector("#isSuccess");
const added = document.querySelector("#hasAdded");

const eventDetailForm = document.querySelector("#eventDetailForm");
const newTitleTextfield = document.querySelector("#newInputTitle");
const newDateFromTextfield = document.querySelector("#newDateFrom");
const newDateToTextfield = document.querySelector("#newDateTo");
const newTypeSelect = document.querySelector("#newInputType");
const newDescriptionTextfield = document.querySelector("#newDescription");
const newEvent = document.querySelector("#new_event");
const modalFooter = document.querySelector(".modal-footer");
const uploadIcon = document.querySelector("#uploadIcon");
const userIcon = document.querySelector('#userIcon')

addUserForm.addEventListener("submit", addNewUser);
userTable.addEventListener("click", editUser);
userTable.addEventListener("click", deleteUser);
userTable.addEventListener("click", saveEditUser);
userTable.addEventListener("click", cancelEditUser);
newEvent.addEventListener("click", addNewEvent);
// addEventToUser.addEventListener("submit", eventToUser);
eventTable.addEventListener("click", deleteEvent);
modalFooter.addEventListener("click", saveNewEvent);

/* ------- Server Callback ------- */
getUsers();
getEvents();

function getUsers() {
  let url = '/admin/users';

  fetch(url)
  .then((res) => {
    if (res.status === 200) {
      return res.json();
    } else {
      alert('Could not get users')
    }
  })
  .then((json) => {
    if (json.users.length > 0) {
      json.users.map((user) => {
        addNewUserToTable(user)
      })
    }
  }).catch((error) => {
    log(error)
  })
}

function getEvents() {
  let url = '/admin/events';

  fetch(url)
  .then((res) => {
    if (res.status === 200) {
      return res.json();
    } else {
      alert('Could not get events')
    }
  })
  .then((json) => {
    if (json.events.length > 0) {
      json.events.map((user) => {
        addNewEventToTable(user)
      })
    }
  }).catch((error) => {
    log(error)
  })
}

function addUserToServer(user) {
  const url = '/admin/user'

  const request = new Request(url, {
    method: 'post',
    body: JSON.stringify(user),
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    },
  })

  fetch(request)
  .then(function(res) {
    if (res.status === 200) {
      log('Added user')

      addNewUserToTable(user);
      usernameTextfield.value = "";
      nameTextfield.value = "";
      nameTextfield.value = "";
    } else {
      alert('Could not add user')
    }
  }).catch((error) => {
    log(error)
  })
}

// NULL
function sendEditUserToServer(user, selectedRow) {
  const url = '/admin/user/' + user.userName
  const data = {
    userName: user.userName,
		email: user.email,
		name: user.name
  }

  $.post('/admin/editUser', data).then(function(res) {
    if (res === 'ok') {
      log('Save edited user')
      saveEditUserToTable(selectedRow);
    } else {
      alert('Could not save edited user')
    }
  }).catch((error) => {
    log(error)
  })
}

function deleteUserFromServer(userName, selectedRow) {
  const url = '/admin/user/' + userName

  const request = new Request(url, {
    method: 'delete'
  })

  fetch(request)
  .then(function(res) {
    if (res.status === 200) {
      log('Deleted user')
      userTable.removeChild(selectedRow);

      console.log("User " + selectedRow.children[2].innerText + "(" + selectedRow.children[0].innerText + ") removed!");
    } else {
      alert('Could not delete user')
    }
  }).catch((error) => {
    log(error)
  })
}

function addEventToServer() {
  const url = '/calendar/add'

  const request = new Request(url, {
    method: 'post',
    body: JSON.stringify(event),
    header: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  })

  fetch(request)
  .then(function(res) {
    if (res.status === 200) {
      log('Added event')

      addNewEventToTable(selectedRow);
      // Reset textField of modal.
      newTitleTextfield.value = "";
      newDateFromTextfield.value = "";
      newDateToTextfield.value = "";
      newTypeSelect.value = "default";
      newDescriptionTextfield.value = "";
    } else {
      alert('Could not add event')
    }
  }).catch((error) => {
    log(error)
  })
}

function deleteEventFromServer(selectedRow) {
    const title = selectedRow.children[0].innerText
    const start = selectedRow.children[1].innerText
    const end = selectedRow.children[2].innerText
    const type = selectedRow.children[3].innerText
    const event = {
      title: title,
      start: start,
      end: end,
      type: type
    }
    $.post('/admin/deleteEvent', event).then((r) => {
      if (r === "unauthorized") {
        window.location = '/'
      } else {
        eventTable.removeChild()
      }
    })
}

/* ------- Event Callback ------- */
function addNewUser(e) {
  e.preventDefault();

  // Reset empty warning.
  usernameTextfield.parentElement.classList.remove("has-error");
  nameTextfield.parentElement.classList.remove("has-error");
  emailTextfield.parentElement.classList.remove("has-error");

  // Check empty input.
  const idEmpty = false;
  const usernameEmpty = checkEmptyTextfield(usernameTextfield);
  const nameEmpty = checkEmptyTextfield(nameTextfield);
  const emailEmpty = checkEmptyTextfield(emailTextfield);

  // Check if input is valid or not.
  if (!idEmpty && !usernameEmpty && !nameEmpty && !emailEmpty) {
    user.userName = usernameTextfield.value
    user.name = nameTextfield.value
    user.email = emailTextfield.value
  }

    // Send newUser to server.
    addUserToServer(user)
}

function editUser(e) {
  e.preventDefault();

  if (e.target.classList.contains("editButton")) {
    const selectedRow = e.target.parentElement.parentElement;

    // Save original user id so that the user can be found and edited in users array.
    user.userName = selectedRow.children[0].innerText.trim();
    user.name = selectedRow.children[1].innerText.trim();
    user.email = selectedRow.children[2].innerText.trim();

    // Change text to textField for editing.
    userTableTextToTextfield(selectedRow);

    // Change button for save and cancel.
    const actionCell = selectedRow.children[3];
    actionCell.removeChild(actionCell.firstElementChild);
    actionCell.removeChild(actionCell.firstElementChild);
    addSaveButtonTo(actionCell);
    addCancelButtonTo(actionCell);
  }
}

function deleteUser(e) {
    e.preventDefault();

    if (e.target.classList.contains("deleteButton")) {
      const selectedRow = e.target.parentElement.parentElement;
      const userName = selectedRow.children[0].innerText.trim();

      deleteUserFromServer(userName, selectedRow)
    }
}

function saveEditUser(e) {
    e.preventDefault();

    if (e.target.classList.contains("saveButton")) {

      const selectedRow = e.target.parentElement.parentElement;
      user.userName = parseInt(selectedRow.firstElementChild.innerText)
      const editUsernameTextField = selectedRow.children[0].firstElementChild;
      const editNameTextfield = selectedRow.children[1].firstElementChild;
      const editEmailTextfield = selectedRow.children[2].firstElementChild;

      // Check empty input.
      const idEmpty = false;
      const usernameEmpty = checkEmptyTextfield(editUsernameTextField);
      const nameEmpty = checkEmptyTextfield(editNameTextfield);
      const emailEmpty = checkEmptyTextfield(editEmailTextfield);

      // Check if input is valid or not.
      if (!idEmpty && !usernameEmpty && !nameEmpty && !emailEmpty) {
          user.userName = editUsernameTextField.value;
          user.name = editNameTextfield.value;
          user.email = editEmailTextfield.value;
          // Send edited user to server.
          sendEditUserToServer(user, selectedRow)
      }
    }
}

function cancelEditUser(e) {
  e.preventDefault();

  if (e.target.classList.contains("cancelButton")) {
    const selectedRow = e.target.parentElement.parentElement;

    saveEditUserToTable(selectedRow);
  }
}

function addNewEvent(e) {
  e.preventDefault();

  if (e.target.classList.contains("newButton")) {
    // Reset empty warning.
    newTitleTextfield.parentElement.classList.remove("has-error");
    newDateFromTextfield.parentElement.classList.remove("has-error");
    newDateToTextfield.parentElement.classList.remove("has-error");
    newTypeSelect.parentElement.classList.remove("has-error");
    newDescriptionTextfield.parentElement.classList.remove("has-error");
  }
}

function deleteEvent(e) {
  e.preventDefault();

  if (e.target.classList.contains("deleteButton")) {
    const selectedRow = e.target.parentElement.parentElement;

    deleteEventFromServer(selectedRow)
  }
}

function saveNewEvent(e) {
  e.preventDefault();

  if (e.target.classList.contains("saveButton")) {

    // Check empty input.
    const titleEmpty = checkEmptyTextfield(newTitleTextfield);
    const dateFromEmpty = checkEmptyTextfield(newDateFromTextfield);
    const dateToEmpty = checkEmptyTextfield(newDateToTextfield);
    const descriptionEmpty = checkEmptyTextfield(newDescriptionTextfield);

    // Check if input is valid or not.
    if (!titleEmpty && !dateFromEmpty && !dateToEmpty && !descriptionEmpty) {
      event.title = newTitleTextfield.value
      event.start = newDateFromTextfield.value
      event.end = newDateToTextfield.value
      event.type = newTypeSelect.value
      event.description = newDescriptionTextfield.value

      // Send newEvent to server.
      addEventToServer()
    }
  }
}

/* ------- DOM Manipulation ------- */
function addNewUserToTable(user) {
  const trow = document.createElement("tr");
  const usernameCell = document.createElement("td");
  const nameCell = document.createElement("td");
  const emailCell = document.createElement("td");
  const actionCell = document.createElement("td");

  usernameCell.appendChild(document.createTextNode(user.userName));
  nameCell.appendChild(document.createTextNode(user.name));
  emailCell.appendChild(document.createTextNode(user.email));
  addEditButtonTo(actionCell);
  addDeleteButtonTo(actionCell);

  trow.appendChild(usernameCell);
  trow.appendChild(nameCell);
  trow.appendChild(emailCell);
  trow.appendChild(actionCell);
  userTable.appendChild(trow);

  console.log("User " + user.name + " added!");
}

function addNewEventToTable(event) {
  const trow = document.createElement("tr");
  const titleCell = document.createElement("td");
  const startDate = document.createElement("td");
  const endDate = document.createElement("td");
  const type = document.createElement("td");
  const actionCell = document.createElement("td");

  titleCell.appendChild(document.createTextNode(event.title));
  startDate.appendChild(document.createTextNode(event.start));
  endDate.appendChild(document.createTextNode(event.end));
  type.appendChild(document.createTextNode(event.type));
  addDeleteButtonTo(actionCell);

  trow.appendChild(titleCell);
  trow.appendChild(startDate);
  trow.appendChild(endDate);
  trow.appendChild(type);
  trow.appendChild(actionCell);
  eventTable.appendChild(trow);

  console.log("Event " + event.title + " added!");
}

function saveEditUserToTable(row) {
  const usernameCell = row.children[0];
  const nameCell = row.children[1];
  const emailCell = row.children[2];

  // Change textField to text;
  usernameCell.removeChild(usernameCell.firstElementChild);
  nameCell.removeChild(nameCell.firstElementChild);
  emailCell.removeChild(emailCell.firstElementChild);
  usernameCell.appendChild(document.createTextNode(user.userName));
  nameCell.appendChild(document.createTextNode(user.name));
  emailCell.appendChild(document.createTextNode(user.email));

  // Change button back to edit.
  const actionCell = row.children[3];
  actionCell.removeChild(actionCell.firstElementChild);
  actionCell.removeChild(actionCell.firstElementChild);
  addEditButtonTo(actionCell);
  addDeleteButtonTo(actionCell);
}

function addSaveButtonTo(cell) {
  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-primary btn-sm saveButton";
  saveButton.innerText = "Save";

  cell.appendChild(saveButton);
}

function addCancelButtonTo(cell) {
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-default btn-sm cancelButton toRight";
  cancelButton.innerText = "Cancel";

  cell.appendChild(cancelButton);
}

function addEditButtonTo(cell) {
  const editButton = document.createElement("button");
  editButton.className = "btn btn-warning btn-sm editButton";
  editButton.innerText = "Edit";

  cell.appendChild(editButton);
}

function addDeleteButtonTo(cell) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-danger btn-sm deleteButton";
  deleteButton.innerText = "Delete";

  cell.appendChild(deleteButton);
}

function userTableTextToTextfield(row) {
  const usernameCell = row.children[0];
  const nameCell = row.children[1];
  const emailCell = row.children[2];

  const editUsernameTextField = document.createElement("input")
  editUsernameTextField.type = "text";
  editUsernameTextField.className = "editUsername";
  editUsernameTextField.value = usernameCell.innerText.trim();
  const editNameTextField = document.createElement("input")
  editNameTextField.type = "text";
  editNameTextField.className = "editName";
  editNameTextField.value = nameCell.innerText.trim();
  const editEmailTextField = document.createElement("input")
  editEmailTextField.type = "email";
  editEmailTextField.className = "editEmail";
  editEmailTextField.value = emailCell.innerText.trim();

  usernameCell.innerText = "";
  usernameCell.appendChild(editUsernameTextField);
  nameCell.innerText = "";
  nameCell.appendChild(editNameTextField);
  emailCell.innerText = "";
  emailCell.appendChild(editEmailTextField);
}

/* ------- Helper Function ------- */
function checkEmptyTextfield(textfield) {
  if (textfield.value.length === 0) {
    textfield.parentElement.classList.add("empty");
  }

  return textfield.value.length === 0;
}

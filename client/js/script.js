"use strict";

let app = null;

/* console.log shortcut */
function cl(variable) {
  console.log(variable);
}

/*=======================================================
 CONTROLLER
 =======================================================*/
function App() {

  // storing frequently used jQuery selectors for more efficient use
  const $inputName = $('#student-name');
  const $inputCourse = $('#course');
  const $inputGrade = $('#student-grade');

  const $editInputName = $('#edit-student-name');
  const $editInputCourse = $('#edit-course');
  const $editInputGrade = $('#edit-student-grade');

  // create the model and view objects
  this.model = new Model(this);
  this.view = new View(this);

  this.init = function() {
    this.model.getDataFromServer();
    this.view.addClickHandlers();
  };

  /*=======================================================
   MODEL
   =======================================================*/
  function Model(controller) {
    this.studentArray = [];

    /**
     * connectWithServer - takes in the API url and any optional student data and attempts to send to server via AJAX call
     *
     * @param {string} url - relative path to the PHP API
     * @param {object} data - object literal containing student data (either creating/updating records or deleting existing)
     * @returns {object} jquery XMLHttpRequest object
     */
    this.connectWithServer = function(url, data) {
      return $.ajax({
        method: 'POST',
        dataType: 'json',
        timeout: 5000,
        data: data,
        url: url
      });
    };

    /**
     * getDataFromServer - requests via ajax call to our API all student info from database
     *
     * @returns {object} jquery XMLHttpRequest object
     */
    this.getDataFromServer = function() {
      controller.model.connectWithServer('get_data.php', null)
        .fail(() => {
          controller.view.showConnectionErrorMessage();
          // controller.view.reenableButton($(this));
        })
        .done(function(ajaxResponse) {
          if (controller.view.handleServerErrors(ajaxResponse)) return;

          // if we're able to connect to the database, but there are no students in the DB
          if (!ajaxResponse.hasOwnProperty('data')) {
            controller.view.showTableMessage(ajaxResponse.message);
            return;
          } // TODO maybe change success false if no students, so handle server errors works as-is?

          // wipe the local student array and build a fresh copy, then trigger the view to update
          controller.model.studentArray = [];
          ajaxResponse.data.forEach(function({id, name, course, grade}) {
            const studentObj = {
              id: id,
              name: name,
              course: course,
              grade: grade
            };
            controller.model.studentArray.push(studentObj);
          });
          controller.view.updateDom();
        })
    };

    /**
     * addStudentToServer - send an individual student's data to our AJAX call function
     *
     * @params {object} studentObj
     * @returns {object} jquery XMLHttpRequest object
     */
    // this.addStudentToServer = function(studentObj) {
    //   return controller.model.connectWithServer('insert_data.php', studentObj);
    // };

    /**
     * editStudentOnServer - send an individual student's data to our AJAX call function
     * If the AJAX call is successful, clear add form and add the new student to local array
     *
     * @params {string, object, number}
     * @returns {object}
     */
    // this.editStudentOnServer = function(studentObj) {
    //   return controller.model.connectWithServer('edit_data.phpasdf', studentObj);
    // };

    /**
     * removeStudentFromServer - send an individual student's id to our delete API
     * If the AJAX call is successful, also remove student from the local array
     *
     * @param {number} studentId - id of student we want to delete
     * @returns {object} jQuery XMLHttpRequest object
     */
    // this.removeStudentFromServer = function(studentId) {
    //   return controller.model.connectWithServer('delete_data.php', {id: studentId});
    // };

    /**
     * calculateAverage - loop through the global student array and calculate average grade and return that value
     *
     * @returns {number}
     */
    this.calculateAverage = function() {
      const gradeTotal = controller.model.studentArray.reduce(function(total, currentElement) {
        return total + parseInt(currentElement.grade);
      }, 0);
      // added the "OR 0" at the end to prevent returning NaN if the student array is empty
      return Math.round(gradeTotal / controller.model.studentArray.length || 0);
    };
  }

  /*=======================================================
   VIEW
   =======================================================*/
  function View(controller) {
    this.addClickHandlers = function() {
      const $studentList = $('.student-list');
      $('#add-student').on('click', controller.view.addStudent);
      $('#clear-add-form').on('click', controller.view.clearAdd);
      $studentList.on('click', '.edit-student', controller.view.editStudent);
      $studentList.on('click', '.delete-student', controller.view.deleteStudent);
      $('#update-student').on('click', controller.view.updateStudent);
      $('#clear-edit-form').on('click', controller.view.clearEdit);
    };

    /**
     * addStudent - Event Handler when user clicks the add button
     */
    this.addStudent = function() {

      const student = {
        name: $inputName.val(),
        course: $inputCourse.val(),
        grade: parseInt($inputGrade.val())
      };

      if (controller.view.validateInputs(student)) {
        return;
      }

      controller.view.tempDisableButton($(this));

      controller.model.connectWithServer('insert_data.php', student)
        .fail(() => {
          controller.view.showConnectionErrorMessage();
          controller.view.reenableButton($(this));
        })
        .done((ajaxResponse) => {
          if (controller.view.handleServerErrors(ajaxResponse)) { // TODO break out into separate function?
            controller.view.reenableButton($(this));
            return;
          }
          student.id = ajaxResponse.new_id;
          controller.model.studentArray.push(student); // TODO break out into separate function?
          controller.view.updateDom();
          controller.view.clearAdd();
          controller.view.reenableButton($(this));
        });
    };

    /**
     * editStudent - set up the edit modal in preparation for the actual updateStudent function
     */
    this.editStudent = function(event) {
      const $targetRow = $(event.target.parentElement.parentElement);
      const studentData = controller.view.getRowData($targetRow);
      controller.view.populateEditModal(studentData);
      $('#modal-edit').modal('show');
    };

    this.updateStudent = function(event) {
      const editingStudentId = parseInt(event.target.getAttribute('student-id'));
      const student = {
        id: editingStudentId,
        name: $editInputName.val(),
        course: $editInputCourse.val(),
        grade: parseInt($editInputGrade.val())
      };

      if (controller.view.validateInputs(student)) {
        return;
      }

      controller.view.tempDisableButton($(this));
      controller.model.connectWithServer('edit_data.php', student)
        .fail(() => {
          controller.view.showConnectionErrorMessage();
          controller.view.reenableButton($(this));
        })
        .done((ajaxResponse) => {
          if (controller.view.handleServerErrors(ajaxResponse)) return;

          // update the same student in the local array
          const indexToEdit = controller.model.studentArray.map(student => student.id).indexOf(editingStudentId);
          controller.model.studentArray[indexToEdit] = student;
          controller.view.updateDom();
          controller.view.clearEdit();
          controller.view.reenableButton($(this));
          $('#modal-edit').modal('hide');
        });
    };

    /**
     * deleteStudent - deletes the appropriate student in the array and updates the DOM
     */
    this.deleteStudent = function() {
      // get the studentId of the one we clicked
      const studentId = parseInt($(this).attr('student-id'));

      // disable the button, remove the student from the server then local data, then reenable button (if deletion unsuccessful)
      controller.view.tempDisableButton($(this));
      controller.model.connectWithServer('delete_data.php', {id: studentId})
        .fail(() => {
          controller.view.showConnectionErrorMessage();
          controller.view.reenableButton($(this));
        })
        .done((ajaxResponse) => {
          if (controller.view.handleServerErrors(ajaxResponse)) return;

          // delete the same student from the local array, then update the dom
          const indexToDelete = controller.model.studentArray.map(student => student.id).indexOf(studentId);
          controller.model.studentArray.splice(indexToDelete, 1);

          controller.view.updateDom();
          controller.view.reenableButton($(this));
        });
    };

    this.validateInputs = function({name, course, grade}) {
      if ($.trim(name) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return true;
      }
      if ($.trim(course) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return true;
      }
      if (isNaN(grade)) {
        controller.view.generateErrorModal('Please enter a Student Grade. It must be a number between 0 and 100!');
        return true;
      }
      if (isNaN(grade) || parseInt(grade) > 100 || parseInt(grade) < 0) {
        controller.view.generateErrorModal('Student Grade must be a number between 0 and 100. (Overachieving students with scores above 100 are not tolerated around here.)');
        return true;
      }
    };

    this.handleServerErrors = function(ajaxResponse) {
      if (ajaxResponse.success === false) {
        controller.view.generateErrorModal(ajaxResponse.message);
        //controller.view.showTableMessage(ajaxResponse.message);
        return true;
      } else {
        return false;
      }
    };

    this.showConnectionErrorMessage = function(buttonClicked) {
      if (buttonClicked === undefined) {
        controller.view.showTableMessage('Unable to connect to server.');
      }
      // if we can't connect with our API, let the user know
      controller.view.generateErrorModal('It seems there was a server error of some kind! Refresh the page and try again. If the issue persists, contact the website administrator at dev@jasonpau.com.');
    };

    this.clearAdd = function() {
      $inputName.val('');
      $inputCourse.val('');
      $inputGrade.val('');
    };

    this.clearEdit = function() {
      $editInputName.val('');
      $editInputCourse.val('');
      $editInputGrade.val('');
    };

    /**
     * returns a student data object, based on the info from the table row that was clicked
     */
    this.getRowData = function(e) {
      return {
        id: e.find('.edit-student').attr('student-id'),
        name: e.find('.student-name').text(),
        course: e.find('.course').text(),
        grade: e.find('.grade').text()
      };
    };

    /**
     * populateEditModal - receives a student data object and assigns the properties to the form input values
     */
    this.populateEditModal = function({id, name, course, grade}) {
      $('#edit-student-name').val(name);
      $('#edit-course').val(course);
      $('#edit-student-grade').val(grade);
      $('#update-student').attr('student-id', id);
    };

    this.tempDisableButton = function(clickedObj) {
      const $loading_indicator = $('<div>', {class: 'loading-spinner'});
      clickedObj.attr('disabled', 'disabled').append($loading_indicator);
    };

    this.reenableButton = function(clickedObj) {
      clickedObj.removeAttr('disabled').children('.loading-spinner').remove();
    };

    this.generateErrorModal = function(error_message) {
      const modal = $('#modal-error');
      modal.find('.modal-body p').text(error_message);
      modal.modal('show');
    };

    /**
     * updateDom - centralized function to update the average and call student list update
     */
    this.updateDom = function() {
      // calculate the average grade and update it in the DOM
      $('.avgGrade').text(controller.model.calculateAverage());
      this.updateStudentList();
    };

    /**
     * updateStudentList - loops through global student array and appends each objects data into the student-list-container > list-body
     */
    this.updateStudentList = function() {
      $('.student-list tbody').empty();
      if (controller.model.studentArray.length === 0) {
        controller.view.showTableMessage('No student data. Try adding a few students using the Add Student form!');
      } else {
        controller.model.studentArray.forEach(function(student) {
          controller.view.addStudentToDom(student);
        });
      }
    };

    /**
     * addStudentToDom - take in a student object, create html elements from the values and then append the elements
     * into the .student_list tbody
     * @param {studentObj}
     */
    this.addStudentToDom = function({name, course, grade, id}) {
      const $buttonEdit = $('<button>', {
        text: 'Edit',
        type: 'button',
        class: 'btn btn-default edit-student',
        'student-id': id
      });

      const $buttonDelete = $('<button>', {
        text: 'Delete',
        type: 'button',
        class: 'btn btn-danger delete-student',
        'student-id': id
      });

      const $row = $('<tr>');
      const $cellName = $('<td>', {text: name, class: 'student-name'});
      const $cellCourse = $('<td>', {text: course, class: 'course'});
      const $cellGrade = $('<td>', {text: grade, class: 'grade'});
      const $cellDelete = $('<td>');

      $cellDelete.append($buttonEdit, $buttonDelete);
      $row.append($cellName, $cellCourse, $cellGrade, $cellDelete);
      $('.student-list').append($row);
    };


    /**
     * showTableMessage - display error message in student list table
     */
    this.showTableMessage = function(message) {
      const $table = $('.student-list tbody');
      $table.empty();

      const $row = $('<tr>');
      const $cell = $('<td>').attr('colspan', '4');
      const $loader = $('<div>', {
        text: message
      });

      $cell.append($loader);
      $row.append($cell);
      $table.append($row);
    };
  }
}

/**
 * Listen for the document to load and reset the data to the initial state
 */
$(document).ready(function() {
  app = new App();
  app.init();
});
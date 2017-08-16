"use strict";

// declare our app in the global namespace
let app = null;

/*=======================================================
 CONTROLLER
 =======================================================*/
function App() {

  // storing frequently used jQuery DOM objects for more efficient use
  const $inputName = $('#student-name');
  const $inputCourse = $('#course');
  const $inputGrade = $('#student-grade');

  const $editInputName = $('#edit-student-name');
  const $editInputCourse = $('#edit-course');
  const $editInputGrade = $('#edit-student-grade');

  // create the model and view objects
  const self = this;
  this.model = new Model(this);
  this.view = new View(this);

  this.init = function() {
    this.getDataFromServer();
    this.view.addClickHandlers();
  };

  /**
   * getDataFromServer - call our API via AJAX to get all student info from database
   *
   * @returns {object} jquery XMLHttpRequest object
   */
  this.getDataFromServer = function() {
    self.model.connectWithServer('get_data.php', null)
      .done(function(ajaxResponse) {
        if (self.view.handleReturnedDataErrors(ajaxResponse)) return;
        self.model.studentArray = [];
        ajaxResponse.data.forEach(function(studentObj) {
          self.model.studentArray.push(studentObj);
        });
        self.view.updateDom();
      })
      .fail(() => {self.view.showServerConnectionError()});
  };

  /**
   * addStudent - get data from the add form inputs, send the data to the server,
   * and if it's successful, add it to the local data then call the dom updates
   */
  this.addStudent = function() {
    const student = {
      name: $inputName.val(),
      course: $inputCourse.val(),
      grade: parseInt($inputGrade.val())
    };

    if (self.validateInputs(student)) return;

    self.view.tempDisableButton($(this));
    self.model.connectWithServer('insert_data.php', student)
      .always(() => {
        self.view.reenableButton($(this));
      })
      .done((ajaxResponse) => {
        if (self.view.handleReturnedDataErrors(ajaxResponse)) return;
        student.id = ajaxResponse.new_id;
        self.model.studentArray.push(student);
        self.view.updateDom();
        self.view.clearAdd();
      })
      .fail(() => {self.view.showServerConnectionError()});
  };

  /**
   * updateStudent - get data from the edit form inputs, send the data to the server,
   * and if it's successful, update that student in our local data, then call the dom updates
   */
  this.updateStudent = function(event) {
    const editingStudentId = parseInt(event.target.getAttribute('student-id'));
    const student = {
      id: editingStudentId,
      name: $editInputName.val(),
      course: $editInputCourse.val(),
      grade: parseInt($editInputGrade.val())
    };

    if (self.validateInputs(student)) return;

    self.view.tempDisableButton($(this));
    self.model.connectWithServer('edit_data.php', student)
      .always(() => {
        self.view.reenableButton($(this));
      })
      .done((ajaxResponse) => {
        if (self.view.handleReturnedDataErrors(ajaxResponse)) return;

        // update the same student in the local array
        const indexToEdit = self.model.studentArray.map(student => student.id).indexOf(editingStudentId);
        self.model.studentArray[indexToEdit] = student;
        self.view.updateDom();
        self.view.clearEdit();
        $('#modal-edit').modal('hide');
      })
      .fail(() => {self.view.showServerConnectionError()});
  };

  /**
   * deleteStudent - deletes the appropriate student in the array and updates the DOM
   */
  this.deleteStudent = function() {
    // get the studentId of the one we clicked
    const studentId = parseInt($(this).attr('student-id'));

    // disable the button, remove the student from the server then local data, then reenable button (if deletion unsuccessful)
    self.view.tempDisableButton($(this));
    self.model.connectWithServer('delete_data.php', {id: studentId})
      .always(() => {
        self.view.reenableButton($(this));
      })
      .done((ajaxResponse) => {
        if (self.view.handleReturnedDataErrors(ajaxResponse)) return;

        // delete the same student from the local array, then update the dom
        const indexToDelete = self.model.studentArray.map(student => student.id).indexOf(studentId);
        self.model.studentArray.splice(indexToDelete, 1);
        self.view.updateDom();
      })
      .fail(() => {self.view.showServerConnectionError()});
  };

  this.validateInputs = function({name, course, grade}) {
    if ($.trim(name) === '') {
      self.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
      return true;
    }
    if ($.trim(course) === '') {
      self.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
      return true;
    }
    if (isNaN(grade) || parseInt(grade) > 100 || parseInt(grade) < 0) {
      self.view.generateErrorModal('Student Grade must be a number between 0 and 100. (Overachieving students with scores above 100 are not tolerated around here.)');
      return true;
    }
  };

  /*=======================================================
   MODEL
   =======================================================*/
  function Model(controller) {
    this.studentArray = [];

    this.letterGradeFromNumber = function(numberGrade) {
      const gradeIndex = parseInt((numberGrade - 60) / 10);
      const letterGrades = ['D', 'C', 'B', 'A', 'A'];
      return letterGrades[gradeIndex] || 'F';
    };

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
      $('#clear-add-form').on('click', controller.view.clearAdd);
      $('#clear-edit-form').on('click', controller.view.clearEdit);
      $studentList.on('click', '.edit-student', controller.view.editStudent);

      $('#add-student').on('click', controller.addStudent);
      $('#update-student').on('click', controller.updateStudent);
      $studentList.on('click', '.delete-student', controller.deleteStudent);
    };

    /**
     * returns a student data object, based on the info from the table row that was clicked
     */
    this.getRowData = function(event) {
      return {
        id: event.find('.edit-student').attr('student-id'),
        name: event.find('.student-name').text(),
        course: event.find('.course').text(),
        grade: event.find('.grade').text()
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

    /**
     * editStudent - set up the edit modal in preparation for the actual updateStudent function
     */
    this.editStudent = function(event) {
      const $targetRow = $(event.target.parentElement.parentElement);
      const studentData = controller.view.getRowData($targetRow);
      controller.view.populateEditModal(studentData);
      $('#modal-edit').modal('show');
    };

    /**
     * handleReturnedDataErrors - if we're able to connect to the server, but not the database, inform the user
     */
    this.handleReturnedDataErrors = function(ajaxResponse) {
      if (!ajaxResponse.hasOwnProperty('data')) {
        self.view.showTableMessage(ajaxResponse.message);
      }
      if (ajaxResponse.success === false) {
        controller.view.generateErrorModal(ajaxResponse.message);
        return true;
      }
    };

    /**
     * showServerConnectionError - if we're unable to connect to the server at all, inform the user
     */
    this.showServerConnectionError = function() {
      controller.view.showTableMessage('Unable to connect to server.');
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

    this.tempDisableButton = function(clickedObj) {
      const $loading_indicator = $('<div>', {class: 'loading-spinner'});
      clickedObj.attr('disabled', 'disabled').append($loading_indicator);
    };

    this.reenableButton = function(clickedObj) {
      clickedObj.removeAttr('disabled').children('.loading-spinner').remove();
    };

    /**
     * generateErrorModal - take in an error message, and show that message to the user via our modal
     */
    this.generateErrorModal = function(error_message) {
      const modal = $('#modal-error');
      modal.find('.modal-body p').text(error_message);
      modal.modal('show');
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

    /**
     * updateDom - centralized function to update the average grade and call student list update
     */
    this.updateDom = function() {
      // calculate the average grade and update it in the DOM
      $('.avgGrade').text(controller.model.calculateAverage());
      this.updateStudentList();
    };

    /**
     * updateStudentList - loops through local student array and appends each objects data into the student-list-container > list-body
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
     * @param {object} studentObj - contains name, course, grade, and id properties
     */
    this.addStudentToDom = function(studentObj) {
      const $buttonEdit = $('<button>', {
        text: 'Edit',
        type: 'button',
        class: 'btn btn-default edit-student',
        'student-id': studentObj.id
      });

      const $buttonDelete = $('<button>', {
        text: 'Delete',
        type: 'button',
        class: 'btn btn-danger delete-student',
        'student-id': studentObj.id
      });

      const $row = $('<tr>');
      const $cellName = $('<td>', {text: studentObj.name, class: 'student-name'});
      const $cellCourse = $('<td>', {text: studentObj.course, class: 'course'});
      const $cellGrade = $('<td>', {text: studentObj.grade, class: 'grade'});
      const $cellDelete = $('<td>');

      $cellDelete.append($buttonEdit, $buttonDelete);
      $row.append($cellName, $cellCourse, $cellGrade, $cellDelete);
      $('.student-list').append($row);
    };
  }
}

/**
 * Listen for the document to load and set the data to the initial state
 */
$(document).ready(function() {
  app = new App();
  app.init();
});
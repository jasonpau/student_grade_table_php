"use strict";

/**
 * Define all global variables here
 */
let app = null;

/*=======================================================
 CONTROLLER
 =======================================================*/
function App() {

  const controller = this;

  const $inputName = $('#student-name');
  const $inputCourse = $('#course');
  const $inputGrade = $('#student-grade');

  this.model = new Model(this);
  this.view = new View(this);

  this.init = function() {
    this.model.getDataFromServer();
    this.view.addClickHandlers();
  };

  /*=======================================================
   MODEL
   =======================================================*/
  function Model() {
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
      })
        .always(function() {
          //if (button_clicked) controller.view.reenableButton(button_clicked);
        })
        .fail(function() {
          // if we can't connect with our API
          controller.view.generateErrorModal('It seems there was a server error of some kind! Refresh the page and try again. If the issue persists, contact the website administrator at dev@jasonpau.com.');
          controller.view.showTableMessage('Unable to connect to server.');
        });
    };

    /**
     * getDataFromServer - requests via ajax call to our API all student info from database
     *
     * @returns {object} jquery XMLHttpRequest object
     */
    this.getDataFromServer = function() {
      return controller.model.connectWithServer('get_data.php', null).done(function(ajaxResponse) {

        // if we aren't able to connect to the database, throw and error and return
        if (controller.view.handlePossibleError(ajaxResponse)) return;

        // if we're able to connect to the database, but there is no data...
        if (!ajaxResponse.hasOwnProperty('data')) {
          controller.view.showTableMessage(ajaxResponse.message);
          return;
        }

        // wipe the local student array and build a fresh copy, then trigger the view to update
        controller.model.studentArray = [];
        ajaxResponse.data.forEach(function({ id, name, course, grade }) {
          const studentObj = {
            id: id,
            name: name,
            course: course,
            grade: grade
          };
          controller.model.addStudent(studentObj);
        });
        controller.view.updateData();
      });
    };

    /**
     * addStudentToServer - send an individual student's data to our AJAX call function
     * If the AJAX call is successful, clear add form and add the new student to local array
     *
     * @params {object}
     * @returns {object} jquery XMLHttpRequest object
     */
    this.addStudentToServer = function(studentObj) {
      return controller.model.connectWithServer('insert_data.php', studentObj).done(function(ajaxResponse) {
        // check for any possible database errors sent back from the API
        if (controller.view.handlePossibleError(ajaxResponse)) return;
        // add the returned newId property to the student object
        studentObj.id = ajaxResponse.new_id;
        controller.model.addStudent(studentObj);
      });
    };

    /**
     * addStudent - creates a student object based on input fields in the form and adds the object to the main student array
     *
     * @return undefined
     */
    this.addStudent = function(studentObj) {
      controller.model.studentArray.push(studentObj);
    };

    /**
     * editStudentOnServer - send an individual student's data to our AJAX call function
     * If the AJAX call is successful, clear add form and add the new student to local array
     *
     * @params {string, object, number}
     * @returns {object}
     */
    this.editStudentOnServer = function(id, { name, course, grade }, localArrayIndex) {
      const data = {
        id: id,
        name: name,
        course: course,
        grade: grade
      };
      return controller.model.connectWithServer('edit_data.php', data).done(function(ajaxResponse) {
        if (controller.view.handlePossibleError(ajaxResponse)) return;
        // edit the same student from the local array
        controller.model.studentArray[localArrayIndex] = data;
        controller.view.updateData();
      });
    };

    /**
     * removeStudentFromServer - send an individual student's id to our AJAX call function, telling it to do a delete operation
     * If the AJAX call is successful, also remove student from the local array
     *
     * @param {number} id - id of student we want to delete
     * @param {number} localArrayIndex - index in local array of student we want to delete
     * @returns {object} jQuery XMLHttpRequest object
     */
    this.removeStudentFromServer = function(id, localArrayIndex) {
      const data = {id: id};
      return controller.model.connectWithServer('delete_data.php', data).done(function(ajaxResponse) {
        if (controller.view.handlePossibleError(ajaxResponse)) return;
        // delete the same student from the local array, then update the dom
        controller.model.studentArray.splice(localArrayIndex, 1);
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
      $('#add-student').on('click', controller.view.addButtonClicked);
      $('#cancel-add-student').on('click', controller.view.cancelClicked);
      $studentList.on('click', '.edit-student', controller.view.editStudent);
      $studentList.on('click', '.delete-student', controller.view.deleteStudent);
    };

    this.handlePossibleError = function(ajaxResponse) {
      if (ajaxResponse.success === false) {
        controller.view.generateErrorModal(ajaxResponse.message);
        controller.view.showTableMessage(ajaxResponse.message);
        return true;
      }
    };

    /**
     * addButtonClicked - Event Handler when user clicks the add button
     */
    this.addButtonClicked = function() {

      // if there isn't anything in the name field, we know to throw an error.
      if ($.trim($inputName.val()) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return;
      }

      // if there isn't anything in the course field, we know to throw an error.
      if ($.trim($inputCourse.val()) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return;
      }

      // quit this function if the grade input isn't a number
      if (isNaN(parseInt($inputGrade.val()))) {
        controller.view.generateErrorModal('Please enter a Student Grade. It must be a number between 0 and 100!');
        return;
      }

      // assuming it's a number, check to see if it's between 0 and 100
      if (parseInt($inputGrade.val()) > 100 || parseInt($inputGrade.val()) < 0) {
        controller.view.generateErrorModal('Student Grade must be a number between 0 and 100. (Overachieving students with scores above 100 are not tolerated around here.)');
        return;
      }

      // create an object that we'll pass into our addStudent function
      const student = {
        name: $inputName.val(),
        course: $inputCourse.val(),
        grade: $inputGrade.val()
      };

      console.log('this',$(this));
      console.log('event',event);

      controller.view.tempDisableButton($(this));

      if (event.target.hasAttribute('editing')) { // edit mode
        const editingStudentId = event.target.getAttribute('editing');
        const localArrayIndex = event.target.getAttribute('local-array-index');
        controller.model.editStudentOnServer(editingStudentId, student, localArrayIndex).then(() => {
          controller.view.updateData();
          controller.view.clearAddStudentForm();
          controller.view.reenableButton($(this));
          $(this).removeAttr('editing').removeAttr('local-array-index');
          $(this).text('Add');
          $('#student-add-form-title').text('Add Student');
        });
      } else { // add mode
        controller.model.addStudentToServer(student).then(() => {
          controller.view.updateData();
          controller.view.clearAddStudentForm();
          controller.view.reenableButton($(this));
        });
      }
    };

    /**
     * cancelClicked - Event Handler when user clicks the cancel button, should clear out student form
     *                 and also reset it from "edit" back to "add" status if needed
     */
    this.cancelClicked = function() {
      controller.view.clearAddStudentForm();
      $(this).removeAttr('editing').removeAttr('local-array-index');
      $(this).text('Add');
      $('#student-add-form-title').text('Add Student');
    };

    /**
     * clearAddStudentForm - clears out the form values based on inputIds variable
     */
    this.clearAddStudentForm = function() {
      $inputName.val('');
      $inputCourse.val('');
      $inputGrade.val('');
    };

    /**
     * editStudent - event handler that takes the event object and...
     */
    this.editStudent = function(event) {
      // add "edit mode" status to our form
      $('#add-student')
        .attr('editing', event.target.getAttribute('student-id'))
        .attr('local-array-index', $(event.target).parents('tr').index())
        .text('Update Student');
      $('#cancel-add-student')
        .text('Cancel');
      $('#student-add-form-title')
        .text('Edit Student');

      //populate our form with the student data
      const studentData = controller.view.getRowData($(event.target.parentElement.parentElement));
      controller.view.populateFormData(studentData);
    };

    /**
     * outputs a student data object, based on the info from the table row that was clicked
     */
    this.getRowData = function(e) {
      console.log('getRowData called: event:', e);
      return {
        id: e.find('.student-id').text(),
        name: e.find('.student-name').text(),
        course: e.find('.course').text(),
        grade: e.find('.grade').text()
      };
    };

    /**
     * receives a student data object and assigns the properties to the form input values
     */
    this.populateFormData = function({ name, course, grade }) {
      console.log('populateFormData called');

      //$('#studentId').val(studentObj.studentId);
      $('#student-name').val(name);
      $('#course').val(course);
      $('#student-grade').val(grade);
    };

    /**
     * deleteStudent - deletes the appropriate student in the array and updates the DOM
     */
    this.deleteStudent = function() {
      // get the studentId of the one we clicked
      const studentId = parseInt($(this).attr('student-id'));

      // get the "array" index of the one we clicked
      const localArrayIndex = $(this).parents('tr').index();

      // disable the button, remove the student from the server then local data, then reenable button (if deletion unsuccessful)
      controller.view.tempDisableButton($(this));
      controller.model.removeStudentFromServer(studentId, localArrayIndex).then(() => {
        controller.view.updateData();
        controller.view.reenableButton($(this));
      });
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
     * updateData - centralized function to update the average and call student list update
     */
    this.updateData = function() {
      // calculate the average grade and update it in the DOM
      $('.avgGrade').text(controller.model.calculateAverage());
      this.updateStudentList();
    };

    /**
     * updateStudentList - loops through global student array and appends each objects data into the student-list-container > list-body
     */
    this.updateStudentList = function() {
      // clear out the current list of students in the DOM
      $('.student-list tbody').empty();

      if (controller.model.studentArray.length === 0) {

        controller.view.showTableMessage('No student data. Try adding a few students using the Add Student form!');
      } else {
        // goes through the current student array, and adds each one to the DOM
        controller.model.studentArray.forEach(function(student) {
          controller.view.addStudentToDom(student);
        });
      }
    };

    /**
     * showConnectionError - display connection error message in student list table
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
     * addStudentToDom - take in a student object, create html elements from the values and then append the elements
     * into the .student_list tbody
     * @param studentObj
     */
    this.addStudentToDom = function({ name, course, grade, id}) {
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
  }
}

/**
 * Listen for the document to load and reset the data to the initial state
 */
$(document).ready(function() {
  app = new App();
  app.init();
});
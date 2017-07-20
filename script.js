"use strict";

/**
 * Define all global variables here
 */
let app = null;

/*=======================================================
 CONTROLLER
 =======================================================*/
function App() {
  this.student_array = [];

  const input_name = $('#studentName');
  const input_course = $('#course');
  const input_grade = $('#studentGrade');

  this.model = new Model(this);
  this.view = new View(this);

  // this should set everything to what it would look like on a clean refresh of the page
  this.init = function () {
    // TODO need to remove old event listeners just in case
    this.view.getDataFromServer();
    this.view.addClickHandlers();
  };

  /*=======================================================
   MODEL
   =======================================================*/
  function Model(controller) {

    /**
     * addStudent - creates a student object based on input fields in the form and adds the object to the main student array
     * @return undefined
     */
    this.addStudent = function (studentObj) {
      controller.student_array.push(studentObj);
    };

    /**
     * connectWithServer - takes in the API url, any optional student data, and optional jQuery element with the loading indicator
     * @returns {object}
     */
    this.connectWithServer = function(url, data) {
      if (data === undefined) data = null;
      return $.ajax({
        method: 'POST',
        dataType: 'json',
        timeout: 5000,
        data: data,
        url: url,
      })
      .always(function(){
        //if (button_clicked) controller.view.reenableButton(button_clicked);
      })
      .fail(function(){
        controller.view.generateErrorModal('It seems there was a server error of some kind! Refresh the page and try again. If the issue persists, contact the website administrator at dev@jasonpau.com.');
      });
  };

    // ajax call to send an individual student's updated data to the server
    // if successful, update local data & then dom
    this.addStudentToServer = function (studentObj) {
      return controller.model.connectWithServer('insert_data.php', studentObj).done(function(response){
        if (controller.view.handlePossibleError(response)) return;

        // add the returned new_id property to the student object
        studentObj.id = response.new_id;

        controller.view.clearAddStudentForm();

        // if we were able to add to the server DB, also add to our local array
        controller.model.addStudent(studentObj);
      });
    };

    this.editStudentOnServer = function (id, studentObj, local_array_index) {
      const data = {
        id: id,
        name: studentObj.name,
        course: studentObj.course,
        grade: studentObj.grade
      };

      return controller.model.connectWithServer('edit_data.php', data).done(function(response){
        if (controller.view.handlePossibleError(response)) return;

        // edit the same student from the local array
        controller.student_array[local_array_index] = data;
        controller.view.updateData();
      });
    };

    // ajax call to remove the clicked student from the server
    // if successful, also remove student from the local array & DOM
    this.removeStudentFromServer = function (id, local_array_index) {
      const data = { student_id: id };

      return controller.model.connectWithServer('delete_data.php', data).done(function(response){
        if (controller.view.handlePossibleError(response)) return;

        // delete the same student from the local array, then update the dom
        controller.student_array.splice(local_array_index, 1);
      });
    };

    /**
     * calculateAverage - loop through the global student array and calculate average grade and return that value
     * @returns {number}
     */
    this.calculateAverage = function () {
      const gradeTotal = controller.student_array.reduce(function(total, currentElement){
        return total + parseInt(currentElement.grade);
      }, 0);

      // added the "OR 0" at the end to prevent returning NaN if the student array is empty
      return Math.round(gradeTotal / controller.student_array.length || 0);
    }
  }

  /*=======================================================
   VIEW
   =======================================================*/
  function View(controller) {
    this.addClickHandlers = function () {
      $('#add-student').on('click', controller.view.addButtonClicked);
      $('#cancel-add-student').on('click', controller.view.cancelClicked);
      $('.student-list').on('click', '.delete-student', controller.view.deleteStudent);
      //$('#get-data-from-server').on('click', controller.view.refreshDataClicked);
    };

    this.handlePossibleError = function(response){
      if (response.success === false) {
        controller.view.generateErrorModal(response.error);
        return true;
      }
    };

    // this.refreshDataClicked = function () {
    //   console.log('test');
    //
    //   const $table = $('.student-list-body');
    //   $table.empty();
    //
    //   const $row = $('<tr>');
    //   const $cell = $('<td>').attr('colspan', '4');
    //   const $loader = $('<div>', {
    //     class: 'loading-spinner-large'
    //   });
    //
    //   $cell.append($loader);
    //   $row.append($cell);
    //   $table.append($row);
    //
    //   controller.view.tempDisableButton($(this));
    //   controller.view.getDataFromServer().then(() => {
    //     controller.view.reenableButton($(this));
    //   });
    //   controller.view.updateData();
    // };

    this.getDataFromServer = function(){
      return controller.model.connectWithServer('get_data.php', null).done(function(response){
        console.log('done was reached after connection: response:', response);
        // if the server isn't able to complete our request, let the user know
        if (controller.view.handlePossibleError(response)) {
          // if on a regular "get all data" request, if there's an error, show a special error on screen
          controller.view.showConnectionError();
          return;
        }

        // wipe the local student array as we're building a fresh copy from the server
        controller.student_array = [];

        response.data.forEach(function(student){
          controller.model.addStudent({
            id: student.id,
            name: student.name,
            course: student.course,
            grade: student.grade
          });
        });

        controller.view.updateData();
      });
    };

    /**
     * addButtonClicked - Event Handler when user clicks the add button
     */
    this.addButtonClicked = function () {

      // if there isn't anything in the name field, we know to throw an error.
      if ($.trim(input_name.val()) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return;
      }

      // if there isn't anything in the course field, we know to throw an error.
      if ($.trim(input_course.val()) === '') {
        controller.view.generateErrorModal('Please confirm all fields are filled out correctly and try adding again.');
        return;
      }

      // quit this function if the grade input isn't a number
      if (isNaN(parseInt(input_grade.val()))) {
        controller.view.generateErrorModal('Please enter a Student Grade. It must be a number between 0 and 100!');
        return;
      }

      // assuming it's a number, check to see if it's between 0 and 100
      if (parseInt(input_grade.val()) > 100 || parseInt(input_grade.val()) < 0) {
        controller.view.generateErrorModal('Student Grade must be a number between 0 and 100. (Overachieving students with scores above 100 are not tolerated around here.)');
        return;
      }

      // create an object that we'll pass into our addStudent function
      const student = {
        name: input_name.val(),
        course: input_course.val(),
        grade: input_grade.val()
      };

      controller.view.tempDisableButton($(this));
      controller.model.addStudentToServer(student).then(() => {
        controller.view.updateData();
        controller.view.reenableButton($(this));
      });
    };

    /**
     * cancelClicked - Event Handler when user clicks the cancel button, should clear out student form
     */
    this.cancelClicked = function() {
      controller.view.clearAddStudentForm();
    };

    /**
     * clearAddStudentForm - clears out the form values based on inputIds variable
     */
    this.clearAddStudentForm = function () {
      input_name.val('');
      input_course.val('');
      input_grade.val('');
    };

    /**
     * deleteStudent - deletes the appropriate student in the array and updates the DOM
     */
    this.deleteStudent = function () {
      // get the student_id of the one we clicked
      const student_id = parseInt($(this).attr('student_id'));

      // get the "array" index of the one we clicked
      const local_array_index = $(this).parents('tr').index();

      // disable the button, remove the student from the server then local data, then reenable button (if deletion unsuccessful)
      controller.view.tempDisableButton($(this));
      controller.model.removeStudentFromServer(student_id, local_array_index).then(() => {
        controller.view.updateData();
        controller.view.reenableButton($(this));
      });
    };

    this.tempDisableButton = function (clickedObj) {
      const $loading_indicator = $('<div>', {class: 'loading-spinner'});
      clickedObj.attr('disabled', 'disabled').append($loading_indicator);
    };

    this.reenableButton = function (clickedObj) {
      clickedObj.removeAttr('disabled').children('.loading-spinner').remove();
    };

    this.generateErrorModal = function (error_message) {
      const modal = $("#modalError");
      modal.find('.modal-body p').text(error_message);
      modal.modal('show');
    };

    /**
     * updateData - centralized function to update the average and call student list update
     */
    this.updateData = function () {
      // calculate the average grade and update it in the DOM
      $('.avgGrade').text(controller.model.calculateAverage());
      this.updateStudentList();
    };

    /**
     * updateStudentList - loops through global student array and appends each objects data into the student-list-container > list-body
     */
    this.updateStudentList = function () {
      console.log('we hit updatestudent list');
      // clear out the list of students in the DOM
      $('.student-list tbody').empty();

      // goes through the current student array, and adds each one to the DOM
      controller.student_array.forEach(function(element){
        controller.view.addStudentToDom(element);
      });
    };

    /**
     * showConnectionError - display connection error message in student list table
     */
    this.showConnectionError = function () {

      $('.student-list tbody').empty();

      const $row = $('<tr>');
      const $cell = $('<td>').attr('colspan', '4');
      const $loader = $('<div>', {
        text: 'No data to display.'
      });

      $cell.append($loader);
      $row.append($cell);
      $('.student-list tbody').append($row);
    };

    /**
     * addStudentToDom - take in a student object, create html elements from the values and then append the elements
     * into the .student_list tbody
     * @param studentObj
     */
    this.addStudentToDom = function (studentObj) {
      const $button_delete = $('<button>', {
        text: 'Delete ',
        type: 'button',
        class: 'btn btn-danger delete-student',
        student_id: studentObj.id
      });

      const $row = $('<tr>');
      const $cell_name = $('<td>', {text: studentObj.name});
      const $cell_course = $('<td>', {text: studentObj.course});
      const $cell_grade = $('<td>', {text: studentObj.grade});
      const $cell_delete = $('<td>');

      $cell_delete.append($button_delete);
      $row.append($cell_name, $cell_course, $cell_grade, $cell_delete);
      $('.student-list').append($row);
    };
  }
}

/**
 * Listen for the document to load and reset the data to the initial state
 */
$(document).ready(function () {
  app = new App();
  app.init();
});
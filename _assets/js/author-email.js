'use strict';

var email = {};

function initEmailDialog(authorName, authorEmail) {
    email = {
        authorName: authorName,
        authorEmail: authorEmail,
        yourName: '',
        yourEmail: '',
        subject: '',
        message: ''
    };
    $('#custEmail_contact').text(email.authorName);
    $('#custEmail_emailTo').val(email.authorEmail);
    $('#custEmail_name').val(email.yourName);
    $('#custEmail_emailFrom').val(email.yourEmail);
    $('#custEmail_subject').val(email.subject);
    $('#custEmail_message').val(email.message);
    return true;
}

function sendEmail() {
    email.yourName = $('#custEmail_name').val();
    email.yourEmail = $('#custEmail_emailFrom').val();
    email.subject = $('#custEmail_subject').val();
    email.message = $('#custEmail_message').val();
    console.log(JSON.stringify(email, null, 2));
    // close the email dialog
    $('#custEmail_close').click();
    return false; // don't submit the form
}
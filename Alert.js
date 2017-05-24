'use strict';
const nodemailer = require('nodemailer');
var fs = require ('fs');
var data = fs.readFileSync('config.txt', "utf-8").toString().split('\n');
var emails = data[3].slice(13,data[3].length);
//console.log(emails);
var from = "nagyg@gain.nyme.hu";
var pass ='e765Hz7wd';
// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    port: 25,
    auth: {
        user: from,
        pass: pass
    },
    tls :{
        rejectUnauthorized : false
    }
});

// setup email data with unicode symbols
let mailOptions = {
    from: from, // sender address
    to: emails, // list of receivers
    subject: 'Le�llt a Symres adatgy�jt�s', // Subject line
    text: 'Hiba l�pett fel a Symres adatgy�jt�s m�k�d�s�ben', // plain text body
    html: '<b>Le�ll�s t�rt�nt a Symres adatgy�jt�ssel</b>' // html body
};

// send mail with defined transport object
exports.sendEmail = function(callback){transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
    return console.log(error);
}
    console.log('Message %s sent: %s', info.messageId, info.response);
});
}

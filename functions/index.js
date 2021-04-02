// configs:
// ticketmailer.sender = mail address
// ticketmailer.passwd = mail password
// ticketmailer.url = ticket url
// ticketmailer.title = title, ex: ('Formidable')

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
const inlineBase64 = require('nodemailer-plugin-inline-base64');
const qrCode = require('qrcode');
const { render } = require('./template');
admin.initializeApp();

/**
 * Here we're using Gmail to send
 */
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: functions.config().ticketmailer.sender,
        pass: functions.config().ticketmailer.passwd
    }
});

exports.ticketMailer = functions.https.onRequest((req, res) => {
    cors(req, res,  async () => {

        // getting dest email by body string
        const dest = req.body.dest;
        // get event ID
        const eventID = req.body.event;
        // get record ID
        const recordID = req.body.record;
        // get event name
        const eventName = req.body.eventName;

        // generate QR code
        const ticket = await qrCode.toDataURL(`${functions.config().ticketmailer.url}/verify/${eventID}/${recordID}`);

        const mailOptions = {
            from: `Formidable Registration System <${functions.config().ticketmailer.sender}>`,
            to: dest,
            bcc: [functions.config().ticketmailer.sender],
            subject: 'Event E-ticket', // email subject
            html: render(functions.config().ticketmailer.title, eventName, req.body.fields, ticket, functions.config().ticketmailer.url)
        };

        // encode inline base 64
        transporter.use('compile', inlineBase64({ cidPrefix: 'eticket_' }));

        // returning result
	functions.logger.log('sending mail...');
        return transporter.sendMail(mailOptions)
	    .then(data => {
	    	functions.logger.log('mail sent.');
		return res.send("mail sent.");
	    })
	    .catch(e => {
	    	functions.logger.warn('mail rejected: ' + e);
		return res.send("mail rejected.");
	    });
    });
});

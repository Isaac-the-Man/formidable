const render = (title, event, fields, ticket, url) => {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html
        PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title>E Ticket</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="padding: 0;margin: 0;" bgcolor="#f8f9fa">
<table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;font-family: Arial, sans-serif; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);">
    <tr>
        <td bgcolor="#343a40" align="center" style="padding: 40px 0 30px 0; color: white">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Pacific_American_School_Logo.jpg" height="150" alt="Logo" style="display: block;"/>
            <h1>${title} Registration System</h1>
        </td>
    </tr>
    <tr>
        <td bgcolor="white" style="padding: 40px 30px 40px 30px;">
            <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td>
                        <h3>Dear Guest:</h3>
                        You have successfully registered for the event ${event}. Below is your Registration
                        information and your E-Ticket.
                    </td>
                </tr>
                <tr>
                    <td style="padding: 18px 0 0 0;">
                        <h3>Registration info:</h3>
                        ${_formatFields(fields)}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 18px 0 0 0;">
                        <h3>E-Ticket:</h3>
                        Please presents this E-Ticket upon your arrival of the event for identity verification. We're looking forward to meet you!
                        <img src="${ticket}"
                             alt="E-Ticket"
                             style="width: 100%; margin-top: 8px"/>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td align="center" bgcolor="#343a40" style="padding: 30px 30px 30px 30px; color: white">
            <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center">
                        © 2020 Steven Wang | All Rights Reserved
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <a href="${url}"><font color="#ffffff">Home</font></a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
`
}

function _formatFields(fields) {
    let formatted = '<ul>';
    for (let item of fields) {
        formatted += '<li>' + item.title + ': ' + item.value + '</li>';
    }
    formatted += '</ul>';
    return formatted;
}

exports.render = render;

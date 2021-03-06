var fs = require("fs"),
    http = require('http'),
    MailListener = require("mail-listener2"),
    path = require("path"),
    qs = require('querystring'),
    url = require('url'),
    nodemailer = require("nodemailer");

var mailListener,
    keywords = [],
    parsedMails = [],
    SPLIT_KEYWORDS = ',',
    mimeTypes = {
        'html': 'text/html', 
        'png': 'image/png',
        'js': 'text/javascript', 
        'css': 'text/css'
    };

function processRequest(request, response) {
    var uri = url.parse(request.url).pathname;
    if (uri === '/submit') {
        defineSettings(request, response);					
    } else if (uri === '/') {
        if(mailListener){
            mailListener.stop();
        }
        serveFromDisk('index.html', response);
    } else {
        serveFromDisk(uri, response);
    }
}

function serveFromDisk(filename, response) {
    "use strict";
    var pathname;
    pathname = path.join(process.cwd(), filename);
    path.exists(pathname, function (exists) {
        var extension, mimeType, fileStream;
        if (exists) {
            extension = path.extname(pathname).substr(1);
            mimeType = mimeTypes[extension] || 'application/octet-stream';
            response.writeHead(200, {'Content-Type': mimeType});
            console.log('serving ' + filename + ' as ' + mimeType);

            fileStream = fs.createReadStream(pathname);
            fileStream.pipe(response);
        } else {
            console.log('does not exist: ' + pathname);
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('404 Not Found\n');
            response.end();
        }
    });
}

function defineSettings(request, response) {
    var postData = '';
    request.setEncoding('utf8');
    request.addListener('data', function (data) {
        postData += data;
    });
    request.addListener('end', function () {
        var json = qs.parse(postData);
        keywords = json.criteriaWords.split(SPLIT_KEYWORDS);
		
		initializeMailMonitor(response, json);		
    });
}

function initializeMailMonitor(response, options) {
    mailListener = new MailListener({
        username: options.getUsername,
        password: options.getPassword,
        host: options.getHost,
        port: options.getPort, // imap port
        secure: true, // use secure connection
        mailbox: "INBOX", // mailbox to monitor
        markSeen: false, // all fetched email willbe marked as seen and not fetched next time
        fetchUnreadOnStart: true // use it only if you want to get all unread email on lib start. Default is `false`
    });

	mailListener.start();	
	
    mailListener.on("server:connected", function() {
		console.log("imapConnected");		       
    });

    mailListener.on("mail", function(mail) {
        // do something with mail object including attachments
        if(parsedMails.indexOf(mail.messageId) === -1) {
            console.log("Received new email");
            parsedMails.push(mail.messageId);
            var percentage = percentageMatchesKeywords(mail);
            if(percentage >= options.criteriaPercentage) {
                console.log("This email match " + percentage + '% with the criteria.');
                sendNotification(response, options, percentage, mail.subject, mail.text);
            }
            else{
                console.log("This email match just " + percentage + '% with the criteria.');
            }
        }
    });
	
	mailListener.on("error", function(err){
		response.write("Error getting emails, please check the credentials");
		response.end();
	});
}

function percentageMatchesKeywords(data) {
    var countMatches = 0;
    keywords.forEach(function(element, index){
        var regex = new RegExp(element.trim(), 'gi');
        if((data.html && data.html.match(regex)) || (data.text && data.text.match(regex)) || (data.subject && data.subject.match(regex))){
            countMatches++;
        }
    });
    return countMatches * 100 / (keywords.length !== 0 ? keywords.length : 1);
}

function sendNotification(responseParent, options, percentage, subject, message){
    // TODO: Send an email when the email contain more than the percentage defined.
    var smtpTransport = nodemailer.createTransport("SMTP",{
        auth: {
            user: options.sendUsername,
            pass: options.sendPassword
        }
    });
    var mailOptions = {
        from: options.sendUsername,
        to: options.sendTo,
        subject: "Suspicious Email", // Subject line
        text: "Hello!!! This email has been forwarded to you because it has reached "+ percentage +"% of  suspicious words inside it; and the permitted percentage is " + options.criteriaPercentage +"%."+ 
				"Following you can see the subject and the message of the received email: " + 
				"Subject: "+ subject + 
				"Message: " + message,  // plaintext body
        html: "<p>Hello!!!</p>"+
				"<p>This email has been forwarded to you because it has reached "+ percentage.toFixed(2) +"% of  suspicious words inside it; and the permitted percentage is " + options.criteriaPercentage +"%. Following you can see the subject and the message of the received email: </p>" +
				"<p>Subject: "+ subject + "<BR> Message: "+ message +"</p>"// html body
    };

    smtpTransport.sendMail(mailOptions, function(error, response) {
        if(error) {
            responseParent.write("Error sending notification, please check the credentials");
			responseParent.end();
		}
        else {
            console.log("Sent the message.");
        }
        smtpTransport.close(); 
    });
}

//Initialize the server
http.createServer(processRequest).listen(8080);
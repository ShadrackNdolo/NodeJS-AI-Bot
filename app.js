var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function(session) {
    session.send("You said: %s", session.message.text);
});

var inMemoryStorage = new builder.MemoryBotStorage();

// This is a dinner reservation bot that uses a waterfall technique to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function(session) {
        session.send("Welcome to the deployment.");
        builder.Prompts.time(session, "Please provide the check-in and check-out date and time for this booking (e.g.: June 6th at 5pm/June 16th at 5pm)");
    },

    function(session, results) {
        session.dialogData.dietary = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "Any other special requirements for your arrival?");
    },

    function(session, results) {
        session.dialogData.special = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "Any special dietary requirements for your stay?");
    },

    function(session, results) {
        session.dialogData.food = results.response;
        builder.Prompts.text(session, "How many rooms would you like to book? (MAXIMUM 2 PER ROOM)");
    },

    function(session, results) {
        session.dialogData.partySize = results.response;
        builder.Prompts.text(session, "What name would this booking be under?");
    },

    function(session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. <br> Reservation details: 
        <br/>Reservation name: ${session.dialogData.reservationName} 
        <br/>Date/Time: ${session.dialogData.reservationDate}
        <br/>Rooms: ${session.dialogData.partySize} 
        <br/>Dietary needs: ${session.dialogData.food}`);
        session.endDialog();
    }

]).set('storage', inMemoryStorage); // Register in-memory storage
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

    //We are supposed to have the bot engage the conversation
    function(session) {
        session.send("Welcome to the Reata Apartments.");
        builder.Prompts.time(session, "Please provide the date and time for this booking (e.g.: June 6th at 5pm)");
    },

    //This should be a yes or no question (yes links to questions, no to buttons e.g. inquiries)
    function(session, results) {
        session.dialogData.special = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "Would you like to make a reservation?");
    },

    //This is still undefined in the display.
    function(session, results) {
        session.dialogData.checkout = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "What day and time would you like to check in?");
    },

    //This display checkout well.
    function(session, results) {
        session.dialogData.checkin = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "What day and time would you like to check out? (Type undecided if unknown)");
    },

    //This is a test question, could be replaced with any other-returns string
    function(session, results) {
        session.dialogData.lounge = results.response;
        builder.Prompts.text(session, "Would you like to enjoy some beverage(s) in the waiting lounge?");
    },

    //displays 
    function(session, results) {
        session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "Any special dietary requirements for your stay?");
    },

    //displays
    function(session, results) {
        session.dialogData.food = results.response;
        builder.Prompts.text(session, "How many rooms would you like to book? (MAXIMUM 2 PER ROOM)");
    },

    function(session, results) {
        session.dialogData.partySize = results.response;
        builder.Prompts.text(session, "What name would this booking be under?");
    },

    //beverage,check-in are undefined
    function(session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. <br> Reservation details: 
        <br/>Reservation name: ${session.dialogData.reservationName} 
        <br/>Date/Time: ${session.dialogData.special}
        <br/>Beverage: ${session.dialogData.drinks}
        <br/>Check-In: ${session.dialogData.checkout}
        <br/>Checkout: ${session.dialogData.lounge}
        <br/>Rooms: ${session.dialogData.partySize}
        <br/>Dietary needs: ${session.dialogData.food}`);
        session.endDialog();
    }

]).set('storage', inMemoryStorage); // Register in-memory storage
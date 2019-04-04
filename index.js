/**
 * A Bot for the App-Hack Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

var sched = [['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am', '11am: No Event Scheduled',
	      '12pm: No Event Scheduled',
	      '1pm: No Event Scheduled',
	      '2pm: No Event Scheduled',
	      '3pm: No Event Scheduled',
	      '4pm: No Event Scheduled',
	      "5pm: Visit the signin table and make sure you're registered!",
	      '6pm: Kickoff is starting!',
	      "7pm: Dinner! Woodlands BBQ, get it while it's hot, y'all",
	      '`8pm Workshops` \nRoom 309: "The Joy of Concurrency in Go" w/Andrew Thorp\n\nRoom 311: "How Fast Can You Add a Billion Numbers" w/Gurney Buchanan',
	      '`9pm Workshops` \nRoom 309: "Guessing Your Future and the soft Skills That Will Make You Successful" w/Scott Bradley\n\nRoom 310: "Turning User Stories into Products" w/Keith Pahl, Patrick Savago (_TMetrics_)\n\nRoom 311: "How Fast Can You Add a Billion Numbers" w/Gurney Buchanan',
	      '`10pm Workshops` \nRoom 309: "Kubernetes 101" w/Mike Wilson (_Canonical_)\n\nRoom 310: "Structured Experimentation - Practical Lessons from Winning the Zillow Prize" w/Jordan Meyer (_Rittman Mead_)',
	      "`11pm: \n`next event`\nRoomt 325: DnD 'n snacks!!!!"],

	     ["12am not-work-Shop \nRoom 325: take a break with snacks 'n DnD!",
	      '1am: Nothing scheduled, keep hackin',
	      '2am: Nothing scheduled, keep hackin',
	      '3am: Nothing scheduled, keep hackin',
	      '4am: Nothing scheduled, keep hackin',
	      '5am: Nothing scheduled, keep hackin',
	      '6am: Nothing scheduled, keep hackin (_breakfast soon!_)',
	      '7am: Breakfast!! _Cereal, bagels, fruit & more!_',
	      '8am: Nothing scheduled \n4 hours to go! keep hackin!',
	      '9am: 3 hours to go!! keep hackin!',
	      '10am: 2 hours to go!! keep hackin! (_Lunch by Jersey Mikes at 11am_)',
	      '11am: Come get Lunch from Jersey Mikes!\n\n...*tick*\n...\n...*tock*\n...\n...*tick*\n...\n...*tock*\nSubmit Your Code before 12pm: _https://www.google.com_', // needs real link
	      '12pm: All code should be submitted to devpost',
	      '1pm: ','2m','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm']];

var no = function() {
    var date = new Date();
    var day = date.getDay();
    var hour = date.getHours();
    console.log(date+"\n"+day+" : "+hour);
    var sc = sched[Number(day)-4][Number(hour)]; // change this to 5!!!! OMG
    console.log(sc);
    return sc;
};

var ne = function() {
    var date = new Date();
    var day = date.getDay();
    var hour = date.getHours();
    console.log(date+"\n"+day+" : "+hour);
    var sc = sched[Number(day)-4][Number(hour)+1]; // also change this to 5 you piece of shit!!!! // also this is broken, how the fuck?
};

var messages = {
    'help' : "Try some of these... \n\n`now`\tList current events\n`next`\tList next event on the schedule!\n`food`\tinfo about next meals and snacking options \n`riddle`\t?",
    'next' : 	      '11am: \n...*tick*\n...\n...*tock*\n...\n...*tick*\n...\n...*tock*\nSubmit Your Code before 12pm: _https://www.google.com_', // needs real link
    'now'  : "Get going! You're missing out!\n\n"+no(), //Event currently happening
    'meme' : "I'm not *that* kind of bot!",
    'stop' : "I can't be tamed",
    'bork' : "that's not useful", 
    'riddle' : "There's something I'm hiding, it seems I forgot. find it for me, and I'll thank you a lot",
    'hi' : 'No time for pleasantries! get hacking!!'
};

var m = Object.keys(messages);

controller.hears('help', 'direct_message,direct_mention,mention', function(bot, message) {
    // write function that dynamically processes messages and adds with formatting if second index not null!
    
});

controller.hears('01010000', 'direct_message', function(bot, message) {
    bot.say({
	text : "WINNER INFO:"+message,
	channel : 'UDNTUEHUH' // send me a text when someone wins!!
    });
});

controller.hears('assist', 'direct_message, direct_mention', function(bot, message) {
    bot.say({
	text : message,
	channel : 'UDNTUEHUH' // send me a text when someone needs help
    });
});

controller.on('direct_message,direct_mention,mention', function (bot, message) {
    console.log(message); // print json on server
    for (var i = 0; i < m.length; i++)
    {
	if (message.text.toLowerCase().includes(m[i]))
	{
	    bot.reply(message, messages[m[i]]);
	}
    }
});

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "Thanks for the warm welcome!");
});

	      /**
controller.hears('test', 'direct_message', function (bot, message) {
    bot.reply(message, '`9pm Workshops` \nRoom 309: "Guessing Your Future and the soft Skills the Will Make You Successful" w/Scott Bradley\n\nRoom 310: "Turning User Stories into Products" w/Keith Pahl, Patrick Savago (TMetrics)\n\nRoom 311: "How Fast Can You Add a Billion Numbers" w/Gurney Buchanan');
});

controller.hears('assist', 'direct_message', function(bot, message) {
    
});

controller.hears(['help','-h'], 'direct_message', function (bot, message) {
    bot.reply(message, messages['help']);
});

controller.hears(['hi', 'hello', 'sup'], 'direct_message', function (bot, message) {
    bot.reply(message, messages['hi']);
});

controller.hears('meme', 'direct_message', function (bot, message) {
    bot.reply(message, messages['meme']);
});

controller.hears('riddle', 'direct_message', function (bot, message) {
    bot.reply(message, messages['riddle']);
});

controller.hears('wifi', 'direct_message', function (bot, message) {
    bot.reply(message, messages['wifi']);
});

controller.hears('food', 'direct_message', function (bot, message) {
    console.log('sending image');
    bot.reply(message, {
	"attachments": [
            {
		"fallback": "Required plain-text summary of the attachment.",
		"text": "Optional text that appears within the attachment",
		"image_url": "http://my-website.com/path/to/image.jpg",
		"thumb_url": "http://example.com/path/to/thumb.png"
            }
	]
    });
    console.log('image sent');    
});

*/

/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});

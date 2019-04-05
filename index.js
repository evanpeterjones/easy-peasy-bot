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
// this is our cron

var value_found = false;

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
	      '`11pm Workshops` \nRoom 309: "Build and Deploy your First Website" w/Evan Jones'],

	     ["12am: `Not-Work-Shop` \nRoom 318: Take a break with snacks 'n DnD!\n&\n~~ Steve Jobs look-alike Contest!! ~~ ",
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
	      '1pm: Demo Fair Begins!!','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm']];

var now = function() {    
    var date = new Date();
    var day = date.getDay();
    var sc = '';
    var hour = date.getHours();
    var min = date.getMinutes();
    for (var i = 0; i < 24; i++)
    {
	if (i == Number(hour)){ sc+=(Number(hour)%12)+":"+min; }
	else { sc+='-'; }
    }
    sc+="\n";
    sc += sched[Number(day)-5][Number(hour)]; 
    return sc;
};

var next = function() {
    var date = new Date();
    var day = date.getDay();
    var sc = '';    
    var hour = date.getHours();
    var min = date.getMinutes();
    for (var i = 0; i < 24; i++)
    {
	if (i == Number(hour)){ sc+=(Number(hour)%12)+":"+min; }
	else { sc+='-'; }
    }
    sc+="\n";    
    var h = (Number(hour)+1);
    var d = Number(day)-5; 
    if (h >= 24) { h=0; d+=1; }
    sc += sched[d][h];
    return sc;
};

var getFood = function() {
    var food = "`Food 'n Snacks`\n\n";
    var date = new Date();
    var h = date.getHours();
    var d = date.getDay();
    if (d == 4 && h < 19) { food+='6:30pm: Dinner from Woodlands BBQ starts\n'; }
    else if (h < 7) { food+='7am: Breakfast starts\n_Cereal, Bagels, Fruit, and more_\n'; }
    else { food+='11am: Lunch, sandwhiches from Jersey Mikes\n'; }
    food+="\nCan't wait? Stop by the snack table to see what's available!";
    return food;
};

var messages = {
    '-h'      : [ '', 'Print this dialog'],
    '-next'   : [ next(), 'List next event on the schedule'],
    '-now'    : [ "Get going! You're missing out!\n\n"+now(),'List current events'],
    '-food'   : [ getFood(), 'upcoming meals and snack info'],
    '-assist' : [ '', "Include room# and the language you're using and we'll try and send someone to help you out" ],
    '-riddle' : [ "There's something I'm hiding, it seems I forgot. find it for me, and I'll thank you a lot", '?'],    

    // background commands
    'hello world' : 'omg, get on my level!',
    'hi' : 'No time for pleasantries! get hacking!!',
    'meme' : "I'm not *that* kind of bot!",
    'good bot': 'thanks!',
    'bad bot' : "I mean, I'm doing my best",
    'stop' : "I can't be tamed",
    'bork' : "that's not useful",
    'clue' : "I can't ruin the fun",
};

var m = Object.keys(messages);

controller.hears(['-help','-h'], 'direct_message,direct_mention,mention', function(bot, message) {
    var msg = 'You can PM or mention me with some of these...\n\n';
    for (var i = 0; i < m.length; i++)
    {
	// Only select the messages that have intended use! (are objects)
	if (typeof messages[m[i]] === 'object') {
	    msg += '`'+m[i]+'`\t'+messages[m[i]][1];
	} msg+='\n';
    }
    bot.reply(message, msg);
});

controller.hears('next-scheduled-thing', 'direct_message', function(bot, message) {
    bot.say({
    	text : next() + '\n\n',// + motiv(), //motivational quote
	channel : "GHP8MBZNZ" // this needs to be the general tab!
    });
});

controller.hears('assist', 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, "Sending someone your way!");
    bot.say({
	text : "`ASSISTANCE`\n>User: "+message.user+"\n>Message:"+message.text,
	channel : "GHP8MBZNZ"
    });
});

controller.hears('01010000', 'direct_message,direct_mention,mention', function(bot, message) {
    console.log("\n\n\n\nWINNER: "+message.user);
    if (!value_found)
    {
	value_found = true;
	bot.reply(message, "That's it! I needed to get my bits in order!! Find a director and collect your prize!");
	bot.say({	
	    text : "WINNER INFO : "+message.user,
	    channel : 'GHP8MBZNZ' // send me a message when someone wins!!
	});
    } else {
	bot.reply(message, "That's it! Someone already solved my riddle, but thank you for the help!");
    }
});

/*
controller.hears('assist', 'direct_message, direct_mention', function(bot, message) {
    bot.say({
	text : message.text,
	channel : 'UDNTUEHUH' // send me a message when someone needs help
    });
});
*/
controller.on('direct_message,direct_mention,mention', function (bot, message) {
    for (var i = 0; i < m.length; i++)
    {
	if (message.text.toLowerCase().includes(m[i]))
	{
	    if (typeof messages[m[i]] === 'object')
	    {
		bot.reply(message, messages[m[i]][0]);
	    } else {   bot.reply(message, messages[m[i]]); }
	}
    }
});

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "hello world!");
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

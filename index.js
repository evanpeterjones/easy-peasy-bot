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

var sched = [['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2m','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'],
	     ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2m','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm']];

var messages = {
    'help' : "Try some of these... \n\n`next`\tupcoming events \n`food`\tinfo about meals and snacking options \n`riddle`\t?",
    'hi' : 'No time for pleasantries! get hacking!!',
    'next' : "No Events Yet! Come back later", //getsched()
    'meme': "I'm not *that* kind of bot!", //randomMeme()
    'assist' : "We're sending someone your way ASAP!",
    'riddle' : "There's something I'm hiding, it's seems I forgot. find it for me, and I'll thank you a lot"
}

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears(['help','-h'], 'direct_message', function (bot, message) {
    bot.reply(message, messages['help']);
});

controller.hears(['hi', 'hello', 'sup'], 'direct_message', function (bot, message) {
    bot.reply(message, messages['hi']);
});

controller.hears('next', 'direct_message', function (bot, message) {
    var date = new Date();
    var day = date.getDay();
    var hour = date.getHours();
    console.log(date+"\n"+day+"\n"+hour);
    var sc = sched[Number(day)-4][Number(hour)];
    console.log(sc);
    bot.reply(message, sc);
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

/*
controller.on('direct_message,direct_mention', function (bot, message) {
    console.log(message.text);
    for (var i = 0; i < m.length; i++)
    {
	if (message.text.includes(m[i]))
	{
	    bot.reply(message, messages[m[i]]);
	}
    }
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

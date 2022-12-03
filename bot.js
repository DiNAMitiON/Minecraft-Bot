const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const dashboard = require('mineflayer-dashboard')
const inventoryViewer = require('mineflayer-web-inventory')
//const inventoryViewer = require('./inventory.js')

const config = require('./settings.json');
const express = require('express');

//const app = express();

const botCount = 0 //how many bots should join

console.log('Бот запускается...');//says in console that the bots are starting



//app.get('/', (req, res) => {
//  res.send('Бот запусчен')
//});

//app.listen(3000, () => {
//  console.log('Присоединение к серверу...');
//});

function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });
    inventoryViewer(bot)

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;

   bot.once('spawn', () => {
      console.log('\n \x1b[33m[BotLog]', config['bot-account']['username'], 'присоединился к серверу', '\x1b[0m');

      if (config.utils['auto-auth'].enabled) {
         console.log(' [INFO] Запускается auto-auth модуль');

         var password = config.utils['auto-auth'].password;
         setTimeout(() => {
            bot.chat('/spawn')
            bot.chat(`/register ${password} ${password}`);
            bot.chat(`/login ${password}`);
         }, 500);

         global.console.log(` [Auth] Аунтифекация прошла успешно.`);
      }



//    const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
//    bot.once('spawn', () => {
//      mineflayerViewer(bot, { port: 26600, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
//    })
    //dashboard
    bot.loadPlugin(require('mineflayer-dashboard')({
      chatPattern: /^» \w+? » /
    }))

    bot.on('chat', (username, message) => {
      if (config.utils['chat-log']) {
        bot.dashboard.log(` [${username}] ${message}`);
        
    bot.once('inject_allowed', () => {
      global.console.log = bot.dashboard.log
      global.console.error = bot.dashboard.log
      console.log = bot.dashboard.log
      console.error = bot.dashboard.log
    })


      }
   });
        
     let lastUser = null
    const whisper = new bot.dashboard.Mode('whisper', {
      bg: 'blue',
      interpreter (string) {
        let words = string.split(' ')
    
        // Check if we change receiver
        if (/ :to \w{3,16}$/.test(string)) {
          lastUser = words[words.length - 1]
          words = words.slice(0, -2)
        }
        
        // Log an error if there is no receiver
        if (lastUser === null) {
          return bot.dashboard.log("No receiver set, please add ' :to <user>' at the end of the message")
        }   
    
        // Send message
        const message = words.join(' ')
        bot.chat(`/msg ${lastUser} ${message}`)
        this.println(`to ${lastUser}: ${message}`)
      },
      async completer (string) {
        // We're using already well defined minecraft completer
        return bot.dashboard._minecraftCompleter(string)
      }
    })
    
    bot.dashboard.addMode(whisper)
    
    bot.on('whisper', (username, message) => {
      // Log a notification if not in whisper mode
      if (bot.dashboard.mode !== whisper) {
        return bot.dashboard.log(`You have a new message from ${username}`)
      } 
    
      // Display messages in the mode
      whisper.println(`${username}: ${message}`)
    })
    //dashboard end


      const pos = config.position;

      if (config.position.enabled) {
         bot.dashboard.log(
            ` \x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`
         );
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', true);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });



   bot.on('goal_reached', () => {
      bot.dashboard.log(
         ` \x1b[32m[BotLog] Bot arrived to target location. ${bot.entity.position}\x1b[0m`
      );
   });

   bot.on('death', () => {
      bot.dashboard.log(
         ` \x1b[33m[BotLog] Бот умер и возрадился ${bot.entity.position}`,
         '\x1b[0m'
      );
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) =>
      bot.dashboard.log(
         '\x1b[33m',
         ` [BotLog]` config['bot-account']['username'], `был выгнан с сервера. По причине: \n${reason}`,
         '\x1b[0m'
      )
   );
   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );
}

createBot();

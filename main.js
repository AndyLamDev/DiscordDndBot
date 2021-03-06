const { SSL_OP_NO_TLSv1 } = require('constants');
//https://abal.moe/Eris/
//https://discordjs.guide/creating-your-bot/#replying-to-messages
//https://discord.js.org/#/
//EVENT LISTINGS BELOW
//https://gist.github.com/koad/316b265a91d933fd1b62dddfcc3ff584#file-discordjs-cheatsheet-js-L22

const Discord = require('discord.js');
const result = require('dotenv').config();
const bot = new Discord.Client();
const token = process.env['DISCORD_BOT_TOKEN'];

var prefix = '-';
const https = require('https');
const mongoose = require('mongoose');
//mongoose.connect('')
//const request = require('request');

//Notes: Add Help command
//      MongoDB for npc Command
//      Host bot


bot.on('ready', () =>
{
    console.log('Anti-Ree Online!');

    //this will send a message in EVERY TEXT CHANNEL
    //seems that if you want a bot that only sends to a specific channel you NEED the ID of that channel

    //isnt this suppose to find ALL the text channels? why does it only send to one
    //.Find will stop at the first valid answer
    var FirstTxtchannel = bot.channels.cache.find(channel => channel.type === 'text');
    //FirstTxtchannel.send("BOT IS ONLINE");
})

bot.on('message', (msg) =>
{    
    var DiceTypes = {
        'd100': 100,
        'd20' : 20,
        'd12' : 12,
        'd10' : 10,
        'd8' : 8,
        'd6' : 6,
        'd4' : 4
    }

    var ValidDice = new Array('100','20', '12','10','8','6','4');

    //Dice Rolling msg    

    if(msg.content.includes(prefix+'rollADV'))
    {
        //ex -rollAD d20

        var RollMsg = msg.content.split(' ');

        if(DiceTypes[RollMsg[1]] !== undefined)
        {
            msg.reply(Roll_AdvDis(DiceTypes[RollMsg[1]]));
        }
        else
            msg.reply('Not a valid die!');
    }

    if(msg.content.includes(prefix+'roll'))
    {
        var RollMsg = msg.content.split(' ');
        if(RollMsg[0].length > 5)
            return;
        //ex -roll 2d4 or -roll 15d10
        var DiceSplit = RollMsg[1].split('d');

        //filter to get rid of empty [0] if split on 'd' and have nothing on the left
        DiceSplit = DiceSplit.filter((fil) =>
        {
            return fil.length > 0;
        });

        //if the split on the 'd' is only 1 number then it will roll multiple dice
        if(DiceSplit.length > 1)
        {            
            var RollTimes = DiceSplit[0];

            if(ValidDice.includes(DiceSplit[1]))
                msg.reply(Roll_Dice(RollTimes,DiceSplit[1]));
            else
                msg.reply('Not a valid Dice!');
        }
        else
        {
            if(isNaN(DiceTypes[RollMsg[1]]))            
                msg.reply('Not a valid Dice!');            
            else            
            //can prob just split on d and not have to look at the object and instead just look at the array
                msg.reply(Roll_Dice(1,DiceTypes[RollMsg[1]]));            
        }
    }

    //makes an api call
    if(msg.content.includes(prefix+'spell'))
    {
        //split the message to read the spell
        var commandIn= msg.content.split(' ');
        var SpellName = new Array();
        var SpellLevel = 0;

        //if the last element is anumber then update the spell level
        if(!isNaN(commandIn[commandIn.length-1]))
            SpellLevel = commandIn[commandIn.length-1];

        if(SpellLevel === 0)
            for(var i = 1; i < commandIn.length;i++)
            {
                SpellName.push(commandIn[i].toLowerCase());
            }
        else
            for(var i = 1; i < commandIn.length-1;i++)
            {
                SpellName.push(commandIn[i].toLowerCase());
            }       
            
        //console.log('https://www.dnd5eapi.co/api/spells/'+ SpellName.join('-') + '/');

        https.get('https://www.dnd5eapi.co/api/spells/'+ SpellName.join('-') + '/', (resp) =>
        {
            let data = '';
            
            resp.on('data', (chunk) =>
            {
                data += chunk;
            })

            resp.on('end', () =>
            {                
                var SpellIn = JSON.parse(data);

                //if the spell doesnt have a desc then the spell does not exists
                if(SpellIn.desc === undefined)
                {
                    msg.reply('not a real spell');
                    return;
                }
                else
                {
                    var SpellTest = new Spell(SpellIn);       

                    //if it has a damage prop then i have to test, if not then i can just output it               
                    if(SpellTest.hasOwnProperty('Damage_per_Level'))
                    {
                        msg.reply(SpellTest.Output(SpellTest.SpellLevel(SpellLevel)));
                    }
                    else
                        msg.reply(SpellTest.Output(true))
                }
            })
        }).on("error", (err) => {
            msg.reply("Error: " + err.message)
        })
    }

    if(msg.content === prefix+'help')
    {
        msg.reply('\r\nPREFIX - (Dash/Hyphen)'+ 
        '\r\n__**rollADV d[4,6,8,10,12,20]**__ will roll 2 dice of specified size and give both the Advantage roll and Disadvantage Roll\r\n'
        + '__**roll d[4,6,8,10,12,20]**__ will roll a single dice of specified size\r\n'
        + '__**roll #d[4,6,8,10,12,20]**__ will roll dice # number of times with a cap of 20 dice and display the total\r\n'
        + '__**spells [name of spell]**__ will display all the information about a specified spell (spaces work)\r\n'
        + '__**npc add**__ Not implemented yet');
    }
});

//function that will take in a number of die rolls, and the type of dice and roll that many times, if the amount of rolls
//is under 20 then it will display all the roll, else it will just display the total
function Roll_Dice(iNumTimes,iDiceType)
{        
    var Rolls = new Array();
    var Total = 0;

    //Roll for only a single die
    if(iNumTimes === 1)
    {
        //rolls a die of determined size
        var tempNum = Math.floor(Math.random() * Math.floor(iDiceType)) + 1;    
        return '\r\n**' + tempNum + '**';
    }

    for(var i = 0; i < iNumTimes; i++)
    {
        Rolls.push(Math.floor(Math.random() * Math.floor(iDiceType)) + 1);            
    }

    //what does this do???
    Total = Rolls.reduce((add,current) => (add+current));

    if(iNumTimes > 20)
        return '__**Total:**__ ' + Total;

    return '\r\n' + Rolls.join(',') + '\r\n __**Total:**__ ' + Total; 
}

function Roll_AdvDis(iDiceType)
{
    var Rolls = new Array();

    for(var i=0; i < 2; i++)
    {
        Rolls.push(Math.floor(Math.random() * Math.floor(iDiceType)) + 1);
    }

    var AdvObj = CompareValues(Rolls[0],Rolls[1]);

    return '\r\n' + Rolls.join(',') + '\r\n__**Advantage:**__ ' + AdvObj['Adv'] + ' \r\n__**Disadvantage:**__ ' + AdvObj['Dis'];
}

//function will compare the 2 rolls and return an object that will have the advantage and disadvantage
function CompareValues(roll1,roll2)
{
    var AdvDis = {};

    if(Math.floor(roll1) > Math.floor(roll2))
        AdvDis = 
        {
            'Adv': roll1,
            'Dis': roll2
        }
    else
        AdvDis =
        {
            'Adv': roll2,
            'Dis': roll1
        }

    return AdvDis;
}

//this event will run if someone enters/leaves a voice channel, as well as mute/deafen
bot.on('voiceStateUpdate',(oldmember,newmember) =>
{
    //console.log('Voice State Updated!' + oldmember.channel + " " + newmember.channel);

    //Will fire when someone joings a voice channel
    if(newmember.channel !== null && oldmember.channel === null)
    {
        var newMember = newmember.member.displayName;
        console.log(`${newMember} has joined ${newmember.channel.name}`);
    }

    if(newmember.channel === null && oldmember.channel !== null)
    {
        var oldMember = oldmember.member.displayName;
        console.log(`${oldMember} has left ${oldmember.channel.name}`);
    }
})

bot.on('channelUpdate', (t)=>
{
    
})

class Spell
{
    //Can I add another ctor that will take in spell and level then only have to
    constructor(SpellJSON)
    {
        //se
        this.JSON = SpellJSON;
        //console.log(this.JSON);

        this.Name = SpellJSON.name;
        this.Description = SpellJSON.desc;
        this.Casting_at_Higher_Levels = SpellJSON.higher_level;
        this.Range = SpellJSON.range;
        this.Material = SpellJSON.material;
        this.Duration = SpellJSON.duration;
        this.Concentration = SpellJSON.concentration;
        this.Casting_Time = SpellJSON.casting_time;
        this.Level = SpellJSON.level;
        

        //check to see if the spell does damage
        if(SpellJSON.hasOwnProperty('damage'))   
        {     
            this.Damage_At_Base_Level = this.JSON.damage.damage_at_slot_level[this.Level];
            this.Damage_Type = SpellJSON.damage.damage_type.name;            
            console.log('has damage');
        }

        this.School = SpellJSON.school.name;

        var ClassJson = SpellJSON.classes;

        this.Classes = '';
        ClassJson.forEach(Cls => {
            this.Classes += ' ' + Cls.name;
        });

        if(SpellJSON.hasOwnProperty('dc'))
        {
            this.DC_Type = SpellJSON.dc.dc_type.name;
            this.DC_Success = SpellJSON.dc.dc_success;
            this.DC_Description = SpellJSON.dc.desc;
        }
        if(SpellJSON.hasOwnProperty('area_of_effect'))
        {
            this.Area_of_Effect_Shape = SpellJSON.area_of_effect.type;
            this.Area_of_Effect_Size = SpellJSON.area_of_effect.size;
        }
    }
    //why is this not reading the input properly
    Output(Exists)
    {     
        if(!Exists)
        {
            return "Invaild Spell Level. Check the Player's Handbook!";
        }
        var msg = '\r\n\n';
        
        for(var propt in this)
        {
            if(propt !== "JSON" && this[propt] !== undefined)
                msg +=('__**' + propt + '**__' + ' : ' + this[propt]) + '\r\n\n';
        }
        return msg; 
    }
}

bot.login(token);
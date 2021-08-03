const web3 = require('./web3.js')
const utils = require('./utils.js')
const request = require('request')
const config = require('./config.json');

async function cron() {
    const prices = await priceTicker()
    console.log(prices)
    for(var i=0;i<config.users.length; i++){
        var messages = []
        var user = config.users[i]
        for(var j=0;j<user.addresses.length; j++){
            var address = user.addresses[j]
            var msgs = await check(user.rules, address.address, prices)
            if(msgs.length > 0) {
              messages.push(address.nickname)
              messages = messages.concat(msgs)
              messages.push("")
            }
        }
        console.log(messages)
        // TODO: Schedule telegram messages to send when stamina reaches minimum within hour
        // TODO: Perform fight transaction and just notify of results
        // sendMessage(messages, user.chat_id)
    }
}

function sendMessage(messages, chat_id) {
    const data = {
        "chat_id": chat_id,
        "parse_mode":"markdown",
        "text":messages.join("\n")
    }
    request.post({
        url: 'https://api.telegram.org/bot'+config.tg_bot_id+'/sendMessage',
        body: data,
        json: true
    }, function (error, response, body) {
        if (error){
          console.log(error.message)
        }
    });
}

async function check(rules, address, prices) {
    const charIds = await web3.getAccountCharacters(address)
    const weapIds = await web3.getAccountWeapons(address)

    var characters = []
    for(var i=0; i<charIds.length; i++) {
        const charId = charIds[i]
        const sta = await web3.getCharacterStamina(charId)
        const charData = utils.characterFromContract(charId, await web3.getCharacterData(charId))
        charData.stamina = sta
        characters.push(charData)
    }

    var weapons = []
    for(var i=0; i<weapIds.length; i++) {
        const weapId = weapIds[i]
        const weapData = utils.weaponFromContract(weapId, await web3.getWeaponData(weapId))
        weapons.push(weapData)
    }
    var messages = []
    for(var i=0; i<characters.length; i++) {
        const char = characters[i]
        if (char.stamina < rules.minstamina) continue
        const strongest = utils.getStrongestWeapon(char, weapons)
        const targets = await web3.characterTargets(char.id, strongest.id)
        const enemies = await utils.getEnemyDetails(targets)
        const staminaCost = Math.floor(char.stamina/40)
        var weakestEnemy = {"chance":rules.minchance, "index":-1}
        for (var k=0; k<enemies.length; k++){
            const enemy = enemies[k]
            const chance = utils.getWinChance(char, strongest, enemy.power, enemy.trait)

            if (chance > weakestEnemy.chance || (char.stamina >= rules.maxstamina && weakestEnemy.index == -1)) {
              enemy.chance = chance
              enemy.index = k
              weakestEnemy = enemy
            }
        }
        if(weakestEnemy.index > -1) {
          // TODO: Warn if next milestone is achievable with lower stamina fight
          const reward = fromEther(await web3.usdToSkill(web3.web3.utils.toBN(prices.fightGasOffset + ((prices.fightBaseline * Math.sqrt(parseInt(weakestEnemy.power) / 1000)) * staminaCost))));
          const revenue = reward*prices.skillPrice
          const profit = revenue-prices.cost
         
          console.log("character level: " + char.level + ". Spending " + staminaCost*40 + " sta")
          console.log("reward: " + parseFloat(reward).toFixed(7) + " skill")
          console.log("profit: $" + profit.toFixed(2))
          if(profit>0) {
            messages.push(
              "• " + (i+1) 
              + " ("+ char.stamina + " sta): *$" + profit.toFixed(2)+"*\n  • *"
              + (weakestEnemy.chance*100).toFixed(0)
              + "%* vs " +(weakestEnemy.index+1) 
              + " (" + weakestEnemy.power + " " +utils.traitNumberToName(weakestEnemy.trait)+")"
            )
          }
        }
    }
    return messages
}

function fromEther (value) {
  return web3.web3.utils.fromWei(BigInt(value).toString(), 'ether')
}

async function priceTicker() {
  const prices = {}
  prices.fightGasOffset = Number(await web3.fetchFightGasOffset())
  prices.fightBaseline = Number(await web3.fetchFightBaseline())
  return new Promise(function (resolve, reject) {
    request.get({
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades,binancecoin,tether&vs_currencies=usd',
    }, function (error, response, body) {
        if (error){
          reject(error)
        }
        const data = JSON.parse(body)
        prices.skillPrice = data.cryptoblades['usd']
        prices.cost = data.binancecoin['usd']*0.000703
        resolve(prices)
    })
  })
  
}

cron()
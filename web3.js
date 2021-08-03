const Web3 = require('web3');

const web3 = new Web3(process.env.PUBLIC_NODE || 'https://bsc-dataseed1.ninicoin.io/');
const pweb3 = new Web3(process.env.PRIVATE_NODE || 'https://bsc-dataseed1.binance.org/');

const conStakingReward = require('./IStakingRewards.json');
const conStakingToken = require('./IERC20.json');
const conCryptoBlades = require('./CryptoBlades.json');
const conCharacters = require('./Characters.json');
const conWeapons = require('./Weapons.json');
const conOracle = require('./BasicPriceOracle.json');

const stakingRewardAddress = '0xd6b2D8f59Bf30cfE7009fB4fC00a7b13Ca836A2c';
const stakingTokenAddress = '0x154a9f9cbd3449ad22fdae23044319d6ef2a1fab';
const mainAddress = '0x39Bea96e13453Ed52A734B6ACEeD4c41F57B2271';
const charAddress = '0xc6f252c2cdd4087e30608a35c022ce490b58179b';
const weapAddress = '0x7e091b0a220356b157131c831258a9c98ac8031a';
const oracleAddress = '0x1cbfa0ec28da66896946474b2a93856eb725fbba';
const defaultAddress = '0x0000000000000000000000000000000000000000';

const isAddress = address => web3.utils.isAddress(address);
const getBNBBalance = async address => web3.eth.getBalance(address);

// STAKING
const StakingReward = new web3.eth.Contract(conStakingReward, stakingRewardAddress);
const StakingToken = new web3.eth.Contract(conStakingToken, stakingTokenAddress);

const getStakedBalance = async address => StakingToken.methods.balanceOf(address).call({ from: defaultAddress });
const getStakedRewards = async address => StakingReward.methods.balanceOf(address).call({ from: defaultAddress });
const getStakedTimeLeft = async address => StakingReward.methods.getStakeUnlockTimeLeft().call({ from: address });

// MAIN CONTRACTS
const CryptoBlades = new pweb3.eth.Contract(conCryptoBlades, mainAddress);
const Characters = new pweb3.eth.Contract(conCharacters, charAddress);
const Weapons = new pweb3.eth.Contract(conWeapons, weapAddress);

const getAccountCharacters = async address => CryptoBlades.methods.getMyCharacters().call({ from: address });
const getAccountWeapons = async address => CryptoBlades.methods.getMyWeapons().call({ from: address });

const getAccountSkillReward = async address => CryptoBlades.methods.getTokenRewards().call({ from: address });
const getIngameSkill = async address => CryptoBlades.methods.inGameOnlyFunds(address).call({ from: address });

const getCharacterExp = async charId => CryptoBlades.methods.getXpRewards(`${charId}`).call({ from: defaultAddress });
const characterTargets = async (charId, weapId) => CryptoBlades.methods.getTargets(charId, weapId).call({ from: defaultAddress });

const getCharacterStamina = async charId => Characters.methods.getStaminaPoints(`${charId}`).call({ from: defaultAddress });
const getCharacterData = async charId => Characters.methods.get(`${charId}`).call({ from: defaultAddress });
const getWeaponData = async weapId => Weapons.methods.get(`${weapId}`).call({ from: defaultAddress });

const fight = async (charId, weapId, targetId, fightMultiplier, address) => CryptoBlades.methods
  .fight(charId, weapId, targetId, fightMultiplier).call({from: address})


// Oracle Price
const Oracle = new web3.eth.Contract(conOracle, oracleAddress);
const getOraclePrice = async () => Oracle.methods.currentPrice().call({ from: defaultAddress });

// from library.js
// usd conversion is done on app.js
const fetchFightGasOffset = async () => CryptoBlades.methods.fightRewardGasOffset().call({ from: defaultAddress });
const fetchFightBaseline = async () => CryptoBlades.methods.fightRewardBaseline().call({ from: defaultAddress });
// const fetchFightGasOffset = async () => CryptoBlades.methods.usdToSkill(await CryptoBlades.methods.fightRewardGasOffset().call({ from: defaultAddress })).call({ from: defaultAddress });
// const fetchFightBaseline = async () => CryptoBlades.methods.usdToSkill(await CryptoBlades.methods.fightRewardBaseline().call({ from: defaultAddress })).call({ from: defaultAddress });

const decodeAbi = async (types, data) => web3.eth.abi.decodeParameters(types, data);
const getPasLogs = async options => web3.eth.abi.getPasLogs(options);

const usdToSkill = async value => CryptoBlades.methods.usdToSkill(value).call({ from: defaultAddress });


module.exports = {
  web3,
  isAddress,
  StakingReward,
  StakingToken,
  CryptoBlades,
  Characters,
  Weapons,
  getStakedBalance,
  getStakedRewards,
  getStakedTimeLeft,
  getAccountCharacters,
  getAccountWeapons,
  getAccountSkillReward,
  getIngameSkill,
  getCharacterExp,
  getCharacterStamina,
  getBNBBalance,
  getCharacterData,
  getWeaponData,
  characterTargets,
  getOraclePrice,
  fetchFightGasOffset,
  fetchFightBaseline,
  decodeAbi,
  getPasLogs,
  usdToSkill,
};

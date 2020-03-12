import React from 'react';
import { Text, Platform } from 'react-native';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { Toast } from '@ant-design/react-native';
import * as bitcoin from 'bitcoinjs-lib';
import rsk3 from 'rsk3';
import { randomBytes } from 'react-native-randombytes';
import moment from 'moment';
// import moment locales
import 'moment/locale/zh-cn';
import 'moment/locale/es';
import 'moment/locale/pt';
import config from '../../config';
import store from './storage';
import I18n from './i18n';

const { consts: { currencies } } = config;
const DEFAULT_CURRENCY_SYMBOL = currencies[0].symbol;

// more than 24 hours is considered a day
// https://momentjs.com/docs/#/customization/relative-time/
moment.relativeTimeThreshold('h', 24);

// Extract currency symbols from config
// Generate {USD: '$', RMB: '￥', ARS: 'ARS$', KRW: '₩', JPY: '￥', GBP: '£',}
const currencySymbols = _.reduce(currencies, (obj, row) => {
  const settingsObj = obj;
  settingsObj[row.name] = row.symbol;
  return settingsObj;
}, {});

const common = {
  currentNavigation: null,
  isIphoneX() {
    // TODO
    // return DeviceInfo.getModel().toLowerCase().indexOf('iphone x') >= 0
    return false;
  },
  btcToSatoshiHex(amount) {
    const result = `0x${new BigNumber(amount).times('1e8').decimalPlaces(0).toString(16)}`;
    return result;
  },
  satoshiToBtc(satoshi) {
    const result = new BigNumber(satoshi).div('1e8');
    return result;
  },
  rskCoinToWeiHex(amount) {
    const result = `0x${this.rskCoinToWei(amount).decimalPlaces(0).toString(16)}`;
    return result;
  },
  rskCoinToWei(amount) {
    const result = new BigNumber(amount).times('1e18');
    return result;
  },
  weiToCoin(wei) {
    const result = new BigNumber(wei).div('1e18');
    return result;
  },
  Toast(text, type, onClose, duration, mask) {
    const last = duration > 0 ? duration : 1.5;
    if (type === 'success') {
      Toast.success(text, last, onClose, mask);
    } else if (type === 'fail') {
      Toast.fail(text, last, onClose, mask);
    } else { // none
      Toast.info(text, last, onClose, mask);
    }
  },
  /**
   * convertUnitToCoinAmount, if unitNumber is nil, return null
   * @param {*} symbol
   * @param {*} unitNumber
   */
  convertUnitToCoinAmount(symbol, unitNumber) {
    if (_.isNil(unitNumber)) {
      return null;
    }
    const amount = symbol === 'BTC' ? common.satoshiToBtc(unitNumber) : common.weiToCoin(unitNumber);
    return amount;
  },

  /**
   * getAmountBigNumber, diffrent symbol apply diffrent decimalPlaces, subfix 0 will be omitted.
   * The result will be round down by default.
   * @param {string} symbol
   * @param {BigNumber | number | string} amount
   * @returns number
   */
  getAmountBigNumber(symbol, amount, decimalPlaces) {
    // const decimalPlaces = config.symbolDecimalPlaces[symbol];
    if (_.isNull(amount) || !(typeof amount === 'number' || typeof amount === 'string' || BigNumber.isBigNumber(amount))) {
      return null;
    }
    let amountBigNumber = amount;
    if (typeof amount === 'number' || typeof amount === 'string') {
      amountBigNumber = new BigNumber(amount);
    }
    return amountBigNumber.decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN);
  },

  /**
   * getBalanceString, diffrent symbol apply diffrent decimalPlaces, subfix 0 will be omitted.
   * The balance will be round down by default.
   * @param {string} symbol
   * @param {BigNumber | number | string} balance
   */
  getBalanceString(symbol, balance, decimalPlaces) {
    const amountBigNumber = this.getAmountBigNumber(symbol, balance, decimalPlaces);
    return amountBigNumber.toFixed();
  },

  /**
   * formatAmount, diffrent symbol apply diffrent decimalPlaces, subfix 0 will be omitted.
   * The result will be round down by default.
   * @param {string} symbol
   * @param {BigNumber | number | string} amount
   * @returns number
   */
  formatAmount(symbol, amount, decimalPlaces) {
    const amountBigNumber = this.getAmountBigNumber(symbol, amount, decimalPlaces);
    return amountBigNumber.toNumber();
  },

  /**
   * getAssetValueString, value apply default decimalPlaces, subfix 0 will be omitted.
   * @param {BigNumber | number | string} value
   */
  getAssetValueString(value) {
    if (!_.isNull(value)) {
      let valueBigNumber = value;
      if (typeof value === 'number' || typeof value === 'string') {
        valueBigNumber = new BigNumber(value);
      }
      return valueBigNumber.decimalPlaces(config.assetValueDecimalPlaces).toFixed();
    }
    return null;
  },
  getCoinPrice(symbol, currency, prices) {
    for (let i = 0; i < prices.length; i += 1) {
      const priceRow = prices[i];
      if (symbol === priceRow.symbol) {
        const price = priceRow.price[currency];
        return price;
      }
    }
    return null;
  },
  getCoinValue(amount, symbol, currency, prices) {
    if (!amount || !prices || prices.length === 0) {
      return null;
    }
    try {
      const price = this.getCoinPrice(symbol, currency, prices);
      if (!price) {
        return null;
      }
      const amountBigNumber = new BigNumber(amount);
      const value = amountBigNumber.times(price);
      return value;
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  getCurrencyNames() {
    return _.map(currencies, (item) => item.name);
  },

  /**
   * Get currency symbol string for example '$' based on currency
  * @param {string} currency currency string such as 'USD'
  */
  getCurrencySymbol(currency) {
    if (currencySymbols[currency]) {
      return currencySymbols[currency];
    }

    return DEFAULT_CURRENCY_SYMBOL;
  },

  async updateInAppPasscode(input) {
    let passcode = null;
    if (input) {
      await store.setPasscode(input);
      // eslint-disable-next-line no-multi-assign
      global.passcode = passcode = input;
    } else {
      // eslint-disable-next-line no-multi-assign
      global.passcode = passcode = await store.getPasscode();
    }
    return passcode;
  },

  /**
   * getTransactionUrl, returns transaction url
   * @param {*} symbol, coin symbol
   * @param {*} type, coin network type
   * @param {*} hash, transaction hash
   */
  getTransactionUrl(symbol, type, hash) {
    let url = symbol === 'BTC' ? config.transactionUrls[symbol][type] : config.transactionUrls.RBTC[type];
    // BTC has / suffix, RSK does not.
    // For example:
    // BTC, https://live.blockcypher.com/btc-testnet/tx/5c1d076fd99db0313722afdfc4d16221c4f3429cdad2410f6056f5357f569533/
    // RSK, https://explorer.rsk.co/tx/0x1b62fedd34d6d27955997be55703285d004b77d38f345ed0d99f291fcef64358
    url = `${url}/${hash}${symbol === 'BTC' ? '/' : ''}`;
    return url;
  },

  /**
   * getLatestBlockHeight, return latestBlockHeight. If it's not found, return null.
   * @param {array} latestBlockHeights
   * @param {string} chain
   * @param {string} type, network type
   */
  getLatestBlockHeight(latestBlockHeights, chain, type) {
    const latestBlockHeight = _.find(latestBlockHeights, { chain, type });
    if (latestBlockHeight && latestBlockHeight.blockHeight) {
      return latestBlockHeight.blockHeight;
    }
    return null;
  },

  /**
   * Validate btc address
   * @param {string} address
   * @param {string} type, MainTest or Testnet
   */
  isBtcAddress(address, type) {
    // https://github.com/bitcoinjs/bitcoinjs-lib/issues/890
    // https://bitcoin.stackexchange.com/questions/52740/how-do-you-validate-a-bitcoin-address-using-bitcoinjs-library-in-javascript
    try {
      let network = null;
      if (type === 'Testnet') {
        network = bitcoin.networks.testnet;
      }
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Validate wallet address
   * @param {string} address
   * @param {string} symbol, BTC, RBTC, RIF
   * @param {string} type, MainTest or Testnet
   * @param {string} networkId
   */
  isWalletAddress(address, symbol, type, networkId) {
    let isAdress = false;
    if (symbol === 'BTC') {
      isAdress = this.isBtcAddress(address, type);
    } else {
      isAdress = rsk3.utils.isAddress(address, networkId);
    }
    return isAdress;
  },

  /**
   * Validate amount
   * @param {string} str
   */
  isAmount(str) {
    const regex = /^\d*\.{0,1}\d+$/g;
    return regex.test(str);
  },

  /**
   * Set default font family for android, solve cut-off problem for some android device
   * Oppo A77 - Some texts gets cut-off
   * solution: Set app default font family, instead of system font
   * see https://github.com/facebook/react-native/issues/15114
   */
  setDefaultFontFamily() {
    if (Platform.OS !== 'android') {
      return;
    }

    const oldRender = Text.render;
    Text.render = (...args) => {
      const origin = oldRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: [{ fontFamily: config.defaultFontFamily }, origin.props.style],
      });
    };
  },

  /**
   * getSymbolFullName
   * @param {string} symbol, BTC, RBTC, RIF
   * @param {string} type, MainTest or Testnet
   */
  getSymbolFullName(symbol, type) {
    return `${type === 'Testnet' ? 'Test' : ''} ${symbol}`;
  },

  getRandom(count) {
    return new Promise((resolve, reject) => randomBytes(count, (err, bytes) => {
      if (err) reject(err);
      else resolve(bytes);
    }));
  },

  /**
   * Add or update DOC price
   * DOC value is 1 dollar, convert to other currencies by btc price
   * Returns new prices array
   * @param {*} prices
   */
  addOrUpdateDOCPrice(prices) {
    const newPrice = _.clone(prices);
    const btcPrice = _.find(newPrice, { symbol: 'BTC' });
    const usdPrice = parseFloat(btcPrice.price.USD);
    const btcPriceKeys = _.keys(btcPrice.price);
    let docPrice = _.find(newPrice, { symbol: 'DOC' });
    if (_.isUndefined(docPrice)) {
      docPrice = { symbol: 'DOC' };
      newPrice.push(docPrice);
    }
    if (_.isUndefined(docPrice.price)) {
      docPrice.price = {};
    }
    docPrice.price.USD = '1';
    _.each(btcPriceKeys, (key) => {
      if (key !== 'USD') {
        const currency = parseFloat(btcPrice.price[key]);
        docPrice.price[key] = (currency / usdPrice).toString();
      }
    });
    return newPrice;
  },

  setLanguage(language) {
    I18n.locale = language;
  },

  setMomentLocale(locale) {
    const newLocale = locale === 'zh' ? 'zh-cn' : locale;
    moment.locale(newLocale);
  },

  // make promise cancelable
  // https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
  makeCancelable(promise) {
    let hasCanceled = false;

    const wrappedPromise = new Promise((resolve, reject) => {
      promise.then(
        (val) => (hasCanceled ? reject(new Error('err.canceled')) : resolve(val)),
        (error) => (hasCanceled ? reject(new Error('err.canceled')) : reject(error)),
      );
    });

    return {
      promise: wrappedPromise,
      cancel() {
        hasCanceled = true;
      },
    };
  },
};

export default common;

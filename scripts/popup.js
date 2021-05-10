var _STILL_ON_LOOP = true;
var _TAB_ID = null;
var _TRADE_HISTORY = [];

var _CURRENT_PRICE = 0;
var _CURRENT_ASSET = 0;

var _TOTAL_BUY = 0;
var _TOTAL_SELL = 0;

var _TRIVIA_DATA = {
  _temp_buy: 0,
  _temp_ah_buy: 0, //all time high
  tp: 0,
  cl: 0
}

function resetVariable() {
  _TRADE_HISTORY = [];

  _CURRENT_PRICE = 0;
  _CURRENT_ASSET = 0;

  _TOTAL_BUY = 0;
  _TOTAL_SELL = 0;

  _TRIVIA_DATA = {
    _temp_buy: 0,
    _temp_ah_buy: 0, //all time high
    tp: 0,
    cl: 0
  }
}

function toNumber(angka) {
  var result = "";
  
  if(!angka) return 0;

  result = angka.replace(/[Rp\s.]+/g, "")
  result = parseInt(result);

  return result;
  
}

function convertToRupiah(angka)
{
	var rupiah = '';		
	var angkarev = angka.toString().split('').reverse().join('');
	for(var i = 0; i < angkarev.length; i++) if(i%3 == 0) rupiah += angkarev.substr(i,3)+'.';
	return 'Rp. '+rupiah.split('',rupiah.length-1).reverse().join('');
}

function setCurrentAsset() {
  return new Promise((resolve, reject)=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: "get_current_asset"}, function(response) {
        $('#total-asset').text(`Rp ${response.value}`);
      });
    });
  })
}

function getLastTrade() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "get_last_trade"}, function(response) {
      _TRADE_HISTORY = response.value;
      hitungCoinAsset();
    });
  });
}


function setProfileName() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: "get_profile_name"}, function(response) {
        $('.greeting-name').text(response.value);
      });
    });
}

function setCoinCode() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "get_coin_code"}, function(response) {
      var coin_code = response.value
      var [code_only, ] = coin_code.split('/');
      $('#coin-code').text(coin_code);
      $('.coin-logo').text(code_only);
    });
  });
}

function getCurrentPrice() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "get_current_price"}, function(response) {
      _CURRENT_PRICE = toNumber(response.value)
    });
  });
}

function hitungCoinAsset() {
  var total_coin_buy = 0;
  var total_coin_sell = 0;
  for(const trade of _TRADE_HISTORY) {
      if(trade.type == 'buy') {
        total_coin_buy += parseFloat(trade.coin.replace(',','.'))
        console.log('buy', parseInt( toNumber(trade.price) ))
        _TOTAL_BUY += parseInt( toNumber(trade.price) )
        getTradingTrivia( trade.type, toNumber(trade.coin_price) );
      } else {
        total_coin_sell += parseFloat(trade.coin.replace(',','.'))
        _TOTAL_SELL += parseInt( toNumber(trade.price) )
        getTradingTrivia( trade.type, toNumber(trade.coin_price));
      }
  }

  _CURRENT_ASSET = Math.ceil((total_coin_buy - total_coin_sell) * _CURRENT_PRICE);
  $('#est-coin-asset').text( convertToRupiah(_CURRENT_ASSET) );
  $('#total-buy').text( convertToRupiah(_TOTAL_BUY));
  $('#total-sell').text( convertToRupiah(_TOTAL_SELL));
  lifeTimeProfit()
  $('#tp').html(`${_TRIVIA_DATA.tp}<span>x</span>`)
  $('#cl').html(`${_TRIVIA_DATA.cl}<span>x</span>`)
}

function lifeTimeProfit() {
  console.log(_TOTAL_SELL, _TOTAL_BUY, _CURRENT_ASSET)
  _LIFETIME_PROFIT = (_TOTAL_SELL + _CURRENT_ASSET ) - _TOTAL_BUY
  $('#life-time-profit').text( convertToRupiah(_LIFETIME_PROFIT));
}

function gotoTradingMarket(){
  chrome.tabs.update(_TAB_ID, {url: 'https://indodax.com/market/BTCIDR'}, tab => {
    jQuery('.section').addClass('d-none')
    jQuery('#pre-loader').removeClass('d-none')

    setTimeout(()=>init(), 2000);
  })
}

function getTradingTrivia(type, coin_price) {
  // first time buy
  if(_TRIVIA_DATA._temp_ah_buy === 0 ) {
    _TRIVIA_DATA._temp_ah_buy = coin_price
    _TRIVIA_DATA._temp_buy = coin_price
    return false;
  }

  
  if( type == 'buy') _TRIVIA_DATA._temp_buy = coin_price
  if( type == 'buy' && coin_price > _TRIVIA_DATA._temp_ah_buy ) _TRIVIA_DATA._temp_ah_buy = coin_price
  
  if( type == 'sell' && coin_price > _TRIVIA_DATA._temp_ah_buy ) {
    console.log('tp', coin_price, _TRIVIA_DATA._temp_ah_buy)
    _TRIVIA_DATA.tp += 1
  }
  if( type == 'sell' && coin_price < _TRIVIA_DATA._temp_ah_buy ) {
    console.log('cl', coin_price, _TRIVIA_DATA._temp_ah_buy)
    _TRIVIA_DATA.cl += 1
  } 

  if( type == 'sell' && coin_price < _TRIVIA_DATA._temp_buy ) {
    console.log('half take profit', coin_price, _TRIVIA_DATA._temp_ah_buy)
    _TRIVIA_DATA.tp += 1
  } 
}

function buildData() {
  resetVariable();
  jQuery('body').removeClass('error')
  jQuery('header').removeClass('d-none')
  jQuery('.section').addClass('d-none')
  jQuery('.account-result').removeClass('d-none')

  setProfileName();
  setCoinCode();
  setCurrentAsset();
  getCurrentPrice();
  getLastTrade();
}
function init() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "init_extension"}, function(response) {
      if(response.type == 'loaded') buildData()
    });

    var pace_loaded_counter = 0;
    chrome.runtime.onMessage.addListener(function(data){
      console.log('loading')
      if( data.type == 'pace-done' ) pace_loaded_counter += 1;
      if( pace_loaded_counter > 3 ) {
        console.log('done loaded')
        buildData()
        pace_loaded_counter = 0;
      }
    })
  })
}

document.addEventListener("DOMContentLoaded", () => {

    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {

      _TAB_ID = tabs[0].id;
      let url = tabs[0].url;
    

      if(url.indexOf('https://indodax.com/market/') < 0) {
        jQuery('header').addClass('d-none')
        jQuery('.section').addClass('d-none')
        jQuery('.page-error').removeClass('d-none')
        jQuery('body').addClass('error')
        document.getElementById("goto-market").addEventListener("click", gotoTradingMarket);
      } else {
        init()
      }
    })
    
})

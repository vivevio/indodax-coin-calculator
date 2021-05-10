function getCurrentAsset() {
  return document.querySelector(".total_assets_val_main_menu").innerText;
}

function getProfileName() {
  return document.querySelector(".displayed_profile h4.media-heading").innerText;
}

function getCoinCode() {
    var title = document.querySelector("title").innerText;
    var [code,] = title.split(" to ");
    return code;
}

function getLastTrade() {
    var table_row = document.querySelectorAll('#my_last_trades tr');
    var data = [];
    table_row.forEach(function(row, index) {
        var data_type = row.querySelector('td:nth-of-type(2)');
        if(data_type != null ) {
            data_type = data_type.innerText.indexOf('Beli') >= 0 ? 'buy' : 'sell';
            data.push({
                type: data_type,
                coin_price: row.querySelector('td:nth-of-type(3)').innerText,
                coin: row.querySelector('td:nth-of-type(4)').innerText,
                price: row.querySelector('td:nth-of-type(5)').innerText
            })
        }
    })

    return data.reverse();
}

function getCurrentPrice() {
    return document.querySelector('.market-price-box strong').innerText;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
        case "get_current_price": {
            var data_send = { type: "current_price", value: getCurrentPrice() };
            sendResponse(data_send);
            break;
        }

        case "get_current_asset": {
            var data_send = { type: "current_asset", value: getCurrentAsset() };
            sendResponse(data_send);
            break;
        }

        case "get_profile_name": {
            var data_send = { type: "profile_name", value: getProfileName() };
            sendResponse(data_send);
            break;
        }

        case "get_coin_code": {
            var data_send = { type: "coin_code", value: getCoinCode() };
            sendResponse(data_send);
            break;
        }

        case "get_last_trade": {
            var data_send = { type: "last_trade", value: getLastTrade() };
            sendResponse(data_send);
            break;
        }

        case "init_extension": {
            if( window.location.href.indexOf('https://indodax.com/market/') >= 0 ) {
                var target = document.querySelector('body');
                if( target.classList.value.indexOf('pace-done') ) {
                    sendResponse({type:'loaded'});
                } else {
                    sendResponse({type:'pace-running'});
                }

            }
        }
    }
});

if( window.location.href.indexOf('https://indodax.com/market/') >= 0 ) {
    var target = document.querySelector('body');

    // create an observer instance
    var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
            if(mutation && mutation.target.classList.value.indexOf('pace-done')) {
                chrome.runtime.sendMessage({type:'pace-done'});
            }
        });    
    });

    // configuration of the observer:
    var config = { attributes: true, childList: true, characterData: true };

    // pass in the target node, as well as the observer options
    observer.observe(target, config);
}
    

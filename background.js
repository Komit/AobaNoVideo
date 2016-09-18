var myCapture = null;
var captureTab = null;

var funcCallback = function(tabId) {
	if (myCapture) {
		switch(myCapture.getStatus(tabId)) {
			case 0:
				chrome.browserAction.setIcon({ tabId: tabId, path: 'icon/icon38.png' });
				break;
			case 1:
				chrome.browserAction.setIcon({ tabId: tabId, path: 'icon/icon_stop.png' });
				break;
			default:
		};
	};
};

// インストール時orアップデート時
chrome.runtime.onInstalled.addListener(function() {
	// 拡張自体のインストール/アップデートの場合にお知らせを表示
	var manifest = chrome.runtime.getManifest();
    chrome.storage.local.get({ version: '0.0.0' }, function(items) {
    	if (items.version !== manifest.version) chrome.tabs.create({ url: chrome.extension.getURL('update.html') });
		chrome.storage.local.set({ version: manifest.version });
    });
});

// ブラウザアクション
chrome.browserAction.onClicked.addListener(function(tab) {
	if (tab.id === captureTab) {
		switch(myCapture.getStatus(tab.id)) {
			case 0:
				myCapture.startCapture();
				break;
			case 1:
				myCapture.stopCapture();
				break;
			default:
				break;
		};
	} else if (captureTab === null || myCapture.getStatus(captureTab) === 0) {
		myCapture = new MyCapture(tab.id, function() { funcCallback(tab.id) });
		myCapture.startCapture();
		captureTab = tab.id;
	};
});


// ボタンの有効無効切り替え
var toggleButton = function(tabId, flag) {
    if (flag === true) {
        chrome.browserAction.enable(tabId)
    } else {
        chrome.browserAction.disable(tabId)
    };
}

// タブのステータス変更イベント処理
var chageTabStatus = function(tabId) {
    chrome.tabs.get(tabId, function(tab) {
    	if (tab) {
        	if (tab.status === 'complete' && tab.url.indexOf('www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/') >= 0) {
	        	toggleButton(tabId, (captureTab === null || captureTab === tab.id || myCapture.getStatus(captureTab) === 0) ? true : false);
        	} else {
	        	toggleButton(tabId, false);
    		};
    	};
    });
};

// タブ変更関連のイベント設定
chrome.tabs.onCreated.addListener(function(tab) {
    chageTabStatus(tab.id);
});
chrome.tabs.onUpdated.addListener(function(tabId) {
    chageTabStatus(tabId);
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chageTabStatus(activeInfo.tabId);
});

// Window変更関連のインベント設定
chrome.tabs.onRemoved.addListener(function(tabId) {
	if (myCapture && myCapture.getStatus(tabId) !== null) {
		myCapture = null;
		captureTab = null;
	};
});

toggleButton(null, false);

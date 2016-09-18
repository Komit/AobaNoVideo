// String拡張
String.prototype.padding = function(num) {
    return (new Array(num + 1).join('0') + this).slice(-1 * num);
};

// Date拡張
Date.prototype.getFormatString = function(str) {
    if (!str) str = 'YYYY/MM/DD hh:mm:ss';

    str = str.replace(/YYYY/, this.getFullYear().toString().padding(4));
    str = str.replace(/YY/,   this.getYear().toString().padding(2));
    str = str.replace(/MM/,   (this.getMonth() + 1).toString().padding(2));
    str = str.replace(/DD/,   this.getDate().toString().padding(2));
    str = str.replace(/hh/,   this.getHours().toString().padding(2));
    str = str.replace(/mm/,   this.getMinutes().toString().padding(2));
    str = str.replace(/ss/,   this.getSeconds().toString().padding(2));

    return str;
};

var MyCapture = function MyCapture(tabId, callback) {
	var self = this;

	// 固定値
	self._limitTime = 30;

	// 設定値
	self._status = 0;
	self._tabId = tabId;
	self._stream = null;
	self._audio = null;
	self._recoder = null;
	self._chunk = [];
	self._callback = callback || null;
	self._originalWidth = null;
	self._originalHeight = null;

	// オプション設定変更イベントリスナー
	chrome.storage.onChanged.addListener(function(changes, namespace) {
	    chrome.storage.sync.get(cnst.setting, function(items) {
        	self._setting = items;
    	});
	});

	// アラームイベント発生
	chrome.alarms.onAlarm.addListener(function(alarm) {
		if (alarm) {
			switch(alarm.name) {
				case 'timerLimit':
					self.stopCapture();
					break;
				case 'startRecoding':
					self._startRecoding();
					break;
			};
		};
	});

	// コールバック実施
	self._callback(self._status);
};

// データ取得イベント
MyCapture.prototype._eventDataAvailable = function(event) {
	var self = this;

	if (event.data.size > 0) self._chunk.push(event.data);

	return self;
};

// キャプチャ開始
MyCapture.prototype.startCapture = function() {
	var self = this;

	// チャンクを初期化
	self._chunk = [];

	// オプション設定読み込み
	chrome.storage.sync.get(cnst.setting, function(items) {
    	self._setting = items;

		// キャプチャ設定
   		var constraints = {
        	audio: true,
       		video: true,
       		videoConstraints: {
   	    		mandatory: {
	       	    	chromeMediaSource: 'tab',
           			minWidth: 800,
           			minHeight: 480,
           			maxWidth: 800,
           			maxHeight: 480,
           			minFrameRate: parseInt(self._setting.frameRate, 10),
           			maxFrameRate: parseInt(self._setting.frameRate, 10)
       			}
			}
   		};

		// キャプチャ開始
    	chrome.tabCapture.capture(constraints, function (stream) {
			// ストリームを保存
			self._stream = stream;

    		// ストリームの音を再生
			self._audio = new Audio();
			self._audio.srcObject = self._stream;
			self._audio.play();

			// Windowサイズ変更
    		chrome.tabs.get(self._tabId, function(tab) {
				// 位置情報設定
				chrome.tabs.executeScript(tab.id, { code : 'document.getElementById("ntg-recommend").style.display = "none"'});
				chrome.tabs.executeScript(tab.id, { code : 'document.body.style.position = "fixed"'});
				chrome.tabs.executeScript(tab.id, { code : 'document.body.style.top = "-77px"'});
				chrome.tabs.executeScript(tab.id, { code : 'document.body.style.left = "-110px"'});

				chrome.windows.get(tab.windowId, function(win) {
					// 現在のサイズを保存
					self._originalWidth = win.width;
					self._originalHeight = win.height;

					// サイズ変更
					chrome.windows.update(win.id, {
						width: win.width + 800 - tab.width,
						height: win.height + 480 - tab.height,
					}, function() {
						// 0.05秒遅延させる。
						chrome.alarms.create('startRecoding', { when : Date.now() + 0.05 * 1000 });
					});
				});
			});
   		})
   	});

	return self;
};

// キャプチャ停止
MyCapture.prototype._startRecoding = function() {
	var self = this;

	// MediaRecorderでの録画を開始
	self._recoder = new MediaRecorder(self._stream, { mimeType: 'video/webm;codecs=vp9' });
	self._recoder.ondataavailable = function(event) { self._eventDataAvailable(event) };
	self._recoder.start();

	// 取得期限タイマーを設定
	chrome.alarms.create('timerLimit', { delayInMinutes: self._limitTime });

	// ステータスを変更
	self._status = 1;

	// コールバック実施
	self._callback();

	return self;
};

// キャプチャ停止
MyCapture.prototype.stopCapture = function() {
	var self = this;

	// 取得期限タイマーを停止
	chrome.alarms.clear('timerLimit');

	// 録画を停止
	self._recoder.stop();
	self._recoder = null;

	// Windowサイズ変更
    chrome.tabs.get(self._tabId, function(tab) {
		// 位置情報設定
		chrome.tabs.executeScript(tab.id, { code : 'document.getElementById("ntg-recommend").style.display = "initial"'});
		chrome.tabs.executeScript(tab.id, { code : 'document.body.style.position = "initial"'});
		chrome.tabs.executeScript(tab.id, { code : 'document.body.style.top = "initial"'});
		chrome.tabs.executeScript(tab.id, { code : 'document.body.style.left = "initial"'});

		chrome.windows.get(tab.windowId, function(win) {
			chrome.windows.update(win.id, {
				// 元のサイズに変更
				width: self._originalWidth,
				height: self._originalHeight,
			});
		});
	});

	// 一旦保存表示を停止
	chrome.downloads.setShelfEnabled(true);

	// 取得データを保存
	var blob = new Blob(self._chunk, { type: 'video/webm' });
	var url = URL.createObjectURL(blob);
	chrome.downloads.download({
		url: url,
		saveAs: true,
		filename: new Date().getFormatString(self._setting.defaultFileName) + '.webm',
	}, function(dId) {
		// 保存表示を復活
		chrome.downloads.setShelfEnabled(false);

		// オブジェクトURLを削除
		window.URL.revokeObjectURL(url);
	});

	// チャンクを初期化
	self._chunk = [];

	// 音声を停止
	self._audio = null;

	// MediaStreamを破棄
	self._stream.getAudioTracks()[0].stop();
	self._stream.getVideoTracks()[0].stop();
	self._stream = null;

	// ステータスを変更
	self._status = 0;

	// コールバック実施
	self._callback();

	return self;
};

// ステータス取得
MyCapture.prototype.getStatus = function(tabId) {
	var self = this;

	return (self._tabId === tabId) ? self._status : null;
};

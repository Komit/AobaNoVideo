$(function(){
    var varlink = new Varlink('form', { default_select: 0 });

    chrome.storage.sync.get(cnst.setting, function(items) {
        varlink.set(items);
    });

    $('#save').on('click', function() {
        var data = varlink.get();
        chrome.storage.sync.set(data);
        window.close();
        return false;
    });
});

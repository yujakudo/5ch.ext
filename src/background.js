
//	clear pageInfo
chrome.storage.local.set({
	pageInfo: {},
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.query=="get tabid") {
        sendResponse({tabid: sender.tab.id});
    }
});
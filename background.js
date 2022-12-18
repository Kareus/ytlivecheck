var handle_list = Array();
var notified = Array();
var autoRemove_seconds = 0;
var initialized = false;

function saveSettings() {
  chrome.storage.local.set({"channels" : handle_list});
  chrome.storage.local.set({"autoRemove" : autoRemove_seconds});
  chrome.storage.local.set({"notified" : notified})
}

function loadSettings() {
  chrome.storage.local.get("channels").then((result) => {
    handle_list = result["channels"];
    if (handle_list == undefined)
    handle_list = [];

    console.log("successfully loaded: ", handle_list);
  });

  chrome.storage.local.get("autoRemove").then((result) => {
    autoRemove_seconds = result["autoRemove"];
    if (autoRemove_seconds == undefined)
      autoRemove_seconds = 0;
    console.log("auto remove after: ", autoRemove_seconds, " seconds. (only positive value works)");
  });

  chrome.storage.local.get("notified").then((result) => {
    var lives = result["notified"];
    if (lives == undefined) return;
    
    notified = Array();

    for (var id of lives)
    {
      fetch('https://www.youtube.com/watch?v=' + id, {
        method: "GET",
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Accept-Language': 'en-US, en;q=0.5',
      }}).then((response) => response.text())
      .then((data) => {
        var isLiveNow = data.split('"isLiveNow":')[1].split('"')[0];
        if (isLiveNow)
          notified.push(id);
      });
    }

    console.log("previously notified list: ", notified);
  });

  if (initialized == false)
  {
    //TODO: temporary delay for interval after complete load.
    setTimeout(() => {
      chrome.alarms.create("livecheck", {
        delayInMinutes: 0,
        periodInMinutes: 1
      });
    }, 1000);

    initialized = true;
  }
}

async function findLiveStream(handle, cb) {
  fetch('https://www.youtube.com/' + handle + "/streams", {
    method: "GET",
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Accept-Language': 'en-US, en;q=0.5',
  }}).then((response) => response.text())
  .then((data) => {
    var channelName = data.split('channelId')[1].split('title')[1].split('"')[2];
    var icon = data.split('avatar')[1].split('url')[1].split('"')[2];
    var arr = data.split('?v=');
    var idList = [];

    for (var i = 0; i < arr.length; i++)
    {
      var isLive = arr[i].indexOf('"style":"LIVE"') >= 0;
      var id = arr[i].split("videoId")[1].split('"')[2];
      if (isLive)
        idList.push(id);
    }

    liveCallback(handle, idList, channelName, icon);
  });
}

function liveCallback(handle, idList, channelName, icon) {
    if (idList.length == 0)
        return;

    var notify = false;

    for (var id of idList)
    {
      if (notified.includes(id))
        continue;

      notify = true;
      notified.push(id);
    }

    if (notify)
    {
      //TODO: ui
      //TODO: notification inside the chrome?

      //You should enable chrome background mode for popup banners and sounds.
      chrome.notifications.clear(handle);
      chrome.notifications.create(handle, {
        type: 'basic',
        iconUrl: icon,
        eventTime: Date.now(),
        title: 'Youtube Live Notification',
        message: 'Youtube Channel ' + channelName + " is on live now.",
        priority: 1,
        requireInteraction: true,
      }, function (id) {
        if (autoRemove_seconds != undefined && autoRemove_seconds > 0)
        {
          setTimeout(() => { chrome.notifications.clear(handle);}, autoRemove_seconds * 1000);
        }
      });
    }
}

chrome.notifications.onClicked.addListener(function(id) {
  chrome.tabs.create({
    url: 'https://www.youtube.com/' + id
  });
  chrome.notifications.clear(id);
});

chrome.notifications.onClosed.addListener(function(id, byUser) {
  chrome.notifications.clear(id);
});

function checkLive() {
    var length = handle_list.length;

    for (var i = 0; i < length; i++) {
        var handle = handle_list[i];
        findLiveStream(handle, liveCallback);
    }

    var new_notified = [];
    if (notified.length >= 100) {
      for (var id of notified)
      {
        fetch('https://www.youtube.com/watch?v=' + id, {
          method: "GET",
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Accept-Language': 'en-US, en;q=0.5',
        }}).then((response) => response.text())
        .then((data) => {
          var isLiveNow = data.split('"isLiveNow":')[1].split('"')[0];
          if (isLiveNow)
            new_notified.push(id);
        });
      }

      notified = new_notified;
      saveSettings();
    }
}

function refresh(renotify = false) {
  if (renotify == true)
    notified = [];

  chrome.alarms.clear("livecheck");
  chrome.alarms.create("livecheck", {
    delayInMinutes: 0,
    periodInMinutes: 5
  });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == "livecheck")
  {
    checkLive();
    if (handle_list.length > 0)
      saveSettings();
  }
});

chrome.runtime.onStartup.addListener(function() {
    setTimeout(() => {
      if (handle_list == undefined || handle_list.length == 0)
        loadSettings();
        
      checkLive();
    }, 3000);
});

chrome.tabs.onCreated.addListener(function(id) {
  if (handle_list == undefined || handle_list.length == 0)
    loadSettings();
    checkLive();
});

loadSettings();
/////
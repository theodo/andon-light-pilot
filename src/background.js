chrome.app.runtime.onLaunched.addListener(function() {
  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      chrome.hid.getDevices({}, (devs) => {
        console.log(devs);
        sendResponse({devs});
      });
      return true;
  });
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 800,
      'height': 500
    }
  });
});

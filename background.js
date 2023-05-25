// Listen to the most recent tab and see if it's a Youtube video page.
// If it is, send a message to the content script.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url && tab.url.match("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];

    // ? is the first character of the query string, & is the separator between query parameters
    // & split returned an error because &s are only present in playlists. Might add a check for this.
    const urlParameters = new URLSearchParams(queryParameters);
    console.log(urlParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      // new video event
      videoId: urlParameters.get("v"),
      // The part after the ?v= in the URL
      // We can write anything we want here, but we're using the videoId to make it easier to find the video in the DOM
      // random: "random" would work too, the content script will have access to this message
    });
  }
});

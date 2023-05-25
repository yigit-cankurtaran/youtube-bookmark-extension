(() => {
  let youtubeLeftControls, youtubePlayer;
  // one is for accessing the player, the other is for accessing the controls
  // we need to listen to the background script to know when to start
  let currentVideo = "";
  let currentVideoBookmarks = [];

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    // obj is the message we sent from the background script
    // sender is the tab that sent the message
    // response is the function we can use to send a response back to the background script

    // destructuring the values we need from the message
    const { type, value, videoId } = obj;
    // all of these are in the background script
    // we destructured those to separate variables so we can use them more easily

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
      // if the type is PLAY, we set the current time of the player to the value we got from the message
      // the message's time is the bookmark's time
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter(
        (b) => b.time != value
        // this was the buggy part, !== doesn't work, we need to use !=
      );
      // we filter the bookmarks to remove the one we want to delete
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });
      // we set the bookmarks in the storage to the new bookmarks

      response(currentVideoBookmarks);
    }
  });

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        // obj is the object we get from the storage
        // we get the desc and time from the object
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        // if obj[currentVideo] exists, we parse it, else we return an empty array
      });
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];
    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark timestamp";

      youtubeLeftControls =
        document.getElementsByClassName("ytp-left-controls")[0];
      youtubePlayer = document.getElementsByClassName("video-stream")[0];

      youtubeLeftControls.appendChild(bookmarkBtn);

      // adding event listener to the bookmark button
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks = await fetchBookmarks();
    console.log(newBookmark);
    // returns Object { time: 0, desc: "Bookmark at 00:00:00" }, success

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
      ),
    });
  };

  newVideoLoaded();
  // Calling this function everytime a youtube video is loaded, so that the bookmark button is added to the page
  // Else it will disappear when the page is refreshed
  // Not so efficient, but it works, we already have a check anyway
})();

const getTime = (time) => {
  var date = new Date(0);
  date.setSeconds(time);

  return date.toISOString().substr(11, 8);
};

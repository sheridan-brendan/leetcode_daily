console.log("in background.js");

function onCreated(tab) {
  console.log(`Created new tab: ${tab.id}`);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

let creating = browser.tabs.create({
    url: "https://leetcode.com/problemset/all/",
});
creating.then(onCreated, onError);

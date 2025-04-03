const DEBUG = false;

if(DEBUG) {
    console.log(`Started background.js for leetcode_daily`);
}

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql'
const DAILY_CODING_CHALLENGE_QUERY = `
query questionOfToday {
	activeDailyCodingChallengeQuestion {
		date
		userStatus
		link
	}
}`

const fetchDailyCodingChallenge = async () => {
    if(DEBUG) {
        console.log(`Fetching daily coding challenge from LeetCode API.`)
    }

    const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
    }
    try {
        const response = await fetch(LEETCODE_API_ENDPOINT, init)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json()
    } catch(error) {
        console.error("fetchDailyCodingChallenge error:", error);
        return null;
    }

}


//does nothing if question is marked finished by leetcode
const openDailyCodingChallenge = async () => {
    function onCreated(tab) {
        if(DEBUG) {
            console.log(`Created new tab: ${tab.id}`);
        }
    }
    
    function onError(error) {
        console.error(`Error: ${error}`);
    }
    //TODO: consider verifying date to handle delay on leetcode-side
    const question = await fetchDailyCodingChallenge();
    if (question === null) {
        console.error("question data was null");
        return;
    }
    const questionInfo = question.data.activeDailyCodingChallengeQuestion
    const questionLink = `https://leetcode.com${questionInfo.link}`
    const questionUserStatus = questionInfo.userStatus
    if(DEBUG) {    
        console.log(`${questionLink}, ${questionUserStatus}`);
    }
    if (!(`${questionUserStatus}` === `Finish`)) {
        let creating = browser.tabs.create({
            url: `${questionLink}`,
        });
        creating.then(onCreated, onError);
    }
}

function handleAlarm(alarmInfo) {
    const name = alarmInfo.name;
    if (name === `newDaily`) {
        if(DEBUG){
            console.log(`caught newDaily alarm, opening challenge`);
        }
        openDailyCodingChallenge();
        checkAlarm();
    } else {
        console.error(`unknown alarm: ${name}`);
    }
}

function checkAlarm() {
    browser.alarms.get("newDaily", (alarm) => {
        //no existing alarm, create a new one
        if (!alarm) {
            const now = Date.now();
    
            const nextMidnightUTC = new Date(now);
            nextMidnightUTC.setUTCHours(0, 1, 0, 0);
            nextMidnightUTC.setUTCDate(nextMidnightUTC.getUTCDate() + 1);
            const msUntilMidnightUTC = nextMidnightUTC - now;
    
            
            //Set alarm to UTC midnight (when leetcode updates) + 1m
            browser.alarms.create("newDaily", {
                when: Date.now() + msUntilMidnightUTC,
            })
            if(DEBUG){
                console.log(`new leetcode alarm set for ${msUntilMidnightUTC}ms from now`);
            }
        } else {
            if(DEBUG){
                console.log(`leetcode alarm already set`);
            }
        }
    })
}

function handleStartup() {
    checkAlarm();
    openDailyCodingChallenge();
}

function handleInstalled(details) {
    console.log(details.reason);
    checkAlarm();
    openDailyCodingChallenge();
}

browser.alarms.onAlarm.addListener(handleAlarm);
browser.runtime.onStartup.addListener(handleStartup);
browser.runtime.onInstalled.addListener(handleInstalled);

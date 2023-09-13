//console.log(`Satrted background.js`);

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql'
const DAILY_CODING_CHALLENGE_QUERY = `
query questionOfToday {
	activeDailyCodingChallengeQuestion {
		date
		userStatus
		link
		question {
			acRate
			difficulty
			freqBar
			frontendQuestionId: questionFrontendId
			isFavor
			paidOnly: isPaidOnly
			status
			title
			titleSlug
			hasVideoSolution
			hasSolution
			topicTags {
				name
				id
				slug
			}
		}
	}
}`

const fetchDailyCodingChallenge = async () => {
    console.log(`Fetching daily coding challenge from LeetCode API.`)

    const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: DAILY_CODING_CHALLENGE_QUERY }),
    }

    const response = await fetch(LEETCODE_API_ENDPOINT, init)
    //console.log(`Received response.`)
    return response.json()
}


//does nothing if question is marked finished by leetcode
const openDailyCodingChallenge = async () => {
    function onCreated(tab) {
      console.log(`Created new tab: ${tab.id}`);
    }
    
    function onError(error) {
      console.log(`Error: ${error}`);
    }
    const question = await fetchDailyCodingChallenge();
    const questionInfo = question.data.activeDailyCodingChallengeQuestion
    const questionLink = `https://leetcode.com${questionInfo.link}`
    const questionUserStatus = questionInfo.userStatus
    console.log(`${questionLink}, ${questionUserStatus}`);
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
        console.log(`caught newDaily alarm, opening challenge`);
        openDailyCodingChallenge();
    } else {
        console.log(`unknown alarm: ${name}`);
    }
}

browser.alarms.onAlarm.addListener(handleAlarm);


openDailyCodingChallenge();

browser.alarms.get("newDaily", (alarm) => {
    //no existing alarm, create a new one
    if (!alarm) {
        const now = Date.now();

        const nextMidnightUTC = new Date(now);
        nextMidnightUTC.setUTCHours(0, 1, 0, 0);
        nextMidnightUTC.setUTCDate(nextMidnightUTC.getUTCDate() + 1);
        const msUntilMidnightUTC = nextMidnightUTC - now;

        
        //Set alarm to UTC midnight (when leetcode updates) + 1m
        //use 1day period for subsequent releases
        browser.alarms.create("newDaily", {
            when: Date.now() + msUntilMidnightUTC,
            periodInMinutes: 24 * 60
        })
        console.log(`new daily alarm set for ${msUntilMidnightUTC}ms from now`);
    }
})


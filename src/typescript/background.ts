
interface response {
  response: {
    numFound: number;
    start: number
    docs: {
      averageratingscore_rf: number;
      pk_id: number;
      schoolid_s: string;
      teacherfirstname_t: string;
      teacherlastname_t: string;
      total_number_of_ratings_i: number;
    }[];
  }
}

// IDEA: Potentially expand this later to include short blurbs like the first review, etc.

interface givenCache {
  profRatings: profRatingsCache;
}
interface profRatingsCache {
  profFullname: {
    rating: string;
    rmpLink: string;
    creationTime: number;
  }
}

interface profRating {
  rating: string;
  rmpLink: string;
};

async function fetchAndSendData(requestsList: [string, string][], tabId: number) {
  // Get the cached prof names and fill in the cache where needed
  chrome.storage.local.get(['profRatings'], (async ({profRatings}: givenCache) => {
    // Get ratings for each request, either from the cache or a new request.
    const cachedProfRatings: profRatingsCache | {} = profRatings || {};
    const profRatingsList: profRating[] = [];

    for (const request of requestsList) {
      const [fullName, rmpLink] = request;
      if (fullName === 'Staff') {
        // Skip 'Staff', as that's just the placeholder name.
        profRatingsList.push({
          rating: "?",
          rmpLink: ''
        });
      } else if (cachedProfRatings[fullName]) {
        // TODO: Implement cache expiration
        
        console.log(`Getting ${fullName} from cache`);
        profRatingsList.push(cachedProfRatings[fullName]);
      } else {
        try {
          console.log(`Getting ${fullName} from RMP...`);
          const resp: any = await fetch(rmpLink);
          const data: response = await resp.json();
          const currRating: profRating = {
            rating: data.response.docs[0].averageratingscore_rf.toString(),
            rmpLink: `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${data.response.docs[0].pk_id}`
          };

          console.log('Success');
          cachedProfRatings[fullName] = currRating;
          profRatingsList.push(currRating);
        } catch(err) {
          console.log(`Failed to get ${fullName} from RMP`);
          console.error(err);
          profRatingsList.push({
            rating: "Unknown",
            rmpLink: ''
          });
        }
      }
    }

    chrome.storage.local.set({profRatings: cachedProfRatings});
    chrome.tabs.sendMessage(tabId, profRatingsList);
  }));
}

const onMessage = ({requestsList}, sender): void => {
  fetchAndSendData(requestsList, sender.tab.id);
};

chrome.runtime.onMessage.addListener(onMessage);

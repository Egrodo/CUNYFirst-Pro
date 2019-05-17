type response = {
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

type profRatingsCache = {
  profFullname: {
    profId: string;
    rating: string;
    rmpLink: string;
    creationTime: number;
  }
}

type profRating = {
  profId: string;
  rating: string;
  rmpLink: string;
};

const fetchRMPData = async(fullName, schoolId): Promise<any> => {
  try {
    console.log(`Getting ${fullName} from RMP...`);
    const url = `https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&q=${fullName}+AND+schoolid_s%3A${schoolId}&defType=edismax&qf=teacherfirstname_t\%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=20&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s`
    const resp: any = await fetch(url);
    const data: response = await resp.json();

    if (!data.response.docs.length) throw new Error(`No professors found for the name ${fullName}, setting as unknown.`);
    const currRating: profRating = {
      profId: data.response.docs[0].pk_id.toString(),
      rating: data.response.docs[0].averageratingscore_rf.toString(),
      rmpLink: `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${data.response.docs[0].pk_id}`
    };

    console.log('Success');
    return currRating;
  } catch(err) {
    console.log(err);
    return {
      profId: '',
      rating: 'Unknown',
      rmpLink: ''
    };
  }
};

async function fetchAndSendProfList(requestsList: [string, string][], tabId: number) {
  // Get the cached prof names and fill in the cache where needed.
  chrome.storage.local.get(['cachedProfRatings'], (async ({cachedProfRatings}: { cachedProfRatings: profRatingsCache }) => {
    // Get ratings for each request, either from the cache or a new request.
    const newCachedProfRatings: profRatingsCache | {} = cachedProfRatings || {};

    // Build a new one-to-one list of ratings based on the requestsList and cachedProfRatings.
    const newRatingsList: profRating[] = [];

    for (const request of requestsList) {
      const [fullName, schoolId] = request;

      if (fullName === 'Staff') {
        // Skip 'Staff', as that's just the placeholder name.
        newRatingsList.push({
          profId: '',
          rating: "Unknown",
          rmpLink: ''
        });
      } else if (newCachedProfRatings[fullName]) {
        console.log(`Getting ${fullName} from cache`);
        
        // If the cache is older than 2 months, refresh it.
        if (Date.now() - newCachedProfRatings[fullName].creationTime > 5184000) {
          console.log('Cache needs refreshing');

          const currRating = await fetchRMPData(fullName, schoolId);
          if (!currRating) throw new Error("Invalid return but didn't err?");
          newCachedProfRatings[fullName] = {...currRating, creationTime: Date.now()};
          newRatingsList.push(currRating);
        } else newRatingsList.push(newCachedProfRatings[fullName]);
      } else {
        // Get new data from RMP.
        const currRating = await fetchRMPData(fullName, schoolId);
        if (!currRating) throw new Error("Invalid return but didn't err?");
        newCachedProfRatings[fullName] = {...currRating, creationTime: Date.now()};
        newRatingsList.push(currRating);
      }
    }

    chrome.storage.local.set({cachedProfRatings: newCachedProfRatings});
    chrome.tabs.sendMessage(tabId, newRatingsList);
  }));
}

const onMessage = ({requestsList}, sender): void => {
  fetchAndSendProfList(requestsList, sender.tab.id);
};

chrome.runtime.onMessage.addListener(onMessage);

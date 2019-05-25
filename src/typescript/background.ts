type response = {
  response: {
    numFound: number;
    start: number;
    docs: {
      averageratingscore_rf: number;
      pk_id: number;
      schoolid_s: string;
      teacherfirstname_t: string;
      teacherlastname_t: string;
      total_number_of_ratings_i: number;
    }[];
  };
};

type profRatingsCache = {
  profFullname: {
    profId: string;
    rating: string;
    rmpLink: string;
    creationTime: number;
  };
};

type ratingsRequest = {
  schoolId: string;
  profNames: string[];
};

type profRating = {
  profId: string;
  rating: string;
};

type profReview = {
  quality: 'awesome' | 'good' | 'average' | 'poor' | 'awful';
  rClass: string;
  rComments: string;
  rOverallString: string;
  rEasyString: string;
  rWouldTakeAgain: 'Yes' | 'No';
  teacherRatingTags: string[];
};

type messagePackage = {
  type: 'getRatingsList' | 'getProfReviews';
  data: {
    ratingsRequest?: ratingsRequest;
    profId?: string;
  };
};

const fetchProfRatings = async (fullName: string, schoolId: string): Promise<profRating> => {
  try {
    console.log(`Getting ${fullName} from RMP...`);
    const url = `https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&q=${fullName}+AND+schoolid_s%3A${schoolId}&defType=edismax&qf=teacherfirstname_t\%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=20&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s`;
    const resp: any = await fetch(url);
    const data: response = await resp.json();

    if (!data.response.docs.length)
      throw new Error(`No professors found for the name ${fullName}, setting as unknown.`);

    const profId: string = data.response.docs[0].pk_id.toString();
    // If the rating comes back as zero, that just means that the prof exists but has no reviews.
    const rating: string =
      data.response.docs[0].averageratingscore_rf !== 0
        ? data.response.docs[0].averageratingscore_rf.toString()
        : 'No data';

    const currRating: profRating = {
      profId,
      rating,
    };

    console.log('Success');
    return currRating;
  } catch (err) {
    console.log(err);
    return {
      profId: '',
      rating: 'Unknown',
    };
  }
};

// Controller function that handles the creation and sending of a list of professor ratings.
async function sendRatingsList(ratingsRequest: ratingsRequest, tabId: number): Promise<void> {
  // Get the cached prof names and fill in the cache where needed.
  chrome.storage.local.get(
    ['cachedProfRatings'],
    async ({ cachedProfRatings }: { cachedProfRatings: profRatingsCache }) => {
      // Get ratings for each request, either from the cache or a new request.
      const newCachedProfRatings: profRatingsCache | {} = cachedProfRatings || {};

      // Build a new one-to-one list of ratings based on the requestsList and cachedProfRatings.
      const newRatingsList: profRating[] = [];

      for (const fullName of ratingsRequest.profNames) {
        if (fullName === 'Staff') {
          // Skip 'Staff', as that's just the placeholder name.
          newRatingsList.push({
            profId: '',
            rating: 'Unknown',
          });
        } else if (newCachedProfRatings[fullName] && newCachedProfRatings[fullName].profId) {
          // Check if cached and if the cached version has data
          console.log(`Getting ${fullName} from cache`);

          // If the cache is older than 2 months, refresh it.
          if (Date.now() - newCachedProfRatings[fullName].creationTime > 5184000) {
            console.log('Cache needs refreshing');

            const currRating = await fetchProfRatings(fullName, ratingsRequest.schoolId);
            if (!currRating) throw new Error("Invalid return but didn't err?");
            newCachedProfRatings[fullName] = { ...currRating, creationTime: Date.now() };
            newRatingsList.push(currRating);
          } else newRatingsList.push(newCachedProfRatings[fullName]);
        } else {
          // Get new data from RMP.
          const currRating = await fetchProfRatings(fullName, ratingsRequest.schoolId);
          if (!currRating) throw new Error("Invalid return but didn't err?");
          newCachedProfRatings[fullName] = { ...currRating, creationTime: Date.now() };
          newRatingsList.push(currRating);
        }
      }

      chrome.storage.local.set({ cachedProfRatings: newCachedProfRatings });
      chrome.tabs.sendMessage(tabId, newRatingsList);
    },
  );
}

// Takes in a profId, sends message with array of profReviews
async function sendProfReviews(profId: string): Promise<void> {
  console.log(`Getting reviews for id: ${profId}`);
  const url = `https://www.ratemyprofessors.com/paginate/professors/ratings?tid=${profId}&max=10&cache=true`;
  console.log(url);
}

const onMessage = ({ type, data }: messagePackage, sender): void => {
  switch (type) {
    case 'getRatingsList':
      sendRatingsList(data.ratingsRequest, sender.tab.id);
      break;
    case 'getProfReviews':
      sendProfReviews(data.profId);
      break;
    default:
      console.error('Invalid message type in background: ', type);
  }
};

chrome.runtime.onMessage.addListener(onMessage);

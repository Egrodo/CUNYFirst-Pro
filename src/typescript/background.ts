import { number } from '@interactjs/utils/is';

type ratingsResponse = {
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

type reviewResponse = {
  ratings: profReview[];
  remaining: number;
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
    const data: ratingsResponse = await resp.json();

    if (!data.response.docs.length) {
      throw new Error(`No professors found for the name ${fullName}, setting as unknown.`);
    }

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

// Controller function that handles the caching, requesting, and sending a list of ratings for various given professors.
function sendRatingsList(ratingsRequest: ratingsRequest, tabId: number): void {
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
      chrome.tabs.sendMessage(tabId, { type: 'ratingsList', data: { ratingsList: newRatingsList } });
    },
  );
}

type profReview = {
  quality: 'awesome' | 'good' | 'average' | 'poor' | 'awful';
  rClass: string;
  rComments: string;
  rOverallString: string;
  rEasyString: string;
  rWouldTakeAgain: 'Yes' | 'No';
  teacherRatingTags: string[];
};

type profReviewsCache = {
  [profId: string]: {
    creationTime: number;
    currReviewsList: profReview[];
  };
};

const fetchProfReviews = async (profId: string): Promise<profReview[]> => {
  try {
    console.log(`Getting reviews for ${profId} from RMP...`);
    const url = `https://www.ratemyprofessors.com/paginate/professors/ratings?tid=${profId}&max=10&cache=true`;
    const resp: any = await fetch(url);
    const data: reviewResponse = await resp.json();

    if (!data.ratings.length) {
      throw new Error(`No reviews found for id: ${profId}?`);
    }

    // Strip off only the properties we want
    const reviews = data.ratings.map(rating => ({
      quality: rating.quality,
      rClass: rating.rClass,
      rComments: rating.rComments,
      rOverallString: rating.rOverallString,
      rEasyString: rating.rEasyString,
      rWouldTakeAgain: rating.rWouldTakeAgain,
      teacherRatingTags: rating.teacherRatingTags,
    }));

    console.log('Success');
    return reviews;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Controller function that handles the caching, requesting, and sending a list of reviews for a given professor.
function sendProfReviews(profId: string, tabId: number): void {
  chrome.storage.local.get(
    ['cachedProfReviews'],
    async ({ cachedProfReviews }: { cachedProfReviews: profReviewsCache }) => {
      // Again, the result of getting a cache is either an empty object or the actual requested cache.
      const newCachedProfReviews: profReviewsCache | {} = cachedProfReviews || {};

      if (newCachedProfReviews.hasOwnProperty(profId)) {
        // If our cache contains the reviews requested, ensure it's not older than 2 months old and send them.
        const cachedReviews = newCachedProfReviews[profId];
        if (Date.now() - cachedReviews.creationTime > 5184000) {
          console.log('Cache needs refreshing.');
          // Otherwise we need to fetch the reviews for a the profId.
          const currReviewsList: profReview[] = await fetchProfReviews(profId);

          // Add it to the cache
          newCachedProfReviews[profId] = {
            creationTime: Date.now(),
            reviewsList: currReviewsList,
          };
          chrome.storage.local.set({ cachedProfReviews: newCachedProfReviews });

          // Send the data.
          chrome.tabs.sendMessage(tabId, { type: 'profReviews', data: { profReviews: currReviewsList } });
        } else {
          // If the cache isn't stale, send the message.
          console.log('Getting reviews from cache');
          chrome.tabs.sendMessage(tabId, { type: 'profReviews', data: { profReviews: cachedReviews.reviewsList } });
        }
      } else {
        // Otherwise we need to fetch the reviews for a the profId.
        const currReviewsList: profReview[] = await fetchProfReviews(profId);

        // Add it to the cache
        newCachedProfReviews[profId] = {
          creationTime: Date.now(),
          reviewsList: currReviewsList,
        };
        chrome.storage.local.set({ cachedProfReviews: newCachedProfReviews });

        // Send the data.
        chrome.tabs.sendMessage(tabId, { type: 'profReviews', data: { profReviews: currReviewsList } });
      }
    },
  );
}

const onMessage = ({ type, data }: messagePackage, sender): void => {
  switch (type) {
    case 'getRatingsList':
      sendRatingsList(data.ratingsRequest, sender.tab.id);
      break;
    case 'getProfReviews':
      sendProfReviews(data.profId, sender.tab.id);
      break;
    default:
      console.error('Invalid message type in background: ', type);
  }
};

chrome.runtime.onMessage.addListener(onMessage);


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

async function fetchAndSendData(requestsList: string[], tabId: number) {
  const url = requestsList[0];

  try {
    const resp = await fetch(url);
    const data: response = await resp.json();

    console.log(data);
    chrome.tabs.sendMessage(tabId, data);
    return;
  } catch(err) {
    console.error(err);
  }
}


// TODO: Type these params.
const onMessage = ({requestsList}, sender, sendResponse): void => {
  fetchAndSendData(requestsList, sender.tab.id);
};

chrome.runtime.onMessage.addListener(onMessage);

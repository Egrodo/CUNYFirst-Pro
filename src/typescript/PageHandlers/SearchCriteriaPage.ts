class SearchCriteriaPage {
  iframe: HTMLIFrameElement;
  observer: MutationObserver;
  schoolId: string;
  constructor(iframe, observer, schoolId) {
    // console.log('Search Criteria Page!');
  }

  start() {
    console.log('Starting SearchCriteriaPage engine');
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');
  }
}

export { SearchCriteriaPage };

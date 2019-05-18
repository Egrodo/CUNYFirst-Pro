class SearchCriteriaPage {
  iframe: HTMLIFrameElement;
  observer: MutationObserver;
  schoolId: string;
  constructor(iframe, observer, schoolId) {
    this.iframe = iframe;
    this.observer = observer;
    this.schoolId = schoolId;
  }

  start() {
    console.log('Starting SearchCriteriaPage engine');
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');
  }
}

export { SearchCriteriaPage };

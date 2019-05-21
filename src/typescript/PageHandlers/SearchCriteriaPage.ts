import { debounce, schoolIdToSelectValue, selectValueToSchoolId } from '../helpers';

class SearchCriteriaPage {
  iframe: HTMLIFrameElement;
  schoolId: string;
  constructor(iframe, schoolId) {
    this.iframe = iframe;
    this.schoolId = schoolId;
  }

  setSchoolSelect(schoolId: string) {
    const selectBox = this.iframe.contentDocument.getElementById(
      'CLASS_SRCH_WRK2_INSTITUTION$31$',
    ) as HTMLSelectElement;
    selectBox.value = schoolIdToSelectValue(schoolId);

    // Also fire the 'onchange' event manually to trigger semester lookup
    const event = new Event('change');
    selectBox.dispatchEvent(event);
  }

  addClickHandler(): void {
    // Adds a handler to the 'search' button that saves your institution if it differs from the local state.
    const submitBtn = this.iframe.contentDocument.getElementById(
      'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
    ) as HTMLAnchorElement;

    if (!submitBtn) return;
    submitBtn.addEventListener('click', () => {
      // If search submit button clicked with a different school selected, save that one instead.
      const selectBox = this.iframe.contentDocument.getElementById(
        'CLASS_SRCH_WRK2_INSTITUTION$31$',
      ) as HTMLSelectElement;
      if (selectBox.value !== schoolIdToSelectValue(this.schoolId)) {
        chrome.storage.local.set({ schoolId: selectValueToSchoolId(selectBox.value) });
      }
    });
  }

  start() {
    console.log('Starting SearchCriteriaPage engine');
    this.setSchoolSelect(this.schoolId);
    this.addClickHandler();

    // The problem with binding a click method onto the submit button is that the webpage
    // re-creates the button a bunch post-loading, so it overwrites the listener.
    // So on start, establish a mutation observer to keep re-adding our click handler.
    const observer: MutationObserver = new MutationObserver(debounce(200, this.addClickHandler.bind(this)));
    const config: MutationObserverInit = { childList: true, subtree: true };
    observer.observe(this.iframe.contentDocument.body, config);
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');

    // The input box listener is already gone at this point, no need to remove.
  }
}

export { SearchCriteriaPage };

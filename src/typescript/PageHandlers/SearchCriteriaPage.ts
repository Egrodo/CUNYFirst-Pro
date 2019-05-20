import { debounce, schoolIdToSelectValue, selectValueToSchoolId } from '../helpers';

class SearchCriteriaPage {
  iframe: HTMLIFrameElement;
  schoolId: string;
  constructor(iframe, schoolId) {
    this.iframe = iframe;
    this.schoolId = schoolId;
  }

  setSchoolSelect(schoolId: string) {
    const selectBox = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_INSTITUTION$31$') as HTMLSelectElement;
    selectBox.value = schoolIdToSelectValue(schoolId);

    // Also fire the 'onchange' event manually to trigger semester lookup
    const event = new Event('change');
    selectBox.dispatchEvent(event);
  }

  start() {
    // BUG: Navigating away and back without reloading the iframe doesn't setSchoolSelect
    // This is because the mutation observer doesn't fire for certain section changes. wtf

    console.log('Starting SearchCriteriaPage engine');
    // The problem with binding a click method onto the submit button is that the webpage
    // re-creates the button a bunch post-loading, so it overwrites the listener.
    // So on start, briefly take over the mutation observer to wait until it's done before adding listener,
    this.setSchoolSelect(this.schoolId);

    // Find a better way to do this, only do this stuff after the page is done doing a fuck.
    setTimeout(() => {
      const submitBtn = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH') as HTMLAnchorElement;
      // No need to use a ref for the listener bc I'm not removing it at any time.
      submitBtn.addEventListener('click', ((event) => {
        // If search submit button clicked with a different school selected, save that one instead.
        const selectBox = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_INSTITUTION$31$') as HTMLSelectElement;
        if (selectBox.value !== schoolIdToSelectValue(this.schoolId)) {
          chrome.storage.local.set({schoolId: selectValueToSchoolId(selectBox.value)});
        }
      }));
    }, 500);
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');

    // The input box listener is already gone at this point, no need to remove.
  }
}

export { SearchCriteriaPage };

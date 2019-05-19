import {schoolIdToSelectValue, selectValueToSchoolId } from '../helpers';

/*
  values of iframe at id CLASS_SRCH_WRK2_INSTITUTION
  BAR01 - 222
  BMC01 - Borough of Manhattan CC
  BCC01 - Bronx CC
  BKL01 - Brooklyn College
  CTY01 - City College
  CSI01 - College of Staten Island
  GRD01 - Graduate Center
  NCC01 - Guttman CC
  HOS01 - Hostoc CC
  HRT01 - Hunter College
  JJC01 - John Jay College
  KCC01 - Kingsborough CC
  LAG01 - LaGuardia CC
  LEH01 - Lehman College
  MHC01 - Macaulay Honors College
  MEC01 - Medgar Evers College
  NYT01 - NYC College of Technology
  QNS01 - Queens College
  QCC01 - QueensBorough CC
  SOJ01 - School of Journalism
  SLU01 - School of Labor&Urban Studies
  LAW01 - School of Law
  MED01 - School of Medicine
  SPS01 - School of Professional Studies
  SPH01 - School of Public Health
  UAPC1 - University Processing Center
  YRK01 - York College
*/

class SearchCriteriaPage {
  iframe: HTMLIFrameElement;
  observer: MutationObserver;
  schoolId: string;
  constructor(iframe, observer, schoolId) {
    this.iframe = iframe;
    this.observer = observer;
    this.schoolId = schoolId;
  }

  setSchoolSelect(schoolId: string) {
    const selectBox = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_INSTITUTION$31$') as HTMLSelectElement;
    selectBox.value = schoolIdToSelectValue(schoolId);

    // Also fire the 'onchange' event manually to trigger semester lookup
    const event = new Event('change');
    selectBox.dispatchEvent(event);
  }

  onSubmitBtnClick(): void {
    // If search submit button clicked with a different school selected, save that one instead.
    const selectBox = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_INSTITUTION$31$') as HTMLSelectElement;
    if (selectBox.value !== schoolIdToSelectValue(this.schoolId)) {
      chrome.storage.local.set({schoolId: selectValueToSchoolId(selectBox.value)});
    }
  }

  start() {
    console.log('Starting SearchCriteriaPage engine');
    // On start, automatically select the school that you go to.
    this.setSchoolSelect(this.schoolId);
    
    const submitBtn = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH') as HTMLAnchorElement;
    submitBtn.addEventListener('click', this.onSubmitBtnClick);
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');

    // The input box listener is already gone at this point.
    // TODO: Is there any point in doing this?
    this.observer = null;
    this.schoolId = null;
    this.iframe = null;
  }
}

export { SearchCriteriaPage };

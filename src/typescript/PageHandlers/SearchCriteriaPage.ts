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

  mapSchoolIdToSelectValue(schoolId: string): string {
    switch(schoolId) {
      case '222':
        return 'BAR01';
      default:
        return 'BAR01';
    }
  }

  setSchoolSelect(schoolId: string) {
    const selectBox = this.iframe.contentDocument.getElementById('CLASS_SRCH_WRK2_INSTITUTION$31$') as HTMLSelectElement;
    selectBox.value = this.mapSchoolIdToSelectValue(schoolId);

    // Also fire the 'onchange' event manually to trigger semester lookup
    const event = new Event('change');
    selectBox.dispatchEvent(event);
  }


  start() {
    console.log('Starting SearchCriteriaPage engine');
    // On start, automatically select the school that you go to and watch for changes to it to update the storage'd copy.
    console.log(typeof this.schoolId);
    this.setSchoolSelect(this.schoolId);
  }

  stop() {
    console.log('Stopping SearchCriteriaPage engine');
  }
}

export { SearchCriteriaPage };

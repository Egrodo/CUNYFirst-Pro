const debounce = (delay: number, fn: Function) => {
  let timerId;
  return ((...args) => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
          fn(...args);
          timerId = null;
      }, delay);
  });
}

const nodeSearchHelper = (parent: Element, textToFind: string): boolean => {
  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
      if (walker.currentNode.textContent === textToFind) return true;
  }
  return false;
};

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

const schoolIdToSelectValue = (schoolId: string): string => {
  switch(schoolId) {
    case '222':
      return 'BAR01';
    default:
      return 'BAR01';
  }
};

const selectValueToSchoolId = (selectValue: string): string => {
  switch(selectValue) {
    case 'BAR01':
      return '222';
    default:
      return '222';
  }
};

export {
  debounce,
  nodeSearchHelper,
  schoolIdToSelectValue,
  selectValueToSchoolId
};
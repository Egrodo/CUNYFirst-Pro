const debounce = (delay: number, fn: Function) => {
  let timerId;
  return (...args) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
};

const nodeSearchHelper = (parent: Element, textToFind: string): boolean => {
  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    if (walker.currentNode.textContent === textToFind) return true;
  }
  return false;
};

/*
  TODO: 
  values of iframe at id CLASS_SRCH_WRK2_INSTITUTION
  BAR01 - 222
  BMC01 - 3956
  BCC01 - Bronx CC
  BKL01 - 223
  CTY01 - 224
  CSI01 - College of Staten Island
  GRD01 - Graduate Center
  NCC01 - Guttman CC
  HOS01 - Hostoc CC
  HRT01 - 226
  JJC01 - John Jay College
  KCC01 - Kingsborough CC
  LAG01 - LaGuardia CC
  LEH01 - 228
  MHC01 - Macaulay Honors College
  MEC01 - Medgar Evers College
  NYT01 - NYC College of Technology
  QNS01 - 331
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
  switch (schoolId) {
    case "222":
      return "BAR01";
    case "223":
      return "BKL01";
    case "224":
      return "CTY01";
    case "226":
      return "HRT01";
    case "228":
      return "LEH01";
    case "331":
      return "QNS01";
    default:
      return "BAR01";
  }
};

const selectValueToSchoolId = (selectValue: string): string => {
  switch (selectValue) {
    case "BAR01":
      return "222";
    case "BKL01":
      return "223";
    case "CTY01":
      return "224";
    case "HRT01":
      return "226";
    case "LEH01":
      return "228";
    case "QNS01":
      return "331";
    default:
      return "222";
  }
};

export { debounce, nodeSearchHelper, schoolIdToSelectValue, selectValueToSchoolId };

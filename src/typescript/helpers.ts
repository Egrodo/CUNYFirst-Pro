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
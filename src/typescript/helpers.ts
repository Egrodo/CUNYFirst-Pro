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

export {
  debounce,
  nodeSearchHelper,
};
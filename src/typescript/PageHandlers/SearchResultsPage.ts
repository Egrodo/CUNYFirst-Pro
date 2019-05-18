import { nodeSearchHelper } from '../helpers';

type profRating = {
    profId: string;
    rating: string;
    rmpLink: string;
};

// On this page, add ratings and links
class SearchResultsPage {
  iframe: HTMLIFrameElement;
  observer: MutationObserver;
  schoolId: string;
  profNodeList: NodeList;
  listenerRef: Function;

  constructor(iframe, observer, schoolId) {
      this.iframe = iframe;
      this.observer = observer;
      this.schoolId = schoolId;
  }

  // Finds and returns a list of the professor name nodes
  findProfNodes(): NodeList {
      // Use the attribute selector to get a NodeList of all professor name nodes.
      const profNodeList: NodeList = this.iframe.contentDocument.querySelectorAll('[id^=MTG_INSTR]');
      if (profNodeList.length) {
          return profNodeList;
      } else {
          console.error('No professor nodes found, but supposedly on the right page?');
          return profNodeList;
      }
  }

  // Takes a list of professor name nodes and gets the ratings for each from RMP.
  sendRatingsRequest(profNodeList: NodeList): void {
      const requestsList: [string, string][] = Array.prototype.map.call(profNodeList, prof => {
          const fullName = prof.innerText.split(' ').join('+');
          return [fullName, this.schoolId];
      });
      
      // Send a message to the background script telling it to perform the lookups.
      chrome.runtime.sendMessage({requestsList});
  }

  displayRatings(ratingsList: profRating[], profNodes: NodeList): void {
      // Disconnect the observer before doing any DOM manip.
      this.observer.disconnect();

      profNodes.forEach((node, i) => {
          const cellParent: Node = node.parentNode.parentNode;

          // In cases where the content is mutated but the page isn't changed, check if we've already added the ratings before adding again.
          if (nodeSearchHelper(cellParent.parentElement.parentElement, 'Rating')) return;         
          
          // First create the ratings table cell
          const td = document.createElement('td') as HTMLTableDataCellElement;
          td.className = 'PSLEVEL3GRIDROW';
          td.setAttribute('align', 'left');
          td.appendChild(document.createElement('div'));
          td.children[0].appendChild(document.createElement('span'));
          td.children[0].children[0].className = 'PSLONGEDITBOX CUNYFIRSTPRO_ADDON';

          // Then put the rating span in it
          if (ratingsList[i].rmpLink) {
              td.children[0].children[0].innerHTML = `${ratingsList[i].rating} | <a rel="noreferral noopener" target="_blank" href="${ratingsList[i].rmpLink}">Link</a>`;
          } else {
              td.children[0].children[0].innerHTML = `Unknown | <a rel="noreferral noopener" target="_blank" href="https://www.ratemyprofessors.com/teacher/create">Add a review?</a>`;
          }

          cellParent.parentNode.insertBefore(td, cellParent.nextSibling);


          // Then create the ratings table header
          const headerParent: Element = cellParent.parentNode.parentNode.children[0];
          const th = document.createElement('th') as HTMLTableHeaderCellElement;
          th.className = 'PSLEVEL1GRIDCOLUMNHDR';
          th.setAttribute('scope', 'col'); th.setAttribute('width', '120'); th.setAttribute('align', 'left'); th.setAttribute('abbr', 'Rating');
          th.appendChild(document.createElement('span'));
          th.children[0].setAttribute('title', "RateMyProfessor rating");
          th.children[0].className = 'CUNYFIRSTPRO_ADDON';
          th.children[0].textContent = 'Rating';
          
          headerParent.insertBefore(th, headerParent.children[5]);
      });

      // Re-add the observer after doing the DOM manipulation
      const config: MutationObserverInit = { childList: true, subtree: true };
      this.observer.observe(this.iframe.contentDocument.body, config);
  }

  start = async (): Promise<void> => {
      console.log('Starting SearchResultsPage engine');
      this.profNodeList = this.findProfNodes();
      await this.sendRatingsRequest(this.profNodeList);

      // Receive the lookups and display them.
      this.listenerRef = (ratingsList: profRating[]): void => {
          this.displayRatings(ratingsList, this.profNodeList);
      };

      chrome.runtime.onMessage.addListener(this.listenerRef as EventListener);
  }

  stop = (): void => {
      console.log('Stopping SearchResultsPage engine');
      this.observer = null;
      this.schoolId = null;
      this.iframe = null;
      this.profNodeList = null;
      chrome.runtime.onMessage.removeListener(this.listenerRef as EventListener);
  }
}

export { SearchResultsPage };

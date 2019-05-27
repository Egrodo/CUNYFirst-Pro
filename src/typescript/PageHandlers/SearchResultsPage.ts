import { debounce, nodeSearchHelper } from '../helpers';
import { ReviewsPopup } from '../Components/ReviewsPopup';

type profRating = {
  profId: string;
  rating: string;
};

type ratingsRequest = {
  schoolId: string;
  profNames: string[];
};

// On this page, add ratings and links
class SearchResultsPage {
  iframe: HTMLIFrameElement;
  schoolId: string;
  profNodeList: NodeList;
  observer: MutationObserver;
  listenerRef: Function;
  popupRef: ReviewsPopup;
  hasMutated: boolean;

  constructor(iframe, schoolId) {
    this.iframe = iframe;
    this.schoolId = schoolId;
    this.hasMutated = false;

    console.log('Starting SearchResultsPage engine');
    this.renderRatings();

    // Use a MutationObserver to check if the user has caused the page to rewrite the content, and write it again.
    this.observer = new MutationObserver(() => {
      // Ignore the first mutate, as it's caused by the page initial page start up a few lines up.
      if (this.hasMutated) {
        debounce(200, this.renderRatings.bind(this));
      } else this.hasMutated = true;
    });

    const config: MutationObserverInit = { childList: true, subtree: true };
    this.observer.observe(this.iframe.contentDocument.body, config);

    // Receive the lookups and display them.
    this.listenerRef = ({ type, data }): void => {
      if (type === 'ratingsList') this.displayRatings(data.ratingsList, this.profNodeList);
    };
    chrome.runtime.onMessage.addListener(this.listenerRef as EventListener);
  }

  // Finds and returns a list of the professor name nodes
  findProfNodes(): NodeList {
    // Use the attribute selector to get a NodeList of all professor name nodes.
    const profNodeList: NodeList = this.iframe.contentDocument.querySelectorAll('[id^=MTG_INSTR]');
    return profNodeList;
  }

  // Takes a list of professor name nodes and gets the ratings for each from RMP.
  sendRatingsRequest(profNodeList: NodeList): void {
    const ratingsRequest: ratingsRequest = {
      schoolId: this.schoolId,
      profNames: Array.prototype.map.call(profNodeList, prof => prof.innerText.split(' ').join('+')),
    };

    // Send a message to the background script telling it to perform the lookups.
    chrome.runtime.sendMessage({ type: 'getRatingsList', data: { ratingsRequest } });
  }

  displayRatings(ratingsList: profRating[], profNodes: NodeList): void {
    profNodes.forEach((node, i) => {
      const cellParent: Node = node.parentNode.parentNode;

      // In cases where the content is mutated but the page isn't changed, check if we've already added the ratings before adding again.
      if (nodeSearchHelper(cellParent.parentElement.parentElement, 'Rating')) return;

      // Use document fragment to reduce reflow.
      const fragment: DocumentFragment = document.createDocumentFragment();

      // First create the ratings table cell
      const td = document.createElement('td') as HTMLTableDataCellElement;
      td.className = 'PSLEVEL3GRIDROW';
      td.setAttribute('align', 'left');
      td.appendChild(document.createElement('div'));
      td.children[0].appendChild(document.createElement('span'));
      td.children[0].children[0].className = 'PSLONGEDITBOX CUNYFIRSTPRO_ADDON';

      // If the rating for this prof is known, create the rating span.
      if (ratingsList[i].rating) {
        const ratingSpan: HTMLSpanElement = document.createElement('span');
        ratingSpan.innerText = `${ratingsList[i].rating}/5`;

        const middleBreak: Text = document.createTextNode(' | ');

        const ratingPreviewLink: HTMLAnchorElement = document.createElement('a');
        ratingPreviewLink.href = 'javascript:;';
        ratingPreviewLink.innerText = 'See Reviews';
        ratingPreviewLink.dataset.profId = ratingsList[i].profId;
        ratingPreviewLink.addEventListener(
          'click',
          ({ target }: { target: EventTarget }): void => {
            // TODO: Debounce this.
            if (!(target instanceof HTMLAnchorElement)) return;
            if (this.popupRef) {
              const profName = (target.parentElement.parentElement.parentElement.parentElement.children[4] as HTMLSpanElement).innerText;
              this.popupRef.update(profName, target.dataset.profId);
            } else {
              const profName = (target.parentElement.parentElement.parentElement.parentElement.children[4] as HTMLSpanElement).innerText;
              this.popupRef = new ReviewsPopup(this.iframe, profName, target.dataset.profId);
            }
          },
        );

        td.children[0].children[0].appendChild(ratingSpan);
        td.children[0].children[0].appendChild(middleBreak);
        td.children[0].children[0].appendChild(ratingPreviewLink);
      } else {
        const ratingSpan: HTMLSpanElement = document.createElement('span');
        ratingSpan.innerText = 'Unknown';
        const middleBreak: Text = document.createTextNode(' | ');
        const ratingPreviewLink: HTMLAnchorElement = document.createElement('a');
        ratingPreviewLink.href = 'https://www.ratemyprofessors.com/teacher/create';
        ratingPreviewLink.innerText = 'Add a review?';

        td.children[0].children[0].appendChild(ratingSpan);
        td.children[0].children[0].appendChild(middleBreak);
        td.children[0].children[0].appendChild(ratingPreviewLink);
      }

      fragment.appendChild(td);
      cellParent.parentNode.insertBefore(fragment, cellParent.nextSibling);

      // Then create the ratings table header
      const headerParent: Element = cellParent.parentNode.parentNode.children[0];
      const th = document.createElement('th') as HTMLTableHeaderCellElement;
      th.className = 'PSLEVEL1GRIDCOLUMNHDR';
      th.setAttribute('scope', 'col');
      th.setAttribute('width', '120');
      th.setAttribute('align', 'left');
      th.setAttribute('abbr', 'Rating');
      th.appendChild(document.createElement('span'));
      th.children[0].setAttribute('title', 'RateMyProfessor rating');
      th.children[0].className = 'CUNYFIRSTPRO_ADDON';
      th.children[0].textContent = 'Rating';

      headerParent.insertBefore(th, headerParent.children[5]);
    });
  }

  renderRatings(): void {
    this.profNodeList = this.findProfNodes();
    this.sendRatingsRequest(this.profNodeList);
  }

  stop(): void {
    console.log('Stopping SearchResultsPage engine');
    chrome.runtime.onMessage.removeListener(this.listenerRef as EventListener);
    if (this.popupRef) this.popupRef.stop();
    this.observer.disconnect();
  }
}

export { SearchResultsPage };

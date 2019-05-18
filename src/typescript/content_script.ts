import { debounce, nodeSearchHelper } from './helpers';

interface profRating {
    profId: string;
    rating: string;
    rmpLink: string;
};

class SearchPageRatings {
    iframe: HTMLIFrameElement;
    observer: MutationObserver;
    schoolId: string;
    profNodeList: NodeList;
    listenerRef: Function;

    constructor(iframe: HTMLIFrameElement, observer: MutationObserver, schoolId: string) {
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
        console.log('starting');
        this.profNodeList = this.findProfNodes();
        await this.sendRatingsRequest(this.profNodeList);

        // Receive the lookups and display them.
        this.listenerRef = (ratingsList: profRating[]): void => {
            this.displayRatings(ratingsList, this.profNodeList);
        };

        chrome.runtime.onMessage.addListener(this.listenerRef as EventListener);
    }

    stop = (): void => {
        console.log('stopping');
        this.observer = null;
        this.schoolId = null;
        this.iframe = null;
        this.profNodeList = null;
        chrome.runtime.onMessage.removeListener(this.listenerRef as EventListener);
    }
}

// When the window loads, wait for the iframe to load then add a MutationObserver to watch for changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let observer: MutationObserver; // Putting this here so I can disconnect it before I do DOM manipulation.
    let schoolId = '222'; // TODO: Get this from the dropdown selector
    let currActivity: SearchPageRatings | null = null;

    function onMutate(): void {
        if (isSearchResultsPage()) {
            if (!currActivity) {
                currActivity = new SearchPageRatings(iframe, observer, schoolId);
                currActivity.start();
            } else currActivity.start();
        } else if (currActivity) {
            // Dereference the SearchPageRatings so it can be garbage collected.
            currActivity.stop();
            currActivity = null;
        }
    }

    // Checks if we're on the search page
    const isSearchResultsPage = (): boolean => {
        const titleNode = iframe.contentDocument.getElementById('DERIVED_REGFRM1_TITLE1');
        if (titleNode && titleNode.innerText === 'Search Results') {
            return true;
        } else return false;
    }

    // Add the mutation observer to watch for page changes inside the iframe.
    iframe.addEventListener('load', function(): void {
        if (!iframe.contentDocument) return;
        const body = iframe.contentDocument.body;
        observer = new MutationObserver(debounce(200, onMutate));
        const config: MutationObserverInit = { childList: true, subtree: true };
        observer.observe(body, config);

        iframe.addEventListener('unload', observer.disconnect);
    });
});
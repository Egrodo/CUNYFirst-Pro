import { debounce, nodeSearchHelper } from './helpers';

interface profRating {
    profId: string;
    rating: string;
    rmpLink: string;
};

// TODO: Deprecate the options menu in favor of just checking which school you select on the "Enter Search Criteria" page and saving that.

// When the window loads, wait for the iframe to load then add a MutationObserver to watch for changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let observer: MutationObserver; // Putting this here so I can disconnect it before I do DOM manipulation.

    function onMutate(): void {
        if (checkIfSearchPage()) {
            const profNodeList: NodeList = findProfNodes();
            getThenDisplayRatings(profNodeList);
        }
    }

    // Checks if we're on the search page
    const checkIfSearchPage = (): boolean => {
        const titleNode = iframe.contentDocument.getElementById('DERIVED_REGFRM1_TITLE1');
        if (titleNode && titleNode.innerText === 'Search Results') {
            return true;
        } else return false;
    }

    // Finds and returns a list of the professor nodes
    const findProfNodes = (): NodeList => {
        // Use the attribute selector to get a NodeList of all professor name nodes.
        const profNodeList: NodeList = iframe.contentDocument.querySelectorAll("[id^=MTG_INSTR]");
        if (profNodeList.length) {
            return profNodeList;
        } else {
            console.error('No professor nodes found, but supposedly on the right page?');
        }
    }

    // Take a list of profs and get the ratings for each from RMP. 
    function getThenDisplayRatings(profNodeList: NodeList): void {
        chrome.storage.sync.get(['schoolId'], (({schoolId}) => {
            const requestsList: [string, string][] = Array.prototype.map.call(profNodeList, prof => {
                const fullName = prof.innerText.split(' ').join('+');
                return [fullName, schoolId];
            });
            
            // Send a message to the background script telling it to perform the lookups.
            chrome.runtime.sendMessage({requestsList});
            
            // Receive the lookups and display them.
            chrome.runtime.onMessage.addListener((ratingsList => displayRatings(ratingsList, profNodeList)));
        }));
    }

    // Take a ratingsList and matching profNode list and display the ratings
    function displayRatings(ratingsList: profRating[], profNodes: NodeList): void {
        // Disconnect the observer before doing any DOM manip. It'll reconnect on next load.
        observer.disconnect();

        console.log(ratingsList);

        // Rating at ratingsList[i] is for professor at profNodes[i]
        profNodes.forEach((node, i) => {
            let parent = node.parentNode.parentNode;
            // In cases where the content is mutated but the page isn't changed, check if we've already added the ratings before adding again.
            if (nodeSearchHelper(parent.parentElement.parentElement, 'Rating')) return;

            console.log('Adding ratings');
            // First add the ratings table cell:
            const td = document.createElement('td') as HTMLTableDataCellElement;
            td.className = 'PSLEVEL3GRIDROW';
            td.setAttribute('align', 'left');
            td.appendChild(document.createElement('div'));
            td.children[0].appendChild(document.createElement('span'));
            td.children[0].children[0].className = 'PSLONGEDITBOX CUNYFIRSTPRO_ADDON';

            // Create the ratings span
            if (ratingsList[i].rmpLink) {
                td.children[0].children[0].innerHTML = `${ratingsList[i].rating} | <a rel="noreferral noopener" target="_blank" href="${ratingsList[i].rmpLink}">Link</a>`;
            } else {
                td.children[0].children[0].innerHTML = `Unknown | <a rel="noreferral noopener" target="_blank" href="https://www.ratemyprofessors.com/teacher/create">Add a review?</a>`;
            }

            parent.parentNode.insertBefore(td, parent.nextSibling);


            // Then add the ratings table header:
            parent = parent.parentNode.parentNode.children[0];
            const th = document.createElement('th') as HTMLTableHeaderCellElement;
            th.className = 'PSLEVEL1GRIDCOLUMNHDR';
            th.setAttribute('scope', 'col'); th.setAttribute('width', '120'); th.setAttribute('align', 'left'); th.setAttribute('abbr', 'Rating');
            th.appendChild(document.createElement('span'));
            th.children[0].setAttribute('title', "RateMyProfessor rating");
            th.children[0].className = 'CUNYFIRSTPRO_ADDON';
            th.children[0].textContent = 'Rating';
            
            parent.insertBefore(th, parent.children[5]);
        });

        establishObserver();
    }

    function establishObserver(): void {
        const body = iframe.contentDocument.body;
        observer = new MutationObserver(debounce(200, onMutate));
        const config: MutationObserverInit = { childList: true, subtree: true };
        observer.observe(body, config);
    }

    // Add the mutation observer to watch for page changes inside the iframe.
    iframe.addEventListener('load', function(): void {
        if (!iframe.contentDocument) return;
        establishObserver();

        iframe.addEventListener('unload', observer.disconnect);
    });
});
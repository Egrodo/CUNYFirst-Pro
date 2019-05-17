interface profRating {
    rating: string;
    rmpLink: string;
};

// When the window loads, wait for the iframe to load then add a MutationObserver to watch for changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let observer: MutationObserver; // Putting this here so I can disconnect it before I do DOM manipulation.
    const schoolId = '222'; // TODO: Extract this to some options menu or something.

    function onMutate(): void {
        if (checkIfSearchPage()) {
            const profNodeList: NodeList = findProfNodes();
            // NOTE: How do I make this functional? onMutate can't be async... Make iife inside actual mutateobserver that calls this maybe?
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
        let currentProf: HTMLSpanElement = iframe.contentDocument.getElementById('MTG_INSTR$0');
        
        if (currentProf) {
            // Use the attribute selector to get a NodeList of all professor name nodes.
            const profNodeList: NodeList = iframe.contentDocument.querySelectorAll("[id^=MTG_INSTR]");
            return profNodeList;
        } else {
            console.error('No professor nodes found, but supposedly on the right page?');
        }
    }

    // Take a list of profs and get the ratings for each from RMP. 
    function getThenDisplayRatings(profNodeList: NodeList): void {
        const requestsList: [string, string][] = Array.prototype.map.call(profNodeList, prof => {
            // Each request is a tuple that keeps track of the name for caching purposes.

            const fullName = prof.innerText.split(' ').join('+');
            return [
                fullName,
                `https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&q=${fullName}+AND+schoolid_s%3A${schoolId}&defType=edismax&qf=teacherfirstname_t\%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C2.1)&sort=total_number_of_ratings_i+desc&siteName=rmp&rows=20&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf+schoolid_s`
            ];
        });
        
        // Send a message to the background script telling it to perform the lookups.
        chrome.runtime.sendMessage({requestsList});
        
        // Receive the lookups and display them.
        chrome.runtime.onMessage.addListener((ratingsList => displayRatings(ratingsList, profNodeList)));
    }

    function displayRatings(ratingsList: profRating[], profNodes: NodeList): void {
        // Disconnect the observer before doing any DOM manip. It'll reconnect on next load.
        observer.disconnect();
        // rating at ratingsList[i] is for professor at profNodes[i]

        profNodes.forEach((node, i) => {
            // Go up 2 parent elements, add a new td after current node
            const td = document.createElement('td') as HTMLTableDataCellElement;
            td.className = 'PSLEVEL3GRIDROW';
            td.setAttribute('align', 'left');
            td.appendChild(document.createElement('div'));
            td.children[0].appendChild(document.createElement('span'));
            td.children[0].children[0].className = 'PSLONGEDITBOX';
            td.children[0].children[0].textContent = ratingsList[i].rating;

            let parent = node.parentNode.parentNode
            parent.parentNode.insertBefore(td, parent.nextSibling);

            // Then go up up one more from there, down one child, add a new th after the 5th child.
            const th = document.createElement('th') as HTMLTableHeaderCellElement;
            th.className = 'PSLEVEL1GRIDCOLUMNHDR';
            th.setAttribute('scope', 'col'); th.setAttribute('width', '98'); th.setAttribute('align', 'left'); th.setAttribute('abbr', 'Rating');
            th.appendChild(document.createElement('span'));
            th.children[0].setAttribute('title', "RateMyProfessor rating");
            th.children[0].textContent = 'Rating';
            
            parent = parent.parentNode.parentNode.children[0];
            parent.insertBefore(th, parent.children[5]);
        });
    }

    // Add the mutation observer to watch for page changes inside the iframe.
    iframe.addEventListener('load', function(): void {
        if (!iframe.contentDocument) return;
        const body = iframe.contentDocument.body;
        observer = new MutationObserver(onMutate);
        const config: MutationObserverInit = { childList: true, subtree: true };
        observer.observe(body, config);
        
        iframe.addEventListener('unload', observer.disconnect);
    });
});
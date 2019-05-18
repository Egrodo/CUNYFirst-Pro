import { debounce } from './helpers';
import { SearchResultsPage } from './PageHandlers/SearchResultsPage';
import { SearchCriteriaPage } from './PageHandlers/SearchCriteriaPage';

type pagesType = SearchResultsPage | SearchCriteriaPage | null;

// When the window loads, wait for the iframe to load then add a MutationObserver to watch for changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let observer: MutationObserver; // Putting this here so I can disconnect it before I do DOM manipulation.
    let schoolId: string = '222';
    chrome.storage.sync.get(['schoolId'], (({schoolId: cachedId}: {schoolId: string}) => schoolId = cachedId ? cachedId : '222')); // Get the ID from the cache. Default to Baruch.

    let currActivity: pagesType = null;
    let currPage: string = '';
    
    // On mutate, figure out which page we're on and perform improvements depending.
    function onMutate(): void {
        switch(getPage(iframe)) {
            case 'Search Results':
                if (currPage === 'searchResultsPage') break; // Don't start page engines more than once
                currPage = 'searchResultsPage';
                // If we've changed pages, stop the current engine before starting the new one.
                if (currActivity) currActivity.stop();
                currActivity = new SearchResultsPage(iframe, observer, schoolId);
                currActivity.start();
                break;
            case 'Enter Search Criteria':
                if (currPage === 'searchCriteriaPage') break;
                currPage = 'searchCriteriaPage';
                
                if (currActivity) currActivity.stop();
                currActivity = new SearchCriteriaPage(iframe, observer, schoolId);
                currActivity.start();
                break;
            default:
                console.log("We're not on a recognized page");
                if (currActivity) {
                    // Dereference whichever activity we were doing so it can be garbage collected.
                    currActivity.stop();
                    currActivity = null;
                }
        }
    }

    const getPage = (iframe): string => {
        const titleNode = iframe.contentDocument.getElementById('DERIVED_REGFRM1_TITLE1') || iframe.contentDocument.getElementById('DERIVED_REGFRM1_SS_TRANSACT_TITLE');
        if (titleNode) return titleNode.innerText;
        return '';
    };

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
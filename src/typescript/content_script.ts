import { debounce } from './helpers';
import { SearchResultsPage } from './PageHandlers/SearchResultsPage';

interface profRating {
    profId: string;
    rating: string;
    rmpLink: string;
};

// When the window loads, wait for the iframe to load then add a MutationObserver to watch for changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let observer: MutationObserver; // Putting this here so I can disconnect it before I do DOM manipulation.
    let schoolId = '222'; // TODO: Get this from the dropdown selector
    let currActivity: SearchResultsPage | null = null;

    function onMutate(): void {
        if (isSearchResultsPage()) {
            if (!currActivity) {
                currActivity = new SearchResultsPage(iframe, observer, schoolId);
                currActivity.start();
            } else currActivity.start();
        } else if (isSearchCriteriaPage()) {
            console.log('is search criteria page!');   
        }else if (currActivity) {
            // Dereference the SearchResultsPage so it can be garbage collected.
            currActivity.stop();
            currActivity = null;
        }
    }

    const isSearchCriteriaPage = (): boolean => {
        const titleNode = iframe.contentDocument.getElementById('DERIVED_REGFRM1_TITLE1');
        if (titleNode && titleNode.innerText === 'Enter Search Criteria') {
            return true;
        } else return false;
    }

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
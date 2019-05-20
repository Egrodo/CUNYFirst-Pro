import { SearchResultsPage } from './PageHandlers/SearchResultsPage';
import { SearchCriteriaPage } from './PageHandlers/SearchCriteriaPage';

type pagesType = SearchResultsPage | SearchCriteriaPage | null;

// When the window loads, wait for the iframe to load then add an interval checking for page changes.
window.addEventListener('load', (): void => {
    const iframe = document.getElementById('ptifrmtgtframe') as HTMLIFrameElement;
    let schoolId: string = '222';
    chrome.storage.local.get(['schoolId'], (({schoolId: cachedId}: {schoolId: string}) => schoolId = cachedId ? cachedId : '222')); // Get the ID from the cache. Default to Baruch.
    chrome.storage.onChanged.addListener((changes) => schoolId = changes.schoolId ? changes.schoolId.newValue : schoolId); // Ensure the schoolId is kept up to date.
    let currActivity: pagesType = null;
    let currPage: string = '';
    
    // It's a hack I know, but I tried everything. There is no reliable way to react to page changes.
    function onInterval(): void {
        // Each time the interval fires, check if if we're on the same page. If not, update the new page.
        if (iframe.contentDocument && currPage !== getPage(iframe)) {
            // If we're not on the same page as last time, nav to new page.
            switch(getPage(iframe)) {
                case 'Search Results':
                    // Stop the last page engine, if there is one.
                    if (currActivity) currActivity.stop();
                    currActivity = new SearchResultsPage(iframe, schoolId);
                    currActivity.start();
                    currPage = 'Search Results';
                    break;
                case 'Enter Search Criteria':
                    if (currActivity) currActivity.stop();
                    currActivity = new SearchCriteriaPage(iframe, schoolId);
                    currActivity.start();
                    currPage = 'Enter Search Criteria';
                    break;
                case 'My Planner':
                    console.log('Planner page; no improvements yet.');
                    if (currActivity) currActivity.stop();
                    currPage = 'My Planner';
                    break;
                case 'Select Term':
                    console.log('Enroll page; no improvements yet.');
                    if (currActivity) currActivity.stop();
                    currPage = 'Select Term';
                    break;
                case 'My Academics':
                    console.log('Academics page; no improvements yet.');
                    if (currActivity) currActivity.stop();
                    currPage = 'My Academics';
                    break;
                case 'Course List':
                    console.log('Course List page; no improvements yet.');
                    if (currActivity) currActivity.stop();
                    currPage = 'Course List';
                    break;
                case 'My Course History':
                    console.log('Course History page; no improvements yet.');
                    if (currActivity) currActivity.stop();
                    currPage = 'My Course History';
                    break;
                default:
                    console.log('Unrecognized page, no improvements for this page.');
                    if (currActivity) {
                        currActivity.stop();
                        currActivity = null;
                    }
                    currPage = '';
            }
        }
    }

    const getPage = (iframe): string => {
        const titleNode = iframe.contentDocument.getElementById('DERIVED_REGFRM1_TITLE1') || iframe.contentDocument.getElementById('DERIVED_REGFRM1_SS_TRANSACT_TITLE');
        if (titleNode) return titleNode.innerText;
        return '';
    };

    if (!iframe) return;
    iframe.addEventListener('load', function(): void {
        if (!iframe.contentDocument) return;
        // Unfortunately CUNYFirst makes it extremely difficult to detect page changes, so we're going to just have an interval that checks for headers every 600ms.
        const intervalId = window.setInterval(onInterval, 600);
        iframe.addEventListener('unload', (() => {
            window.clearInterval(intervalId);
            currActivity.stop();
            currActivity = null;
        }));
    });
});
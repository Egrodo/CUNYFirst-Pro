import interact from 'interactjs';
import { debounce } from '../helpers';

// This component controls the popup box that shows the user professor reviews when they click on the preview button

type reviewResponse = {
  profReviews: profReview[];
}

type profReview = {
  quality: 'awesome' | 'good' | 'average' | 'poor' | 'awful';
  rClass: string;
  rComments: string;
  rOverallString: string;
  rEasyString: string;
  rWouldTakeAgain: 'Yes' | 'No';
  teacherRatingTags: string[];
};

const css = `
  #CUNYFIRST_PRO-Container {
    position: fixed;
    top: 0;
    right: 10px;
    width: 300px;
    max-height: 500px;
    padding: .5em 2em;
    color: #00A58E;
    font-family: arial;
    box-shadow: inset 0 0 20px 5px #00A58E;
    background: #FFF0EA;
    border-radius: 5px;
  }

  #CUNYFIRST_PRO-Header {
    width: 100%;
    text-align: center;
    font-size: 1.5em;
    font-weight: bold;
    height: 3em;
  }

  #CUNYFIRST_PRO-Header h1 {
    margin: 0;
    font-size: 1.2em;
  }

  #CUNYFIRST_PRO-Header button {
    position: absolute;
    top: 0;
    right: 0;
    outline: none;
    padding: 0;
    background: #ca3c3c;
    font-size: 1.5em;
    height: 30px;
    color: white;
    border: none;
    width: 30px;
    line-height: 30px;
    cursor: pointer;
  }

  #CUNYFIRST_PRO-Content {
    max-height: 400px;
    overflow-y: scroll;
  }
`;

class ReviewsPopup {
  iframe: HTMLIFrameElement;
  profName: string;
  profId: string;
  listenerRef: Function;
  containerRef: HTMLElement | null;

  constructor(iframe: HTMLIFrameElement, profName: string, profId: string) {
    console.log('Starting ReviewsPopup');
    this.iframe = iframe;
    console.log(this.iframe);
    this.profName = profName;
    this.profId = profId;
    this.containerRef = null;

    this.fetchProfReviews(profId);
    this.createPopup();

    this.listenerRef = ({ type, data }: { type: string, data: reviewResponse }): void => {
      if (type === 'profReviews') this.updatePopup(data.profReviews);
    };

    chrome.runtime.onMessage.addListener(this.listenerRef as EventListener);
  }

  createPopup(): void {
    console.log('Creating popup');
    this.containerRef = document.createElement('aside');
    this.containerRef.id = 'CUNYFIRST_PRO-Container';
      const header: HTMLElement = document.createElement('header');
      header.id = 'CUNYFIRST_PRO-Header';
        const closeBtn: HTMLButtonElement = document.createElement('button');
        closeBtn.innerText = '×';
        closeBtn.addEventListener('click', this.closePopup.bind(this));
        const headerText: HTMLElement = document.createElement('h1');
        headerText.innerText = this.profName;
        header.appendChild(headerText);
        header.appendChild(closeBtn);
      const section: HTMLElement = document.createElement('section');
      section.id = 'CUNYFIRST_PRO-Content';
      this.containerRef.appendChild(header);
      this.containerRef.appendChild(section);

    this.iframe.contentDocument.body.appendChild(this.containerRef);

    const style = document.createElement('style');
    style.type = "text/css"
    style.innerText = css;

    // TODO: Give this loading spinners before content is filled in.
    this.iframe.contentDocument.body.appendChild(style);
  }

  closePopup(): void {
    console.log('Closing popup');
  
    this.iframe.contentDocument.body.removeChild(this.containerRef);
    this.containerRef = null;
  }

  updatePopup(profReviews: profReview[]) {
    // If the user closes the popup before the reviews are returned.
    if (!this.containerRef) return;
    console.log('Adding new info to popup');
    this.containerRef.firstElementChild.firstElementChild.innerHTML = this.profName;
    
    const fragment: DocumentFragment = document.createDocumentFragment();
    profReviews.forEach(review => {
      const reviewContainer: HTMLElement = document.createElement('article');
      const aside: HTMLElement = document.createElement('aside');
      const overallRating: HTMLElement = document.createElement('h2');
      overallRating.innerText = review.rOverallString;
      aside.appendChild(overallRating);
      const classTaken: HTMLElement = document.createElement('h4');
      classTaken.innerText = `Class: ${review.rClass}`;
      aside.appendChild(classTaken);
      const difficulty: HTMLElement = document.createElement('h4');
      difficulty.innerText = `Difficulty: ${review.rEasyString}`;
      aside.appendChild(difficulty);
      const wouldTakeAgain: HTMLElement = document.createElement('h4');
      wouldTakeAgain.innerText = `Would take again? ${review.rWouldTakeAgain}`;
      aside.appendChild(wouldTakeAgain);
      reviewContainer.appendChild(aside);
      const main: HTMLElement = document.createElement('main');
      main.innerText = review.rComments;
      reviewContainer.appendChild(main);
      fragment.appendChild(reviewContainer);
    });
    
    const section: HTMLElement = this.iframe.contentDocument.getElementById('CUNYFIRST_PRO-Content');
    section.innerHTML = ''; // Remove anything that was there before
    section.appendChild(fragment);
  }
  
  fetchProfReviews(profId: string): void {
    chrome.runtime.sendMessage({ type: 'getProfReviews', data: { profId } });
  }

  update(profName: string, profId: string): void {
    if (this.containerRef && profId === this.profId) return;
    
    if (!this.containerRef) this.createPopup();
    this.profName = profName;
    this.profId = profId;
    this.fetchProfReviews(profId);
  }

  stop(): void {
    console.log('Stopping ReviewsPopup');
    // Remove the DOM stuff
    this.iframe.contentDocument.body.removeChild(this.containerRef);
    this.containerRef = null;
  }
}

export { ReviewsPopup };

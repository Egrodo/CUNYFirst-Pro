import css from './ReviewsPopup.css';

// This component controls the popup box that shows the user professor reviews when they click on the preview button

type reviewResponse = {
  profReviews: profReview[];
  remaining: number;
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

class ReviewsPopup {
  iframe: HTMLIFrameElement;
  profName: string;
  profId: string;
  remaining: number;
  listenerRef: Function;
  containerRef: HTMLElement | null;

  constructor(iframe: HTMLIFrameElement, profName: string, profId: string) {
    console.log('Starting ReviewsPopup');
    this.iframe = iframe;
    this.profName = profName;
    this.profId = profId;
    this.containerRef = null;

    this.fetchProfReviews(profId);
    this.createPopup();

    this.listenerRef = ({ type, data }: { type: string, data: reviewResponse }): void => {
      if (type === 'profReviews') {
        this.remaining = data.remaining;
        this.updatePopup(data.profReviews);
      }
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
        const headerUndertext: HTMLElement = document.createElement('h2');
        headerUndertext.innerText = 'Reviews';
        header.appendChild(headerText);
        header.appendChild(headerUndertext);
        header.appendChild(closeBtn);
      const section: HTMLElement = document.createElement('section');
      section.id = 'CUNYFIRST_PRO-Content';
      this.containerRef.appendChild(header);
      this.containerRef.appendChild(section);

    this.iframe.contentDocument.body.appendChild(this.containerRef);
    this.containerRef.focus(); // Give it focus so user can scroll it without clicking.

    const style: HTMLStyleElement = document.createElement('style');
    style.type = "text/css"
    style.innerText = css;

    this.iframe.contentDocument.body.appendChild(style);
  }

  closePopup(): void {
    console.log('Closing popup');
   
    if (this.containerRef) {
      try {
        this.iframe.contentDocument.body.removeChild(this.containerRef);
      } catch(err) {
        console.log('Container is already removed from the body, no need to remove again.');
      }
      this.containerRef = null;
    }
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
      overallRating.innerText = `Rating: ${Math.round(Number(review.rOverallString))}/5`;
      overallRating.style.color = '#ff4444';
      aside.appendChild(overallRating);
      const classTaken: HTMLElement = document.createElement('h4');
      classTaken.innerText = `Class: ${review.rClass}`;
      aside.appendChild(classTaken);
      const difficulty: HTMLElement = document.createElement('h4');
      difficulty.innerText = `Difficulty: ${Math.round(Number(review.rEasyString))}/5`;
      aside.appendChild(difficulty);
      const wouldTakeAgain: HTMLElement = document.createElement('h4');
      wouldTakeAgain.innerText = `Would take again: ${review.rWouldTakeAgain}`;
      aside.appendChild(wouldTakeAgain);
      reviewContainer.appendChild(aside);
      const main: HTMLElement = document.createElement('main');
      main.innerText = review.rComments;
      reviewContainer.appendChild(main);
      fragment.appendChild(reviewContainer);
    });
    
    if (this.remaining > 0) {
      const remainingContainer: HTMLDivElement = document.createElement('div');
      remainingContainer.id = 'CUNYFIRST_PRO-RemainingContainer';
        const remainingLink: HTMLAnchorElement = document.createElement('a');
        remainingLink.href = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${this.profId}`;
        remainingLink.target = '_blank';
        remainingLink.rel = 'noopener noreferrer';
        remainingLink.innerText = 'See More Reviews';
      remainingContainer.appendChild(remainingLink);  
      fragment.appendChild(remainingContainer);
    }

    const section: HTMLElement = this.iframe.contentDocument.getElementById('CUNYFIRST_PRO-Content');
    section.innerHTML = ''; // Remove anything that was there before
    section.appendChild(fragment);

    // Once it's appended, scroll back to the top if not already
    section.scrollTop = 0;

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
    // Remove the DOM stuff if it's still there for some reason.
    this.closePopup();
  }
}

export { ReviewsPopup };

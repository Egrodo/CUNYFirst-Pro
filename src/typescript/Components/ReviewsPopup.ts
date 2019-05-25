import interact from 'interactjs';
// TODO: Does this load automatically?

// This component controls the popup box that shows the user professor reviews when they click on the preview button

class ReviewsPopup {
  profId: string;

  constructor(profId: string) {
    console.log('Starting ReviewsPopup');
    this.profId = profId;

    // Create the floating window
    const domString: string = `
      <aside id="CUNYFIRST_PRO-Container">
        <header id="CUNYFIRST_PRO-Header">
          Professor Name
        </header>
        <section id="CUNYFIRST_PRO-Content">
          <h1>Awesome<h1>
          <div id="CUNYFIRST_PRO-TagContainer">
            <span>CLEAR GRADING CRITERIA</span><span>RESPECTED</span><span>CARING</span>
          </div>
          <div id="CUNYFIRST_PRO-Content">
            Professor Pacellas class is very interactive. She takes pride in teaching. She makes her students feel welcomed. I would definitely recommend her class. She is sweet!
          </div>
        </section>
      </aside>
    `;

    this.fetchProfReviews(profId);
  }

  fetchProfReviews(profId: string): void {
    chrome.runtime.sendMessage({ type: 'getProfReviews', data: { profId } });
  }

  update(profId: string): void {
    console.log('Updating ReviewsPopup');
    this.profId = profId;
  }

  stop(): void {
    console.log('Stopping ReviewsPopup');
    // Remove the DOM stuff.
  }
}

export { ReviewsPopup };

// This component controls the popup box that shows the user professor reviews when they click on the preview button

class ReviewsPopup {
  profId: string;
  
  constructor(profId: string) {
    console.log("Starting ReviewsPopup");
    this.profId = profId;
  }

  update(profId: string) {
    console.log("Updating ReviewsPopup");
    this.profId = profId;
  }

  stop() {
    console.log("Stopping ReviewsPopup");
    // Remove the DOM stuff.
  }
}

export { ReviewsPopup };
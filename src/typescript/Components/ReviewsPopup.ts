// This component controls the popup box that shows the user professor reviews when they click on the preview button

type review = {
  rating: string;
  review: string;
};

class ReviewsPopup {
  profName: string;
  reviewsList: review[];

  start(profName: string, reviewsList: review[]) {
    console.log("Starting ReviewsPopup");
    this.profName = profName;
    this.reviewsList = reviewsList;
  }

  update(profName: string, reviewsList: review[]) {
    console.log("Updating ReviewsPopup");
    this.profName = profName;
    this.reviewsList = reviewsList;
  }

  stop() {
    console.log("Stopping ReviewsPopup");
    // Remove the DOM stuff.
  }
}

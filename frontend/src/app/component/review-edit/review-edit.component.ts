import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {review} from "../../_models/review.model";
import {User} from "../../_models";
import {DataService} from "../../data.service";
import {ActivatedRoute, Router} from "@angular/router";
import {indicator} from "../../_models/indicator.model";

@Component({
  selector: 'app-review-edit',
  templateUrl: './review-edit.component.html',
  styleUrls: ['./review-edit.component.css']
})
export class ReviewEditComponent implements OnInit {

  currentUser: User;
  indicatorQuality: number;
  articleClarity: number;
  articleData: number;
  articleAnalysis: number;
  articleConclusion: number;
  articleContribution: number;

  formGroup: FormGroup = new FormGroup({
    _id: new FormControl(null),
    indicatorId: new FormControl(null),
    name: new FormControl(''),
    indicatorQuality: new FormControl(null, Validators.required),
    indicatorQualityNote: new FormControl(''),
    articleClarity: new FormControl(null, Validators.required),
    articleClarityNote: new FormControl(''),
    articleData: new FormControl(null, Validators.required),
    articleDataNote: new FormControl(''),
    articleAnalysis: new FormControl(null, Validators.required),
    articleAnalysisNote: new FormControl(''),
    articleConclusion: new FormControl(null, Validators.required),
    articleConclusionNote: new FormControl(''),
    articleContribution: new FormControl(null, Validators.required),
    articleContributionNote: new FormControl(''),
  });
  reviewId: any;
  private review: review;
  indicator: indicator = {indicatorName: 'Hey, you went here directly by link!', };

  constructor(readonly dataService: DataService, private router: Router, private route: ActivatedRoute) {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.reviewId = this.route.snapshot.params.id;
    if (this.router.getCurrentNavigation().extras.state && this.router.getCurrentNavigation().extras.state.additionalInfo) {
      this.indicator = this.router.getCurrentNavigation().extras.state.additionalInfo.indicator;
      this.dataService.getReviewByIndicatorIdAndUsername(this.indicator.indicatorId, this.currentUser.username).subscribe((reviews: review[]) => {
        if (reviews.length > 0) {
          this.router.navigate([`review/${reviews[0]._id}/edit`], {state: {additionalInfo: {indicator: this.indicator}}});
        }
      })
    } else {
      this.router.navigate([""]);
    }
  }

  ngOnInit() {
    this.formGroup.controls['indicatorId'].setValue(this.indicator ? this.indicator.indicatorId: 0)
    this.formGroup.controls['name'].setValue(this.currentUser.username)


    if (this.reviewId) {
      this.dataService.getReviewById(this.reviewId).subscribe((reviews: review[]) => {
        if (reviews.length > 0) {
          this.review = reviews[0];
          this.initializeForm(this.review);
        }
      })
    }
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    if (!this.indicator) {
      console.log('you entered this page by Link, no? Naughty Boy!')
      return;
    }
    if (!this.formGroup.valid) {
      return;
    }
    const saveReview$ = this.reviewId ?
      this.dataService.editReview(this.formGroup.value) :
    this.dataService.addReview(this.formGroup.value);
    saveReview$.subscribe(savedRating => {
      this.router.navigate(['/']);
    });
  }

  ratingChanged(formControlName: string, rating: number) {
    this.formGroup.controls[formControlName].setValue(rating);
  }

  private initializeForm(review: review) {
    this.formGroup.setValue(review);
    this.indicatorQuality = review.indicatorQuality;
    this.articleClarity = review.articleClarity;
    this.articleData = review.articleData;
    this.articleAnalysis = review.articleAnalysis;
    this.articleConclusion = review.articleConclusion;
    this.articleContribution = review.articleContribution;
  }

  deleteReview() {
    this.dataService.deleteReview(this.formGroup.controls['_id'].value).subscribe(savedRating => {
      this.router.navigate(['/']);
    });
  }
}

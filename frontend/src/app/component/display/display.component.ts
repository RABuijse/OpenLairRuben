import {
  Component,
  OnInit,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef,
  TemplateRef,
  Pipe,
  PipeTransform,
} from "@angular/core";
import { DataService } from "../../data.service";
import { Router } from "@angular/router";
import { data } from "../../_models/data.model";
import { MatSnackBar } from "@angular/material";
import { MatDialog } from "@angular/material/dialog";
import { NgModel } from "@angular/forms";
import { BrowserModule, DomSanitizer } from "@angular/platform-browser";
// This element import needs top stay!!! Very important
import { element } from "protractor";
import { ChartHelperService } from "src/app/chart-helper.service";
import {review} from "../../_models/review.model";
import {Observable} from "rxjs";
import {LearningEvent} from "../../_models/learningEvent.model";
import {map, tap} from "rxjs/operators";
import {indicator} from "../../_models/indicator.model";

@Component({
  selector: "app-display",
  templateUrl: "./display.component.html",
  styleUrls: ["./display.component.css"],
})
export class DisplayComponent implements OnInit {
  @ViewChild("secondDialog", {static: true}) secondDialog: any;
  @ViewChild("reviewDialog", {static: true}) reviewDialog: any;
  name = [];
  dropdownSettings: any;
  data: LearningEvent[];
  options = []; // learning events options
  searchInd: string; //textbox value
  searchMat: string; //textbox value
  learningEvents = [];
  element = document.getElementById("header");

  ind_list = [];
  metrics: any;
  metrics_list: string[];
  reviews: review[];
  loggedIn: any;
  learningEvents$: Observable<LearningEvent[]>;
  learningEventsOptions$: Observable<string[]>;
  selectedLearningEvents$: Observable<LearningEvent[]>;
  learningActivitiesOptions$: Observable<string[]>;
  tableData$: Observable<LearningEvent[]>;
  checkedMap: Map<string, boolean> = new Map<string, boolean>();
  indicatorMap: Map<string, indicator> = new Map<string, indicator>();
  private allEventOptions: string[];
  selectedLearningEvents: string[] = [];
  selectedLearningActivities: string[] = [];

  constructor(
    private dataService: DataService,
    private chartHelperService: ChartHelperService,
    private router: Router,
    private snackbar: MatSnackBar,
    public dialog: MatDialog,
    private sanitizer: DomSanitizer,
  ) {
    this.loggedIn = JSON.parse(localStorage.getItem('currentUser'));
    this.learningEvents$ = this.dataService.getdata();
  }

  ngOnInit() {
    this.fetchdata();
    this.loadScript();
    this.dropdownSettings = {
      singleSelection: false,
      idField: "item_id",
      textField: "item_text",
      selectAllText: "Select All",
      unSelectAllText: "Deselect All",
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }

  // function of fetching data from database
  fetchdata() {
    const previousSelectedEvents: string[] = JSON.parse(localStorage.getItem('selectedEventsInit'));
    const previousSelectedActivities: string[] = JSON.parse(localStorage.getItem('selectedActivitiesInit'));
    const previousSelectedIndicators: indicator[] = JSON.parse(localStorage.getItem('selectedIndicatorsInit'));
    this.learningEventsOptions$ = this.learningEvents$.pipe(
      map(learningEvents => {
        return learningEvents.map(learningEvent => {
          return learningEvent.LearningEvents
        })
      }),
      tap(options => {
        this.allEventOptions = options;
        this.initFromLocalStorage(previousSelectedEvents, previousSelectedActivities, previousSelectedIndicators);
      })
    )
  }

  private initFromLocalStorage(events: string[], activities: string[], indicators: indicator[]) {
    if (events) {
      this.onEventValueChange(events);
      this.selectedLearningEvents = events;
    } else {
      this.onEventValueChange(this.allEventOptions);
    }
    if (activities) {
      this.selectedLearningActivities = activities;
      this.onActivitySelectChange();
    }
    if (indicators) {
      indicators.forEach(indicator => {
        const indicatorReference = DisplayComponent.retrieveIndicatorReference(indicator.indicatorName);
        this.checkedMap.set(indicatorReference, true);
        this.indicatorMap.set(indicatorReference, indicator)
      })
      localStorage.setItem("selectedIndicatorsInit", JSON.stringify(indicators))
      this.ind_list = indicators.map(indicator => indicator.indicatorName);
    }
  }

  onEventValueChange(eventValue: string[]) {
    if (eventValue.length === 0) {
      eventValue = this.allEventOptions;
    }
    this.resetTable(true);
    this.selectedLearningEvents$ = this.learningEvents$.pipe(
      map(learningEvents => {
        return learningEvents.filter(learningEvent => eventValue.includes(learningEvent.LearningEvents));
      }));

    this.tableData$ = this.selectedLearningEvents$;

    this.learningActivitiesOptions$ = this.tableData$.pipe(
      map(learningEvents => {
        return [].concat(...learningEvents.map(learningEvent => learningEvent.LearningActivities))
      }),
      map(learningActivities => {
        return [...new Set(learningActivities.map(learningActivity => learningActivity.Name))];
      })
    )

    setTimeout(() => {
      localStorage.setItem("selectedEventsInit", JSON.stringify(this.selectedLearningEvents));
    });
  }


  private resetTable(withActivities?: boolean) {
    if (withActivities) {
      this.selectedLearningActivities = []; //empty the seleted list of Activities after event change
      localStorage.removeItem("selectedActivitiesInit");
    }
    this.ind_list = [];  //empty the seleted list of indicators after event an Event change
    this.indicatorMap.clear();
    this.checkedMap.clear();
    localStorage.removeItem("selectedIndicatorsInit")
    this.searchInd = ""; //empty
    this.searchMat = ""; //empty
  }

/////////////// function for learning activities selection /////////////
  onActivitySelectChange() {
    this.resetTable();
    this.determineTableDataBySelectedEventsAndActivities();
    setTimeout(() => {
      localStorage.setItem("selectedActivitiesInit", JSON.stringify(this.selectedLearningActivities));
    });
  }

  private determineTableDataBySelectedEventsAndActivities() {
    if (this.selectedLearningActivities.length === 0) {
      this.tableData$ = this.selectedLearningEvents$
    } else {
      this.tableData$ = this.selectedLearningEvents$.pipe(
        // remove Activites from Events which are not selected
        map(learningEvents => {
          return learningEvents.map(learningEvent => {
            learningEvent.LearningActivities = learningEvent.LearningActivities.filter(activity => {
              return this.selectedLearningActivities.includes(activity.Name);
            })
            return learningEvent;
          })
        }),
        // remove Events which have no Activity left
        map(learningEvents => {
          return learningEvents.filter(learningEvent => learningEvent.LearningActivities.length > 0);
        })
      );
    }
  }

  ////////////////pop up by click Indicator to show meterics ///////////
  getMeterics(indicator: any) {
    this.metrics_list = indicator.metrics.split(",");
    this.dialog.open(this.secondDialog);
  }


  ///////////////////   search by indicator ///////////////
  searchIndicator(search: any) {
  }


  ///////////////////   search by metrics ///////////////
  learningEventsChangeOnSearch(search: any) {
  }


  ////////////////// function for checkbox to select indicator   //////////////////
  onCheckboxChange(indic: indicator) {
    const indicatorId = DisplayComponent.retrieveIndicatorReference(indic.indicatorName);
    const checked = !this.checkedMap.get(indicatorId)
    this.checkedMap.set(indicatorId, checked);
    if (checked) {
      this.ind_list.push(indic.indicatorName)
      this.indicatorMap.set(indicatorId, indic);
    } else {
      const index = this.ind_list.indexOf(indic.indicatorName);
      if (index !== -1) {
        this.ind_list.splice(index, 1);
        this.indicatorMap.set(indicatorId, null);
      }
    }
    setTimeout(() => {
      localStorage.setItem("selectedIndicatorsInit", JSON.stringify([...this.indicatorMap.values()].filter(i => i)));
    });
  }

  atLeastOneChecked() {
    return [...this.checkedMap.values()].includes(true);
  }

  textClicked() {
    const selectedIndicatorList = [...this.indicatorMap.values()].filter(indicator => indicator);
    const mimeType = 'text/plain';
    const filename = 'Indicators TEXT.txt';
    if (selectedIndicatorList.length > 0) {
      const content = selectedIndicatorList.map((indicator, index) => {
        return `${index + 1} Indicator Name: ${indicator.indicatorName}\n\tMetrics: Metrics: ${indicator.metrics}\n\n`
      }).join('')

      var a = document.createElement('a')
      var blob = new Blob([content], {type: mimeType})
      var url = URL.createObjectURL(blob)
      a.setAttribute('href', url)
      a.setAttribute('download', filename)
      a.click()
    } else {
      window.alert("No indicator is selected");
    }

  }

  jsonClicked() {
    const selectedIndicatorList = [...this.indicatorMap.values()].filter(indicator => indicator);
    if (selectedIndicatorList.length > 0) {
      const indicatorObjects = selectedIndicatorList.map(indicator => {
        return {[indicator.indicatorName]: indicator.metrics.split(",")}
      })

      // Convert the text to BLOB.
      let textToBLOB = new Blob(
        [
          JSON.stringify({
            indicator: indicatorObjects,
          }),
        ],
        {type: "application/json"}
      );

      let sFileName = "indicators JSON.json"; // The file to save the data.

      let newLink = document.createElement("a");
      newLink.download = sFileName;
      if ((window as any).webkitURL != null) {
        newLink.href = (window as any).webkitURL.createObjectURL(textToBLOB);
      } else {
        newLink.href = window.URL.createObjectURL(textToBLOB);
        newLink.style.display = "none";
        // document.body.appendChild(newLink);
      }
      newLink.click();
    } else {
      window.alert("No indicator is selected");
    }
  };

  reset() {
    localStorage.removeItem("selectedEventsInit");
    localStorage.removeItem("selectedActivitiesInit");
    localStorage.removeItem("selectedIndicatorsInit");
    this.ind_list = [];
    this.checkedMap.clear();
    this.indicatorMap.clear();
    this.selectedLearningEvents = [];
    this.onEventValueChange(this.allEventOptions);
    localStorage.removeItem("check");
  }

  /*
    This function pushes all selected indicators in an array
    and stores them in localStorage, so the drop down menu in the dashboard page can display the selected indicators even after refreshing the page
    We also store the "check" property in localStorage so the check marks stay checked when the user returns to the display component
    */
  visualizeClicked() {
    const indicatorNames: string[] = [];
    const indicatorReferences: string[] = [];
    //our Map of selected indicators is transformed to an Array of [indicatorReference, indicator]
    [...this.indicatorMap.entries()].forEach(array => {
      if (array[1]) {
        indicatorReferences.push(array[0]);
        indicatorNames.push(array[1].indicatorName);
      }
    })

    //this.chartHelperService.setSettings("selectedLearningEvents", selectedLearningEvents);
    this.chartHelperService.setSettings("selectedIndicators", indicatorNames);
    this.chartHelperService.setSettings("referenceNumbers", indicatorReferences);
    if (indicatorNames.length > 0) {
      localStorage.setItem("selectedEventsInit", JSON.stringify(this.selectedLearningEvents));
      localStorage.setItem("selectedActivitiesInit", JSON.stringify(this.selectedLearningActivities));
      localStorage.setItem("selectedIndicatorsInit", JSON.stringify([...this.indicatorMap.values()].filter(i => i)));
      this.router.navigate(["/dashboard"]);
    } else {
      window.alert("No indicator is selected");
    }
  };

  backToTop() {
    this.element.scrollIntoView({behavior: "smooth"});
  }

  //will solve the issue of comming back from another page
  loadScript() {
    let node = document.createElement("script"); // create script tag
    node.src = "assets/js/tooltipJS.js"; // set source
    node.type = "text/javascript";
    node.async = true; // makes script run asynchronously
    node.charset = "utf-8";
    // append to head of document
    document.getElementsByTagName("head")[0].appendChild(node);
  }

  onReview(indic: any) {
    const indicatorId = DisplayComponent.retrieveIndicatorReference(indic.indicatorName);
    this.dialog.open(this.reviewDialog, {data: {...indic, indicatorId: indicatorId}});
  }

  static retrieveIndicatorReference(name: string) {
    return name.match(/\[.*?]/g)[0];
  }

  logIn() {
    this.router.navigate(['/login'], {state: {url: '/', additionalInfo: null}});
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.loggedIn = undefined;
  }
}

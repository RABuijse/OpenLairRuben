import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {indicator} from "../../../_models/indicator.model";
import {DisplayComponent} from "../display.component";

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  @Input()
  data: any;

  @Input()
  searchInd: string;

  @Input()
  searchMat: string;

  @Input()
  checkedMap: Map<string, boolean>;

  @Output()
  checkboxEmitter: EventEmitter<indicator> = new EventEmitter<indicator>()

  @Output()
  getMetericsEmitter: EventEmitter<any> = new EventEmitter<any>()

  @Output()
  onReviewEmitter: EventEmitter<any> = new EventEmitter<any>()

  constructor() { }

  ngOnInit() {
  }

  onCheckboxChange(indic: indicator) {
    this.checkboxEmitter.emit(indic)
  }

  protected readonly DisplayComponent = DisplayComponent;
}

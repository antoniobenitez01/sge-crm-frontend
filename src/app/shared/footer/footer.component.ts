import { Component, OnInit } from '@angular/core';
import { version } from '../../../../package.json';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  yyyy: number;
  version: string;
  constructor() { }

  ngOnInit() {
    this.yyyy = new Date().getFullYear();
    this.version = version;
  }

}

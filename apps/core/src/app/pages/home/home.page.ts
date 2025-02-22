import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'comen-home',
    templateUrl: './home.page.html',
    styleUrls: [
        './home.page.scss'
    ]
})
// eslint-disable-next-line
export class HomePage {

    platform$: Subject<string> = new BehaviorSubject('bilibili');

    roomId = new FormControl('123456');

    generatedLink = combineLatest([this.platform$, this.roomId.valueChanges.pipe(startWith(this.roomId.value))]).pipe(
        map(([platform, id]) => {
            return `${window.location.origin}/${platform}/${id}`
        })
    )

    constructor(private title: Title) {
        title.setTitle('主页');
    }

    setPlatform(platform: string) {
        this.platform$.next(platform);
    }

    clickLink(event:Event){
        (event.target as HTMLInputElement).select();
        document.execCommand('copy');
    }
}
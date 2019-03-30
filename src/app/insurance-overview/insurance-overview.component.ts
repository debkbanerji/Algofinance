import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireDatabase, } from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-insurance-overview',
    templateUrl: './insurance-overview.component.html',
    styleUrls: ['./insurance-overview.component.css'],
})
export class InsuranceOverviewComponent implements OnInit {

    public insuranceItems: Observable<any[]>;

    constructor(private db: AngularFireDatabase,
                public authService: AuthService,
                private router: Router,
                private ngZone: NgZone
    ) {
        const component = this;
        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                const path = '/user-insurance-lists/' + auth.uid;
                component.ngZone.run(function () {
                    component.insuranceItems = db.list(path).valueChanges();
                });
            } else {
                component.ngZone.run(function () {
                    component.router.navigate(['']);
                });
            }
        });
    }

    ngOnInit() {
    }

}

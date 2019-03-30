import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireDatabase, AngularFireList,} from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-insurance-overview',
    templateUrl: './insurance-overview.component.html',
    styleUrls: ['./insurance-overview.component.css'],
})
export class InsuranceOverviewComponent implements OnInit {

    public insuranceItemsValueChanges: Observable<any[]>;
    private insuranceItemsList: AngularFireList<any>;

    public newName: string;
    public newCost: number;
    public newDescription: string;
    public newImportance: number;

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
                    component.insuranceItemsList = db.list(path);
                    component.insuranceItemsValueChanges = component.insuranceItemsList.valueChanges();
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

    onAddInsuranceItemSubmit() {
        // const component = this;
        // if (component.newCost)
        // let shouldAdd = false;
        //
        // if (shouldAdd) {

        //}
    }

    addInsuranceItem(name, cost, description, importance) {
        this.insuranceItemsList.push({
            'name': name,
            'cost': cost,
            'description': description,
            'importance': importance
        });
    }

}

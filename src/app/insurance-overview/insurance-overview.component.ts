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

    public userUID: string;

    constructor(private db: AngularFireDatabase,
                public authService: AuthService,
                private router: Router,
                private ngZone: NgZone
    ) {
        const component = this;
        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                const path = '/user-insurance-lists/' + auth.uid;
                component.userUID = auth.uid;
                component.ngZone.run(function () {
                    component.insuranceItemsList = db.list(path);
                    component.insuranceItemsValueChanges = component.insuranceItemsList.snapshotChanges();

                });
            } else {
                component.ngZone.run(function () {
                    component.router.navigate(['login']);
                });
            }
        });
    }

    ngOnInit() {
    }

    onAddInsuranceItemSubmit() {
        const component = this;
        this.addInsuranceItem(component.newName, component.newCost, component.newDescription, component.newImportance);
    }

    addInsuranceItem(name, cost, description, importance) {
        this.insuranceItemsList.push({
            'name': name,
            'cost': cost,
            'description': description,
            'importance': importance
        });
    }
    onRemoveInsuranceItemSubmit(item: any) {
        this.db.object('/user-insurance-lists/' + this.userUID + '/' + item.key).set(null);
    }

    onUpdateInsuranceItemSubmit(item: any, importance, cost) {
        console.log(importance);
        this.db.object('/user-insurance-lists/' + this.userUID + '/' + item.key)
            .update({'cost': +cost['value'], 'importance': +importance['value']});
    }



}

import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireDatabase, AngularFireList,} from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
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

    public budget: number = 500;

    constructor(private db: AngularFireDatabase,
                public authService: AuthService,
                private router: Router,
                private route: ActivatedRoute,
                private ngZone: NgZone
    ) {
        const component = this;
        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                component.userUID = auth.uid;
                const isAdminObject = component.db.object('/agent-profiles/' + component.userUID);
                isAdminObject.query.once('value').then((existsResult) => {
                    if (existsResult.exists()) {
                        component.route.queryParams.subscribe(params => {
                            const targetUID = params['uid'];
                            const targetObject = component.db.object('/user-insurance-lists/' + targetUID);
                            targetObject.query.once('value').then((listExistsResult) => {
                                if (listExistsResult.exists()) {
                                    component.initializeList(targetUID);
                                } else {
                                    component.router.navigate(['']);
                                }
                            });
                        });
                    } else {
                        component.initializeList(auth.uid);
                    }
                });
            } else {
                component.ngZone.run(function () {
                    component.router.navigate(['login']);
                });
            }
        });
    }

    private initializeList(uid) {
        const component = this;
        component.userUID = uid;
        const path = '/user-insurance-lists/' + uid;
        component.ngZone.run(function () {
            component.insuranceItemsList = component.db.list(path);
            component.insuranceItemsValueChanges = component.insuranceItemsList.snapshotChanges();

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

    calculateInsurance() {
        const component = this;
        // TODO: Budget checks
        component.router.navigate(['calculate-policy'], {queryParams: {budget: component.budget}});
    }

}

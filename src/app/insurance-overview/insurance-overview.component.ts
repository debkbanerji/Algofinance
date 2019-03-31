import {Component, NgZone, OnInit} from '@angular/core';
import {AngularFireDatabase, AngularFireList, AngularFireObject,} from '@angular/fire/database';
import {AuthService} from '../providers/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {el} from "@angular/platform-browser/testing/src/browser_util";

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
    public newImportance: number = 1;

    private defaultURL = 'https://s3.amazonaws.com/peoplepng/wp-content/uploads/2018/12/16175848/Insurance.png';

    public userUID: string;
    public userName: string;
    public clientName: string;

    public commentListChanges: Observable<any[]>;
    public commentList: AngularFireList<any>;
    public numCommentsChanges: Observable<any>;
    public numComments: AngularFireObject<number>;

    public newCommentText: string;

    public budget: number;
    public isAgent: boolean = false;

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
                        component.isAgent = true;
                        component.ngZone.run(function () {
                            component.userName = existsResult.val()['display-name'];
                        });
                        component.route.queryParams.subscribe(params => {
                            const targetUID = params['uid'];
                            if (targetUID) {
                                const targetObject = component.db.object('/user-insurance-lists/' + targetUID);
                                targetObject.query.once('value').then((listExistsResult) => {
                                    if (listExistsResult.exists()) {
                                        component.initializeList(targetUID);
                                        const clientInfoObject = component.db.object('/user-profiles/' + targetUID);
                                        clientInfoObject.query.once('value').then((clientInfoResult) => {
                                            component.ngZone.run(function () {
                                                component.clientName = clientInfoResult.val()['display-name'];
                                            });
                                        });
                                    } else {
                                        component.router.navigate(['']);
                                    }
                                });
                            } else {
                                component.isAgent = false;
                                component.initializeList(auth.uid);
                                component.ngZone.run(function () {
                                    component.clientName = component.userName;
                                });
                            }
                        });
                    } else {
                        const userInfoObject = component.db.object('/user-profiles/' + component.userUID);
                        userInfoObject.query.once('value').then((clientInfoResult) => {
                            component.ngZone.run(function () {
                                component.userName = clientInfoResult.val()['display-name'];
                                component.clientName = clientInfoResult.val()['display-name'];
                            });
                        });
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
        const insurancePath = '/user-insurance-lists/' + uid;
        const commentsPath = '/comments/' + uid;
        const commentsCountPath = '/comments-count/' + uid;
        component.ngZone.run(function () {
            component.insuranceItemsList = component.db.list(insurancePath);
            component.insuranceItemsValueChanges = component.insuranceItemsList.snapshotChanges();
            component.commentList = component.db.list(commentsPath, ref => ref.orderByChild('num').limitToLast(6));
            component.commentListChanges = component.commentList.snapshotChanges();
            component.numComments = component.db.object(commentsCountPath);
            component.numCommentsChanges = component.numComments.snapshotChanges();
        });
    }

    ngOnInit() {
    }

    onAddInsuranceItemSubmit() {
        const component = this;
        this.addInsuranceItem(component.newName, component.newCost, component.newDescription, component.newImportance);
    }

    addInsuranceItem(name, cost, description, importance) {
        if (name && description && (cost !== null) && (cost !== undefined)) {
            this.insuranceItemsList.push({
                'name': name,
                'cost': cost,
                'description': description,
                'importance': importance,
                'url': this.defaultURL
            });
            this.newCost = null;
            this.newDescription = '';
            this.newName = '';
        }
    }

    onRemoveInsuranceItemSubmit(item: any) {
        this.db.object('/user-insurance-lists/' + this.userUID + '/' + item.key).set(null);
    }

    onUpdateInsuranceItemSubmit(item: any) {
        const element: any = document.getElementById('cost-' + item['key']);
        const cost = element.value;
        const importance = document.getElementById('importance-' + item['key']).getAttribute('aria-valuenow');
        this.db.object('/user-insurance-lists/' + this.userUID + '/' + item.key)
            .update({'cost': cost, 'importance': importance});
    }

    calculateInsurance() {
        const component = this;
        if (component.budget > 0) {
            component.router.navigate(['calculate-policy'], {queryParams: {budget: component.budget}});
        }
    }

    verifyCost(fieldId) {
        let element: any = document.getElementById(fieldId);
        let cost = element.value;
        cost = Math.max(0, cost);
        cost = +cost.toFixed(2);
        element.value = cost;
    }

    verifyBudget() {
        this.budget = Math.max(0, this.budget);
        this.budget = +this.budget.toFixed(2);
    }

    verifyNewCost() {
        this.newCost = Math.max(0, this.newCost);
        this.newCost = +this.newCost.toFixed(2);
    }

    makeComment() {
        const component = this;
        if (component.newCommentText) {
            component.numComments.query.once('value').then((result) => {
                component.numComments.set(result.val() + 1);
                component.commentList.push({
                    'name': component.userName,
                    'text': component.newCommentText,
                    'num': result.val()
                });
                component.newCommentText = '';
            });
        }
    }
}

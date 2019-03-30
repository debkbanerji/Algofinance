import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../providers/auth.service";
import {AngularFireDatabase} from "@angular/fire/database";

@Component({
    selector: 'app-calculate-policy',
    templateUrl: './calculate-policy.component.html',
    styleUrls: ['./calculate-policy.component.css']
})
export class CalculatePolicyComponent implements OnInit {

    public budget: number;

    public currentState: number = 0;
    // Loading state flags
    public notLoaded = 0;
    public retrievingData = 1;
    public transformingInputData = 2;
    public runningKnapsack = 3;
    public consolidatingResults = 4;
    public almostDone = 5;
    public done = 6;

    public stepDelta = 100;

    public resultInsuranceItems = [];


    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private zone: NgZone,
        private db: AngularFireDatabase) {
    }

    ngOnInit() {
        const component = this;
        component.route.queryParams.subscribe(params => {
            component.budget = params['budget'];
            if (!component.budget) {
                component.zone.run(() => {
                    component.router.navigate(['']);
                });
            }
            component.authService.afAuth.auth.onAuthStateChanged((auth) => {
                if (auth != null) {
                    component.zone.run(function () {
                        component.currentState = component.retrievingData;
                        const uid = auth.uid;
                        const insuranceListPath = component.db.object('/user-insurance-lists/' + auth.uid);
                        insuranceListPath.query.once('value').then((defaultResult) => {
                            component.zone.run(function () {
                                component.currentState = component.transformingInputData;
                                const inputObjects = defaultResult.val();
                                const keyset = Object.keys(inputObjects);
                                const inputItems = [];
                                for (let i = 0; i < keyset.length; i++) {
                                    const item = inputObjects[keyset[i]];
                                    inputItems.push({
                                        'id': i,
                                        'cost': item['cost'],
                                        'importance': item['importance']
                                    });
                                }

                                const weights = [];
                                const values = [];
                                for (let i = 0; i < inputItems.length; i++) {
                                    weights.push(Math.floor(inputItems[i]['cost'] * 100));
                                    values.push(Math.floor(inputItems[i]['importance']));
                                }

                                component.currentState = component.runningKnapsack;
                                const knapsackResult = component.knapsack(weights, values, Math.floor(component.budget * 100));
                                component.currentState = component.consolidatingResults;

                                const resultItems = [];
                                for (let i = 0; i < knapsackResult.length; i++) {
                                    resultItems.push(inputItems[knapsackResult[i]]);
                                }

                                component.currentState = component.almostDone;
                                setTimeout(() => {
                                    component.currentState = component.done;
                                    console.log(resultItems);
                                }, 750)
                            });
                        });
                    });
                } else {
                    component.zone.run(function () {
                        component.router.navigate(['login']);
                    });
                }
            });
        });
    }

    // Knapsack without repetition
    // Returns an array containing the indices of what items to take
    private knapsack(weights, values, capacity) {
        const n = weights.length;
        const W = capacity;
        const T = [];
        for (let i = 0; i < n + 1; i++) {
            T.push(Array(W + 1));
        }
        for (let i = 0; i < n + 1; i++) {
            for (let j = 0; j < W + 1; j++) {
                let entry = null;
                if (i == 0) {
                    entry = 0;
                } else {
                    let itemWeight = weights[i - 1];
                    let valueWithoutLastItem = T[i - 1][j];
                    if (itemWeight > j) {
                        entry = valueWithoutLastItem;
                    } else {
                        let valueWithLastItem = T[i - 1][j - itemWeight] + values[i - 1];
                        if (valueWithLastItem > valueWithoutLastItem) {
                            entry = valueWithLastItem;
                        } else {
                            entry = valueWithoutLastItem;
                        }
                    }
                }
                T[i][j] = entry;
            }
        }

        const solution = [];
        let i = n;
        let j = W;

        while (i > 0 && j > 0) {
            if (T[i - 1][j] !== T[i][j]) {
                solution.unshift(i - 1); // appending correct item index to front of solution
                j = j - weights[i - 1];
            }
            i = i - 1;
        }

        for (let i = 0; i < n; i++) {
            if (weights[i] == 0) {
                let inArray = false;
                for (let j = 0; j < solution.length; j++) {
                    inArray = inArray || (solution[j] == i);
                }
                if (!inArray) {
                    solution.push(i);
                }
            }
        }

        return solution;
    }
}


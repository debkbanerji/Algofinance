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

    public currentState = 0;
    // Loading state flags
    public notLoaded = 0;
    public retrievingData = 1;
    public transformingInputData = 2;
    public runningKnapsack = 3;
    public consolidatingResults = 4;
    public almostDone = 5;
    public done = 6;
    public achievedImportance = 0;
    public inputItems = [];
    public resultInsuranceItems = [];
    public moneySpent: number;
    public moneyUnspent: number;
    public unselectedItems;
    public calculationStartTime: number;
    public calculationTimeTaken: string;
    public remainingCost: number;

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private zone: NgZone,
        private db: AngularFireDatabase) {
    }

    navigateBack() {
        const component = this;
        component.zone.run(() => {
            component.router.navigate(['']);
        });
    }

    ngOnInit() {
        const component = this;
        component.calculationStartTime = new Date().getTime();
        component.route.queryParams.subscribe(params => {
            component.budget = params['budget'];
            if (!component.budget) {
                component.zone.run(() => {
                    component.router.navigate(['']);
                });
            }
            component.authService.afAuth.auth.onAuthStateChanged((auth) => {
                if (auth != null) {
                    setTimeout(() => {
                        component.zone.run(() => {
                            component.currentState = component.retrievingData;
                            const uid = auth.uid;
                            const insuranceListPath = component.db.object('/user-insurance-lists/' + auth.uid);
                            insuranceListPath.query.once('value').then((defaultResult) => {
                                setTimeout(() => {
                                    component.zone.run(() => {
                                        component.currentState = component.transformingInputData;
                                        const inputObjects = defaultResult.val();
                                        const keyset = Object.keys(inputObjects);
                                        component.inputItems = [];
                                        for (let i = 0; i < keyset.length; i++) {
                                            const item = inputObjects[keyset[i]];
                                            component.inputItems.push({
                                                'id': i,
                                                'cost': item['cost'],
                                                'importance': item['importance'],
                                                'name': item['name'],
                                                'description': item['description'],
                                                'url': item['url']

                                            });
                                        }


                                        let scalingFactor = 1;
                                        const problemSize = component.budget * component.inputItems.length;
                                        let maxViableProblemSize = 50000;
                                        if (problemSize > maxViableProblemSize) {
                                            scalingFactor = maxViableProblemSize / problemSize;
                                        }
                                        scalingFactor *= 100;

                                        const weights = [];
                                        const values = [];
                                        for (let i = 0; i < component.inputItems.length; i++) {
                                            weights.push(Math.ceil(component.inputItems[i]['cost'] * scalingFactor));
                                            values.push(Math.floor(component.inputItems[i]['importance']));
                                        }

                                        setTimeout(() => {
                                            component.zone.run(() => {
                                                component.currentState = component.runningKnapsack;
                                                const knapsackResult = component.knapsack(weights, values, Math.floor(component.budget * scalingFactor));
                                                setTimeout(() => {
                                                    component.zone.run(() => {
                                                        component.currentState = component.consolidatingResults;

                                                        const resultItems = [];
                                                        const notChosenItems = [];
                                                        const wasTakenArray = new Array(component.inputItems.length);
                                                        for (let i = 0; i < wasTakenArray.length; i++) {
                                                            wasTakenArray[i] = false;
                                                        }
                                                        for (let i = 0; i < knapsackResult.length; i++) {
                                                            wasTakenArray[knapsackResult[i]] = true;
                                                            resultItems.push(component.inputItems[knapsackResult[i]]);
                                                        }
                                                        for (let i = 0; i < wasTakenArray.length; i++) {
                                                            if (!wasTakenArray[i]) {
                                                                notChosenItems.push(component.inputItems[i]);
                                                            }
                                                        }
                                                        setTimeout(() => {
                                                            component.zone.run(() => {
                                                                component.currentState = component.almostDone;
                                                                setTimeout(() => {
                                                                    component.zone.run(() => {
                                                                        component.currentState = component.done;
                                                                        component.resultInsuranceItems = resultItems;
                                                                        component.displayResults(resultItems, notChosenItems);
                                                                    });
                                                                }, 1000)
                                                            });
                                                        }, 1000);
                                                    });
                                                }, 1000);
                                            });
                                        }, 1000);
                                    });
                                }, 1000);

                            });
                        });
                    }, 1000);
                } else {
                    component.zone.run(function () {
                        component.router.navigate(['login']);
                    });
                }
            });
        });
    }

    private displayResults(resultItems, notChosenItems) {
        const component = this;
        let total = 0;
        let spent = 0;
        let result = '';
        let remaining = +0;
        for (let i = 0; i < resultItems.length; i++) {
            total += parseInt(resultItems[i]['importance'], 10);
            spent += parseInt(resultItems[i]['cost'], 10);
        }
        let actual = 0;

        for (let i = 0; i < component.inputItems.length; i++) {
            actual += parseInt(component.inputItems[i]['importance'], 10);
        }
        for(let i = 0; i < notChosenItems.length; i++){
            result += notChosenItems[i]['name'] + ', ';
            remaining += parseInt(notChosenItems[i]['cost'], 10);
        }
        if (result.length > 2){
            component.unselectedItems = result.substr(0, result.length-2);

        }
        component.achievedImportance = Math.round(total / actual * 10000) / 100;
        const timeTakenMS = new Date().getTime() - component.calculationStartTime;
        component.calculationTimeTaken = (timeTakenMS / 1000).toFixed(3);
        component.moneySpent = spent;
        component.moneyUnspent = component.budget - spent;
        component.remainingCost = remaining - this.moneyUnspent;
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


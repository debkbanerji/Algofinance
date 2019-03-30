import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

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
    public runningKnapsack = 2;
    public consolidatingResults = 3;


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private zone: NgZone) {
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
        });
    }
}

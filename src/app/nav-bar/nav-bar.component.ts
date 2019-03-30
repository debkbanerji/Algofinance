import {Component, OnInit, ApplicationRef, OnDestroy, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit, OnDestroy {
    private isLoggedIn: boolean;
    private routerSubscription: Subscription;
    private currentRoute: string;
    public LOGO_URL: string;

    // public navBarItems: Array<any>;

    constructor(public authService: AuthService, private apRef: ApplicationRef,
                private router: Router, private route: ActivatedRoute,
                private zone: NgZone) {
    }

    ngOnInit() {

        const component = this;

        component.LOGO_URL = '/assets/images/navbar-logo.png';

        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            component.isLoggedIn = auth != null;
        });

        component.routerSubscription = component.route.url.subscribe(url => {
            component.zone.run(() => {
                if (url[0]) {
                    component.currentRoute = url[0].path;
                } else {
                    component.currentRoute = '';
                }
            });
        });
    }

    public logout() {
        this.navigateTo('logout');
    }

    public navigateTo(route) {
        const component = this;
        component.zone.run(() => {
            if (route === 'logout') {
                component.authService.logout();
                component.router.navigate(['login']);
            } else {
                component.router.navigate([route]);
            }
        });
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }
}

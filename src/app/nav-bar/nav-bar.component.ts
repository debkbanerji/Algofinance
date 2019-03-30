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
        // this.navBarItems = [
        //     {
        //         route: '',
        //         text: 'Home'
        //     },
        //     {
        //         route: 'logout', // Not actual route - caught by 'navigateTo' function
        //         text: 'Sign Out'
        //     }
        // ];

        this.LOGO_URL = '/assets/images/navbar-logo.png';

        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            this.isLoggedIn = auth != null;
            this.apRef.tick(); // For updating UI
        });

        this.routerSubscription = this.route.url.subscribe(url => {
            if (url[0]) {
                this.currentRoute = url[0].path;
            } else {
                this.currentRoute = '';
            }
        });
    }

    public logout() {
        this.authService.logout();
    }

    public navigateTo(route) {
        const component = this;
        if (route === 'logout') {
            component.zone.run(() => {
                component.authService.logout();
            });
        } else {
            component.zone.run(() => {
                component.router.navigate([route]);
            });
        }
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }
}

import {Component, OnInit, ApplicationRef, OnDestroy, NgZone} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs';
import {AngularFireDatabase} from "@angular/fire/database";
import {combineAll} from "rxjs/operators";

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

    public isHome: boolean;
    public isAgent: boolean;

    // public navBarItems: Array<any>;

    constructor(public authService: AuthService,
                private db: AngularFireDatabase,
                private apRef: ApplicationRef,
                private router: Router,
                private route: ActivatedRoute,
                private zone: NgZone) {
    }

    ngOnInit() {

        const component = this;

        component.LOGO_URL = '/assets/images/aflogo.png';

        component.authService.afAuth.auth.onAuthStateChanged((auth) => {
            component.isLoggedIn = auth != null;
        });

        component.routerSubscription = component.route.url.subscribe(url => {
            component.zone.run(() => {
                component.isHome = (url.length === 0);
                if (url[0]) {
                    component.currentRoute = url[0].path;
                } else {
                    component.currentRoute = '';
                }
                component.authService.afAuth.auth.onAuthStateChanged((auth) => {
                    if (auth != null) {
                        const isAdminObject = component.db.object('/agent-profiles/' + auth.uid);
                        isAdminObject.query.once('value').then((existsResult) => {
                            component.zone.run(() => {
                                component.isAgent = existsResult.exists();
                                const isViewingClient = url[0] && (url[0].path === 'view-clients');
                                if (component.isAgent) {
                                    component.isHome = isViewingClient;
                                } else if (isViewingClient) {
                                    component.navigateTo('');
                                }
                            })
                        });
                    }
                })
            });
        });
    }

    public logout() {
        this.navigateTo('logout');
    }

    public navigateHome() {
        this.navigateTo(this.isAgent ? 'view-clients' : '');
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

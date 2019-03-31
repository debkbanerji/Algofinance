import {Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import {Router} from '@angular/router';

import {AngularFireDatabase} from '@angular/fire/database';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
    private userDataSubscription: Subscription;
    public LOGO_URL: string;
    public GOOGLE_URL: string;
    public SMART_URL: string;
    public loginAsAgent: boolean;

    constructor(public authService: AuthService, private db: AngularFireDatabase, private router: Router, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.LOGO_URL = '/assets/images/logo.png';
        this.GOOGLE_URL = '/assets/images/google.png';
    }

    loginWithGoogle() {
        const component = this;
        this.authService.loginWithGoogle().then((loginData) => {
            this.authService.afAuth.auth.onAuthStateChanged((auth) => {
                if (auth != null) {
                    const profileObject = component.db.object('/' + (component.loginAsAgent ? 'agent' : 'user') + '-profiles/' + auth.uid);
                    profileObject.set({
                        'uid': auth.uid,
                        'email': auth.email,
                        'display-name': auth.displayName,
                        'photo-url': auth.photoURL
                    }).then(_ => {
                        if (!component.loginAsAgent) {
                            component.finishClientLogin(auth);
                        } else {
                            component.ngZone.run(function () {
                                component.router.navigate(['view-clients']);
                            });
                        }
                    });
                }
            });
        });
    }

    private finishClientLogin(auth) {
        const component = this;
        const userInsuranceListObj = component.db.object('/user-insurance-lists/' + auth.uid);
        userInsuranceListObj.query.once('value').then((existsResult) => {
            // result is the returned items json
            if (existsResult.exists()) {
                // something is returned
                component.ngZone.run(function () {
                    component.router.navigate(['']);
                });
            } else {
                // create the insurance list
                const defaultInsuranceList = component.db.object('/default-insurance-data/');
                defaultInsuranceList.query.once('value').then((defaultResult) => {
                    const defaultList = defaultResult.val();
                    const keyset = Object.keys(defaultList);
                    const userList = {};
                    for (let i = 0; i < keyset.length; i++) {
                        const item = defaultList[keyset[i]];
                        userList[keyset[i]] = {
                            'name': item['name'],
                            'cost': item['default-cost'],
                            'importance': item['default-importance'],
                            'description': item['description'],
                            'url': item['url']
                        }
                    }
                    userInsuranceListObj.set(userList).then(() => {
                        component.ngZone.run(function () {
                            component.router.navigate(['']);
                        });
                    });

                });
            }
        });
    }

    ngOnDestroy() {
        if (this.userDataSubscription) {
            this.userDataSubscription.unsubscribe();
        }
    }
}
